"""Foydalanuvchilar ustida yagona kirish nuqtasi.

MongoDB ulansa — Atlas, ulanmasa — xotiradagi USERS_DB (demo rejim). Avval bu
shoxlanish har bir routerda takrorlanar edi; endi bir joyda.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone

from app.core.database import get_database
from app.core.security import hash_password, needs_rehash
from app.data.database import SUBJECTS_DB, USERS_DB

logger = logging.getLogger(__name__)

_PUBLIC_FIELDS = ("id", "name", "role", "selectedSubject", "avatar", "totalXP", "streakDays")
# Faqat o'z profilida qaytariladi: reytingda boshqa odamning sozlamasi kerak emas.
_PREFERENCE_FIELDS = ("language", "notifications")
_DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"


def public_user(
    user: dict, *, include_preferences: bool = False, include_email: bool = False
) -> dict:
    """Parol va Mongo `_id` ni tashlab, frontendga ketadigan qismini qaytaradi.

    `include_preferences=True` — foydalanuvchining O'Z profili uchun: til va
    bildirishnoma sozlamalari ham qaytariladi, aks holda sozlamalar saqlangandan
    keyin sahifa yangilanganda yo'qolgandek ko'rinadi.

    `include_email=True` — faqat o'z sessiyasi va admin ro'yxati uchun. Email
    sukut bo'yicha YUBORILMAYDI: `/api/quizzes/leaderboard` ochiq endpoint va
    ilgari u har bir ro'yxatdan o'tgan odamning emailini tarqatib yurardi.
    """
    data = {k: user.get(k) for k in _PUBLIC_FIELDS if user.get(k) is not None}
    if include_email and user.get("email") is not None:
        data["email"] = user["email"]
    if include_preferences:
        data.update({k: user[k] for k in _PREFERENCE_FIELDS if k in user})
    data.setdefault("selectedSubject", "matematika")
    data.setdefault("avatar", _DEFAULT_AVATAR)
    # Faqat son: boshqa odamning qaysi savollarga javob berganini bilish shart emas.
    data["answeredCount"] = len(user.get("answeredQuizzes") or [])
    return data


def _matches(user: dict, login: str) -> bool:
    if user.get("email", "").lower() == login:
        return True
    if (user.get("username") or "").lower() == login:
        return True
    return login == "admin" and user.get("role") == "admin"


async def find_user(login: str) -> dict | None:
    """Email yoki username bo'yicha topadi. `admin` — adminning qisqa logini."""
    login = login.lower().strip()
    db = get_database()
    if db is not None:
        query = {"$or": [{"email": login}, {"username": login}]}
        if login == "admin":
            query = {"$or": [{"username": "admin"}, {"email": "admin@voxy.edu"}, {"role": "admin"}]}
        user = await db["users"].find_one(query, {"_id": 0})
        if user:
            return user
        return None
    return next((u for u in USERS_DB if _matches(u, login)), None)


async def find_user_by_id(user_id: str) -> dict | None:
    db = get_database()
    if db is not None:
        return await db["users"].find_one({"id": user_id}, {"_id": 0})
    return next((u for u in USERS_DB if u["id"] == user_id), None)


async def create_user(user: dict) -> None:
    db = get_database()
    if db is not None:
        await db["users"].insert_one(dict(user))
        return
    USERS_DB.append(user)


async def upgrade_password_hash(user: dict, raw_password: str) -> None:
    """Bazada ochiq matnda yotgan eski parolni muvaffaqiyatli kirishdan keyin hashga o'tkazadi."""
    if not needs_rehash(user.get("password")):
        return
    new_hash = hash_password(raw_password)
    user["password"] = new_hash
    db = get_database()
    if db is not None:
        await db["users"].update_one({"id": user["id"]}, {"$set": {"password": new_hash}})
    logger.info("Foydalanuvchi %s paroli hashga o'tkazildi.", user["id"])


