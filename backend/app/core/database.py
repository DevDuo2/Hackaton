import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db = MongoDB()

async def connect_to_mongo():
    """MongoDB ga ulanishni hosil qiladi"""
    client = None
    try:
        logger.info(f"Connecting to MongoDB: {settings.DB_NAME}...")
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        # Ping o'tmaguncha `db.db` to'ldirilmaydi: aks holda get_database() o'lik
        # ulanishni qaytaradi va zaxira rejim o'rniga har bir so'rov 500 beradi.
        await client.admin.command("ping")
        db.client = client
        db.db = client[settings.DB_NAME]
        logger.info("✓ MongoDB ga muvaffaqiyatli ulandi!")
    except Exception as e:
        if client is not None:
            client.close()
        db.client = None
        db.db = None
        logger.warning(f"⚠️ MongoDB ulanmadi ({e}). Baza lokal xotira bilan zaxira rejimida ishlaydi.")

async def close_mongo_connection():
    """MongoDB ulanishini yopadi"""
    if db.client:
        db.client.close()
        logger.info("MongoDB ulanishi yopildi.")

def get_database():
    return db.db
