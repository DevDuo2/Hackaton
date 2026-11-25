import os
import secrets

from dotenv import load_dotenv

load_dotenv()

# Dev uchun imzo kaliti har bir jarayonda tasodifiy generatsiya qilinadi.
# Ilgari bu yerda barqaror literal turardi, u esa git'da chop etilgan: APP_ENV
# noto'g'ri yozilgan ("Production", bo'sh, yoki qo'lda yaratilgan servis) har
# qanday deployda tashqi odam {"role":"admin"} tokenini o'zi imzolab qo'ya
# olardi. Tasodifiy kalitda bu imkonsiz. Evaziga server qayta ishga tushganda
# lokal sessiyalar bekor bo'ladi — JWT_SECRET ni .env ga yozsangiz saqlanadi.
_DEV_FALLBACK_SECRET = secrets.token_urlsafe(48)

# Lokal frontend. Deployda CORS_ORIGINS env orqali to'ldiriladi.
_DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Render / Vercel preview manzillari oldindan ma'lum emas, shuning uchun regex.
PREVIEW_ORIGIN_REGEX = r"https://[a-zA-Z0-9-]+\.(onrender\.com|vercel\.app)"

# Lokalda frontend porti oldindan ma'lum emas: `next dev` 3000 band bo'lsa
# 3001, 3100 ... ga o'tib ketadi. Ro'yxatda esa faqat 3000 turardi, natijada
# brauzerdan boradigan HAR BIR so'rov (dashboard, reyting, fanlar) CORS bilan
# bloklanardi — login ishlagani uchun buni sezish qiyin edi: u Next proksisi
# orqali server tomonidan ketadi va CORS ga umuman tushmaydi.
_LOCALHOST_ORIGIN_REGEX = r"http://(localhost|127\.0\.0\.1):\d+"


class Settings:
    PROJECT_NAME: str = "VOXY AI Learning Platform"
    APP_ENV: str = os.getenv("APP_ENV", "development").strip().lower()
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "voxy_db")
    # Kalit env'dan keldimi? check_jwt_secret() shu bayroqqa qaraydi: tasodifiy
    # fallback'ni literal bilan solishtirib aniqlash mumkin emas.
    JWT_SECRET_CONFIGURED: bool = bool(os.getenv("JWT_SECRET", "").strip())
    JWT_SECRET: str = os.getenv("JWT_SECRET", "").strip() or _DEV_FALLBACK_SECRET
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins(self) -> list[str]:
        """CORS_ORIGINS="https://a.com,https://b.com" ko'rinishida beriladi.

        `*` ataylab qo'llanmaydi: allow_credentials=True bilan birga brauzerlar uni
        rad etadi va hech qanday himoya ham bermaydi.
        """
        raw = os.getenv("CORS_ORIGINS", "")
        configured = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
        return configured or list(_DEFAULT_ORIGINS)

    @property
    def cors_origin_regex(self) -> str:
        """Ro'yxatga qo'shimcha: preview manzillari va (faqat lokalda) har qanday port.

        Productionda kengaytma qo'shilmaydi — u yerda faqat aniq ro'yxat va
        Render/Vercel preview manzillari qoladi.
        """
        if self.is_production:
            return PREVIEW_ORIGIN_REGEX
        return f"({PREVIEW_ORIGIN_REGEX}|{_LOCALHOST_ORIGIN_REGEX})"


settings = Settings()
