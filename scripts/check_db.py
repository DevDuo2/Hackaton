"""Atlas ulanishini tekshiradi: `.env` dagi MONGO_URI ishlayaptimi.

Ishga tushirish (loyiha ildizidan):
    .venv\\Scripts\\python.exe scripts\\check_db.py

Parolni almashtirgandan keyin shuni chaqiring — xatoni darhol ko'rasiz,
serverni ko'tarib kutib o'tirmasdan. Parolning o'zi hech qayerda chop
etilmaydi.
"""

from __future__ import annotations

import asyncio
import re
import sys
from pathlib import Path
from urllib.parse import quote_plus, urlparse

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

PLACEHOLDERS = ("<FOYDALANUVCHI>", "<PAROL>", "<user>", "<password>")
# Ulanish satrini buzadigan belgilar: ular URL'da alohida ma'no tashiydi.
UNSAFE_IN_PASSWORD = set("@:/?#[]%")


def read_uri() -> str | None:
    env = ROOT / ".env"
    if not env.exists():
        print("XATO: .env fayli topilmadi.")
        return None
    match = re.search(r'^MONGO_URI\s*=\s*"?([^"\r\n]+)"?', env.read_text(encoding="utf-8"), re.M)
    if not match:
        print("XATO: .env ichida MONGO_URI yo'q.")
        return None
    return match.group(1).strip()


def inspect(uri: str) -> bool:
    """Ulanishdan OLDIN ko'zga tashlanadigan xatolarni aytadi."""
    for placeholder in PLACEHOLDERS:
        if placeholder in uri:
            print(f"XATO: MONGO_URI da hali {placeholder} turibdi — uni to'ldiring.")
            return False

    parsed = urlparse(uri)
    if not parsed.hostname:
        print("XATO: MONGO_URI noto'g'ri formatda.")
        return False

    print(f"Klaster      : {parsed.hostname}")
    print(f"Foydalanuvchi: {parsed.username}")

    password = parsed.password or ""
    if not password:
        print("XATO: parol ko'rsatilmagan.")
        return False

    bad = UNSAFE_IN_PASSWORD & set(password)
    if bad:
        encoded = quote_plus(password)
        print(f"DIQQAT: parolda {' '.join(sorted(bad))} belgilari bor — ular satrni buzadi.")
        print("        Atlas'da parolni qayta generatsiya qiling yoki shu ko'rinishda yozing:")
        print(f"        ...:{encoded}@...")
        return False

    print(f"Parol        : berilgan ({len(password)} belgi)")
    return True


async def connect() -> int:
    from app.core.database import connect_to_mongo, get_database

    await connect_to_mongo()
    db = get_database()
    if db is None:
        print()
        print("NATIJA: ULANMADI.")
        print("  Tekshiring: parol to'g'rimi, va Atlas -> Network Access da")
        print("  IP ruxsati bormi (Render uchun 0.0.0.0/0 kerak bo'ladi).")
        return 1

    users = await db["users"].count_documents({})
    subjects = await db["subjects"].count_documents({})
    print()
    print("NATIJA: ULANDI.")
    print(f"  foydalanuvchilar: {users}")
    print(f"  fanlar          : {subjects}")
    if users == 0:
        print("  (baza bo'sh — server birinchi ishga tushganda seed qiladi)")
    return 0


def main() -> int:
    uri = read_uri()
    if uri is None:
        return 1
    if not inspect(uri):
        return 1
    return asyncio.run(connect())


if __name__ == "__main__":
    raise SystemExit(main())
