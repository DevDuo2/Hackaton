import logging

from pymongo import ASCENDING

from app.core.database import get_database
from app.data.database import COURSES_DB, SUBJECTS_DB, USERS_DB

logger = logging.getLogger(__name__)


async def _upsert_catalog(db, collection: str, rows: list[dict]) -> None:
    """Katalogni `id` bo'yicha kod bilan tenglashtiradi.

    Ilgari bu `count_documents({}) == 0` edi: baza bo'sh bo'lmasa seed umuman
    ishlamasdi. Natijada Atlasda eski fanlar ro'yxati qolib ketsa, frontenddagi
    `mockData.ts` dagi `id` lar bilan mos kelmay, talaba "Kimyo" ni tanlaganda
    server fanni topa olmasdi. Upsert har ishga tushishda katalogni tiklaydi.
    """
    for row in rows:
        await db[collection].update_one({"id": row["id"]}, {"$set": row}, upsert=True)


async def _ensure_demo_users(db) -> None:
    """Demo akkauntlarni yo'q bo'lsa yaratadi, BORINI tegmaydi.

    `$setOnInsert` ataylab: `$set` bo'lsa server har qayta ishga tushganda
    demo talabaning XP va seriyasini nolga qaytarib yuborardi (Render'ning
    bepul rejimi servisni uyquga qo'yadi — demo o'rtasida ham bo'lishi mumkin).
    """
    for user in USERS_DB:
        await db["users"].update_one(
            {"id": user["id"]}, {"$setOnInsert": dict(user)}, upsert=True
        )


async def _ensure_indexes(db) -> None:
    """`email` bo'yicha unique indeks: bir xil email bilan ikki akkaunt bo'lmaydi.

    Kodda tekshiruv bor (`find_user` keyin `insert`), lekin u poyga holatiga
    ochiq: ikki so'rov bir vaqtda kelsa, ikkisi ham "email bo'sh" deb ko'radi.
    Indeks buni bazaning o'zida yopadi.

    Agar bazada allaqachon takroriy email bo'lsa, indeks yaratilmaydi — shuning
    uchun xatoni yutmasdan aniq ogohlantirish yoziladi, aks holda himoya yo'qligi
    sezilmay qolardi.
    """
    try:
        await db["users"].create_index([("email", ASCENDING)], unique=True, name="uniq_email")
    except Exception as e:
        logger.warning(
            "users.email uchun unique indeks yaratilmadi (%s). Ehtimol bazada "
            "takroriy email bor — avval dublikatlarni tozalang.",
            e,
        )


async def seed_initial_data():
    """Fanlar/kurslar katalogini tiklaydi va demo akkauntlar borligini ta'minlaydi."""
    db = get_database()
    if db is None:
        return

    try:
        await _upsert_catalog(db, "subjects", SUBJECTS_DB)
        await _upsert_catalog(db, "courses", COURSES_DB)
        await _ensure_demo_users(db)
        await _ensure_indexes(db)
        logger.info("✓ MongoDB katalog va demo akkauntlar tekshirildi.")
    except Exception as e:
        logger.error(f"Seederda xatolik: {e}")
