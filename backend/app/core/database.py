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
    try:
        logger.info(f"Connecting to MongoDB: {settings.DB_NAME}...")
        db.client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000
        )
        db.db = db.client[settings.DB_NAME]
        # Ping test
        await db.client.admin.command('ping')
        logger.info("✓ MongoDB ga muvaffaqiyatli ulandi!")
    except Exception as e:
        logger.warning(f"⚠️ MongoDB ulanmadi ({e}). Baza lokal xotira bilan zaxira rejimida ishlaydi.")

async def close_mongo_connection():
    """MongoDB ulanishini yopadi"""
    if db.client:
        db.client.close()
        logger.info("MongoDB ulanishi yopildi.")

def get_database():
    return db.db