async def update_user(user: dict, changes: dict) -> None:
    """Profil maydonlarini yangilaydi. `changes` ichida faqat ruxsat etilgan maydonlar
    bo'lishi kerak — tekshiruv chaqiruvchi tomonda (routers/auth.py)."""
    user.update(changes)
    db = get_database()
    if db is not None:
        await db["users"].update_one({"id": user["id"]}, {"$set": changes})


async def record_quiz_answer(user: dict, question_id: int, earned_xp: int) -> None:
    """Savolni «javob berilgan» deb belgilaydi va XP qo'shadi.

    Shu ro'yxat tufayli bitta savolni qayta-qayta yuborib XP to'plab bo'lmaydi.
    """
    answered = list(user.get("answeredQuizzes", []))
    if question_id not in answered:
        answered.append(question_id)
    user["answeredQuizzes"] = answered
    user["totalXP"] = user.get("totalXP", 0) + earned_xp

    db = get_database()
    if db is not None:
        await db["users"].update_one(
            {"id": user["id"]},
            {"$addToSet": {"answeredQuizzes": question_id}, "$inc": {"totalXP": earned_xp}},
        )


def has_answered(user: dict, question_id: int) -> bool:
    return question_id in (user.get("answeredQuizzes") or [])


def progress_summary(user: dict) -> dict:
    """Foydalanuvchining HAQIQIY o'zlashtirish ko'rsatkichi, fanlar bo'yicha.

    Frontend buni o'zi hisoblab chiqa olmaydi: `/api/subjects/` savollar ro'yxatini
    ataylab bermaydi (javoblar bilan birga ketib qolmasligi uchun), `/api/auth/me`
    esa faqat umumiy sonni qaytarardi. Shuning uchun hisob shu yerda — bazadagi
    `answeredQuizzes` va seed katalogi yonida.

    Faqat O'Z profilida qaytariladi: kim qaysi savolga javob berganini boshqalar
    ko'rmasligi kerak.
    """
    answered = set(user.get("answeredQuizzes") or [])

    by_subject = []
    total_questions = 0
    for subject in SUBJECTS_DB:
        question_ids = [q["id"] for q in subject.get("quizzes", [])]
        if not question_ids:
            continue
        total_questions += len(question_ids)
        by_subject.append({
            "subjectId": subject["id"],
            "name": subject["name"],
            "iconSymbol": subject.get("iconSymbol", ""),
            "color": subject.get("color", "#2563EB"),
            "answered": sum(1 for qid in question_ids if qid in answered),
            "total": len(question_ids),
        })

    return {
        "answeredCount": len(answered),
        "totalQuestions": total_questions,
        "bySubject": by_subject,
    }


def _utc_today() -> date:
    return datetime.now(timezone.utc).date()


async def touch_streak(user: dict, *, today: date | None = None) -> int:
    """Kunlik faollik seriyasini yangilaydi va yangi qiymatni qaytaradi.

    Ilgari `streakDays` faqat ro'yxatdan o'tishda `1` deb yozilar va boshqa
    hech qayerda o'zgarmasdi: profil, dashboard va nishonlar doim «1 kun»
    ko'rsatib turardi, ya'ni butun geymifikatsiya o'lik edi.

    Qoida: bugun allaqachon hisoblangan bo'lsa — tegilmaydi; kecha faol
    bo'lgan bo'lsa +1; tanaffus bo'lgan bo'lsa 1 dan qayta boshlanadi.
    """
    current = today or _utc_today()
    last_raw = user.get("lastActiveDate")

    last: date | None = None
    if isinstance(last_raw, str):
        try:
            last = date.fromisoformat(last_raw)
        except ValueError:
            last = None

    if last == current:
        return int(user.get("streakDays") or 1)

    if last is not None and (current - last).days == 1:
        streak = int(user.get("streakDays") or 0) + 1
    else:
        streak = 1

    changes = {"streakDays": streak, "lastActiveDate": current.isoformat()}
    user.update(changes)

    db = get_database()
    if db is not None:
        await db["users"].update_one({"id": user["id"]}, {"$set": changes})
    return streak
