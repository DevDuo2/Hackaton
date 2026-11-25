"""Parol hashlash va JWT tokenlar — faqat standart kutubxona bilan.

Qo'shimcha paket (passlib / PyJWT) kerak emas: hashlib.pbkdf2_hmac va hmac yetarli.
Token formati haqiqiy JWT (HS256), shuning uchun kerak bo'lsa jwt.io da ham o'qiladi.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

logger = logging.getLogger(__name__)

_ALGO = "pbkdf2_sha256"
_ITERATIONS = 240_000
_SALT_BYTES = 16
TOKEN_TTL_SECONDS = 7 * 24 * 3600


# ---------------------------------------------------------------- parollar

def hash_password(raw: str) -> str:
    """`pbkdf2_sha256$<iterations>$<salt_b64>$<hash_b64>` ko'rinishida qaytaradi."""
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac("sha256", raw.encode("utf-8"), salt, _ITERATIONS)
    return f"{_ALGO}${_ITERATIONS}${_b64(salt)}${_b64(digest)}"


def is_hashed(stored: str | None) -> bool:
    return bool(stored) and stored.startswith(f"{_ALGO}$")


def verify_password(raw: str, stored: str | None) -> bool:
    """Hashlangan parolni tekslaydi.

    Atlas bazasida eski seed foydalanuvchilarning paroli ochiq matnda yotgan bo'lishi
    mumkin, shuning uchun ularni ham qabul qilamiz — lekin muvaffaqiyatli kirishdan
    keyin chaqiruvchi `needs_rehash` bilan hashga o'tkazib qo'yadi.
    """
    if not stored or not raw:
        return False
    if not is_hashed(stored):
        # Baytlar bo'yicha solishtiriladi: `compare_digest` ikki `str` ni faqat
        # ASCII bo'lsa qabul qiladi va kirill/lotin bo'lmagan parolda TypeError
        # berardi. Natijada parolda bitta "ё" bo'lsa login 500 qaytarar, bu esa
        # qaysi akkauntlarda parol hali hashlanmaganini tashqaridan ko'rsatardi.
        return hmac.compare_digest(raw.encode("utf-8"), stored.encode("utf-8"))
    try:
        _, iterations, salt_b64, hash_b64 = stored.split("$", 3)
        digest = hashlib.pbkdf2_hmac(
            "sha256", raw.encode("utf-8"), _unb64(salt_b64), int(iterations)
        )
    except (ValueError, TypeError):
        logger.warning("Parol hashi buzilgan formatda, kirish rad etildi.")
        return False
    return hmac.compare_digest(digest, _unb64(hash_b64))


def needs_rehash(stored: str | None) -> bool:
    return not is_hashed(stored)


# ---------------------------------------------------------------- tokenlar

def _secret() -> bytes:
    return settings.JWT_SECRET.encode("utf-8")


def create_access_token(user: dict, ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    now = int(time.time())
    payload = {
        "sub": user["id"],
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "role": user.get("role", "student"),
        "iat": now,
        "exp": now + ttl_seconds,
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = f"{_b64(_json(header))}.{_b64(_json(payload))}"
    signature = hmac.new(_secret(), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64(signature)}"


def decode_access_token(token: str) -> dict:
    """Imzo va muddatni tekshiradi. Noto'g'ri bo'lsa 401 chiqaradi."""
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        expected = hmac.new(
            _secret(), f"{header_b64}.{payload_b64}".encode("ascii"), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected, _unb64(signature_b64)):
            raise ValueError("imzo mos kelmadi")
        payload = json.loads(_unb64(payload_b64))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token yaroqsiz. Iltimos, qaytadan tizimga kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token muddati tugagan. Iltimos, qaytadan tizimga kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


_bearer = HTTPBearer(auto_error=False, description="Login javobidagi `token`")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """`Authorization: Bearer <token>` sarlavhasidan foydalanuvchi ma'lumotini oladi."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Avtorizatsiya talab qilinadi.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decode_access_token(credentials.credentials)


async def require_admin(claims: dict = Depends(get_current_user)) -> dict:
    if claims.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan: administrator huquqi kerak.",
        )
    return claims


def check_jwt_secret() -> None:
    """Production'da kalitsiz ishga tushishni to'xtatadi.

    Kalit berilmasa config.py tasodifiy fallback yasaydi — token yasab bo'lmaydi,
    lekin jarayon qayta ishga tushganda hamma sessiya bekor bo'ladi. Shuning uchun
    productionda hali ham majburiy, lokalda esa ogohlantirish yetarli.
    """
    if settings.JWT_SECRET_CONFIGURED:
        return
    if settings.is_production:
        raise RuntimeError(
            "JWT_SECRET sozlanmagan. APP_ENV=production uchun tasodifiy kalit kerak: "
            'python -c "import secrets; print(secrets.token_urlsafe(48))"'
        )
    logger.warning(
        "JWT_SECRET berilmagan — shu jarayon uchun tasodifiy kalit yasaldi. "
        "Server qayta ishga tushganda tizimga qaytadan kirish kerak bo'ladi; "
        "buni xohlamasangiz .env ga JWT_SECRET yozib qo'ying."
    )


# ---------------------------------------------------------------- yordamchilar

def _json(obj: dict) -> bytes:
    return json.dumps(obj, separators=(",", ":"), sort_keys=True).encode("utf-8")


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _unb64(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))
