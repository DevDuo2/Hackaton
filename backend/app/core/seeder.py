import logging
from app.core.database import get_database
from app.data.database import SUBJECTS_DB, COURSES_DB, USERS_DB

logger = logging.getLogger(__name__)

async def seed_initial_data():
    """MongoDB bo'sh bo'lsa, platforma uchun kerakli fanlar va kurslarni avtomatik kiritadi"""
    db = get_database()
    if db is None:
        return

    try:
        # 1. Subjects seeder
        subjects_count = await db["subjects"].count_documents({})
        if subjects_count == 0:
            logger.info("MongoDB: Fanlar katalogi kiritilmoqda...")
            await db["subjects"].insert_many(SUBJECTS_DB)

        # 2. Courses seeder
        courses_count = await db["courses"].count_documents({})
        if courses_count == 0:
            logger.info("MongoDB: Kurslar katalogi kiritilmoqda...")
            await db["courses"].insert_many(COURSES_DB)

        # 3. Users seeder
        users_count = await db["users"].count_documents({})
        if users_count == 0:
            logger.info("MongoDB: Boshlang'ich foydalanuvchilar kiritilmoqda...")
            await db["users"].insert_many(USERS_DB)

        logger.info("✓ MongoDB boshlang'ich ma'lumotlar bilan muvaffaqiyatli to'ldirildi.")
    except Exception as e:
        logger.error(f"Seederda xatolik: {e}")
