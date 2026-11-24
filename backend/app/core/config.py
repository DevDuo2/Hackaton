import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "VOXY AI Learning Platform"
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "voxy_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "voxy_hackaton_jwt_secret_key_2026")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "*"
    ]

settings = Settings()
