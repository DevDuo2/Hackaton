import time

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.platform import get_settings
from app.core.ratelimit import (
    client_key,
    identity_key,
    login_ip_limiter,
    login_limiter,
    register_limiter,
)
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.core.users import (
    create_user,
    find_user,
    find_user_by_id,
    progress_summary,
    public_user,
    touch_streak,
    update_user,
    upgrade_password_hash,
)
from app.data.database import SUBJECTS_DB
from app.models.schemas import AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

MIN_PASSWORD_LENGTH = 6
_DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request):
    # Parolni cheksiz sinab ko'rishdan himoya. Kalit — AKKAUNT, IP emas:
    # hakaton zalida hamma bitta NAT ortida bo'ladi va bir odamning xato
    # urinishlari qolganlarning to'g'ri parolini bloklab qo'yardi.
    login_limiter.check(identity_key(payload.email, "login"))
    # Bitta host ko'p akkauntni birma-bir sinab ko'rmasligi uchun (bo'sh limit).
    login_ip_limiter.check(client_key(request, "login-ip"))

    user = await find_user(payload.email)

    # Foydalanuvchi yo'qligi va parol xatosi bir xil javob beradi: aks holda
    # qaysi emaillar ro'yxatdan o'tganini tashqaridan sanab olish mumkin bo'ladi.
    if not user or not verify_password(payload.password, user.get("password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email yoki parol noto'g'ri.",
        )

    await upgrade_password_hash(user, payload.password)
    # Kunlik faollik seriyasi shu yerda yangilanadi: ilgari `streakDays`
    # ro'yxatdan o'tishdagi `1` da qotib qolardi.
    await touch_streak(user)
    return AuthResponse(
        success=True,
        token=create_access_token(user),
        user=public_user(user, include_email=True),
        message="Muvaffaqiyatli tizimga kirildi.",
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, request: Request):
    register_limiter.check(client_key(request, "register"))

    # Admin panelidagi «Ommaviy ro'yxatdan o'tish» kalitchasi HAQIQATAN kuchga
    # kiradi: ilgari u faqat UI holati edi va hech narsani to'xtatmasdi.
    platform = await get_settings()
    if not platform.get("allowRegistration", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ro'yxatdan o'tish vaqtincha yopilgan. Administrator bilan bog'laning.",
        )

    email = payload.email.lower().strip()
    name = payload.name.strip()

    if len(payload.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Parol kamida {MIN_PASSWORD_LENGTH} ta belgidan iborat bo'lishi kerak.",
        )
    if not name:
        raise HTTPException(
            status_code=422,
            detail="Ism kiritilishi shart.",
        )

    if await find_user(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ushbu email manzili allaqachon ro'yxatdan o'tgan.",
        )

    new_user = {
        "id": f"u_{int(time.time() * 1000)}",
        "name": name,
        "email": email,
        "password": hash_password(payload.password),
        # Rol hech qachon email matnidan olinmaydi: "admin" so'zi bor email
        # yozib adminga aylanib qolish mumkin emas.
        "role": "student",
        "selectedSubject": "matematika",
        "avatar": _DEFAULT_AVATAR,
        "totalXP": 0,
        "streakDays": 1,
        # Seriya shu kundan sanaladi — `touch_streak` uchun tayanch nuqta.
        "lastActiveDate": time.strftime("%Y-%m-%d", time.gmtime()),
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    await create_user(new_user)

    return AuthResponse(
        success=True,
        token=create_access_token(new_user),
        user=public_user(new_user, include_email=True),
        message="Muvaffaqiyatli ro'yxatdan o'tdingiz.",
    )


@router.get("/me")
async def get_current_profile(claims: dict = Depends(get_current_user)):
    """Tokendagi `sub` bo'yicha profilni qaytaradi (token yo'q bo'lsa — 401)."""
    user = await find_user_by_id(claims["sub"])
    if not user:
        # 404 emas, 401: token amal qiladi, lekin u endi hech kimni bildirmaydi
        # (akkaunt o'chirilgan yoki baza almashgan). Frontend 401 da sessiyani
        # tozalab login sahifasiga qaytaradi — aks holda foydalanuvchi bo'sh
        # «kirgan» interfeysda qolib ketadi.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya endi yaroqsiz. Iltimos, qaytadan kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {
        "authenticated": True,
        "user": public_user(user, include_preferences=True, include_email=True),
        # Fanlar bo'yicha haqiqiy o'zlashtirish — /progress sahifasi uchun.
        "progress": progress_summary(user),
    }


MAX_NAME_LENGTH = 64
ALLOWED_LANGUAGES = {"uz", "ru", "en", "Uzbek (Lotin)", "Русский", "English"}


@router.patch("/me")
async def update_profile(
    payload: UpdateProfileRequest,
    claims: dict = Depends(get_current_user),
):
    """Profilni yangilaydi. Kimning profili — tokendan, so'rov tanasidan emas."""
    user = await find_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya endi yaroqsiz. Iltimos, qaytadan kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    changes: dict = {}
    if payload.name is not None:
        name = payload.name.strip()
        if not name or len(name) > MAX_NAME_LENGTH:
            raise HTTPException(
                status_code=422,
                detail=f"Ism bo'sh bo'lmasligi va {MAX_NAME_LENGTH} belgidan oshmasligi kerak.",
            )
        changes["name"] = name
    if payload.language is not None:
        if payload.language not in ALLOWED_LANGUAGES:
            raise HTTPException(status_code=422, detail="Bunday til qo'llab-quvvatlanmaydi.")
        changes["language"] = payload.language
    if payload.notifications is not None:
        changes["notifications"] = payload.notifications
    if payload.selectedSubject is not None:
        if not any(s["id"] == payload.selectedSubject for s in SUBJECTS_DB):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bunday fan topilmadi.")
        changes["selectedSubject"] = payload.selectedSubject

    if not changes:
        raise HTTPException(status_code=422, detail="O'zgartirish uchun hech narsa yuborilmadi.")

    await update_user(user, changes)
    return {
        "success": True,
        "user": public_user(user, include_preferences=True, include_email=True),
        "message": "Profil saqlandi.",
    }
