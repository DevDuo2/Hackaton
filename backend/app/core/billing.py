"""Obuna rejalari va ulardan kelib chiqadigan cheklovlar.

Nega cheklov kerak: `/api/ai/chat` har bir so'rovda PULLIK Gemini chaqiruvini
amalga oshiradi. Reja bo'lmasa, bitta foydalanuvchi butun kvotani sarflab,
demo o'rtasida AI murabbiyni o'chirib qo'yishi mumkin.

DIQQAT — to'lov tizimi ULANMAGAN. `activate` rejani darhol yoqadi va buni
yashirmaydi: javobda `paymentProvider: "demo"` qaytadi, UI esa buni ochiq
yozadi. Click/Payme/Stripe ulanganda faqat shu modul o'zgaradi: provayder
to'lovni tasdiqlagandan keyin `activate` chaqiriladi.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

from app.core.database import get_database

logger = logging.getLogger(__name__)

FREE_PLAN = "bepul"

# Narxlar so'mda: mahalliy auditoriya uchun valyuta konvertatsiyasi shart emas.
PLANS: dict[str, dict] = {
    FREE_PLAN: {
        "id": FREE_PLAN,
        "name": "Bepul",
        "priceUzs": 0,
        "period": "doimiy",
        "tagline": "Platformani sinab ko'rish uchun",
        "aiMessagesPerDay": 10,
        "voiceEnabled": False,
        "features": [
            "Kuniga 10 ta AI savol",
            "Barcha fanlar bo'yicha testlar",
            "Reyting va natijalar",
        ],
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "priceUzs": 49_000,
        "period": "oyiga",
        "tagline": "Muntazam tayyorgarlik ko'rayotganlar uchun",
        "aiMessagesPerDay": 200,
        "voiceEnabled": True,
        "features": [
            "Kuniga 200 ta AI savol",
            "Telegramda jonli ovozli suhbat",
            "Suhbat oxirida xulosa",
            "Barcha fanlar bo'yicha testlar",
        ],
    },
    "ustoz": {
        "id": "ustoz",
        "name": "Ustoz",
        "priceUzs": 129_000,
        "period": "oyiga",
        "tagline": "O'qituvchilar va repetitorlar uchun",
        "aiMessagesPerDay": 0,  # 0 = cheksiz
        "voiceEnabled": True,
        "features": [
            "Cheksiz AI savollar",
            "Telegramda jonli ovozli suhbat",
            "Suhbat oxirida xulosa",
            "Talabalar natijalarini kuzatish",
        ],
    },
}

PLAN_ORDER = [FREE_PLAN, "pro", "ustoz"]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def plan_for(user: dict) -> dict:
    """Foydalanuvchining AMALDAGI rejasi.

    Muddati o'tgan obuna avtomatik bepulga qaytadi — bazada `expiresAt` ni
    tozalash uchun alohida vazifa (cron) kerak emas.
    """
    subscription = user.get("subscription") or {}
    plan_id = subscription.get("plan", FREE_PLAN)
    if plan_id not in PLANS:
        return PLANS[FREE_PLAN]

    expires_raw = subscription.get("expiresAt")
    if plan_id != FREE_PLAN and isinstance(expires_raw, str):
        try:
            if datetime.fromisoformat(expires_raw) < _utc_now():
                return PLANS[FREE_PLAN]
        except ValueError:
            logger.warning("Obuna muddati noto'g'ri formatda: %r", expires_raw)
            return PLANS[FREE_PLAN]

    return PLANS[plan_id]


def subscription_state(user: dict) -> dict:
    """UI uchun: joriy reja, muddati va kunlik limitdan qolgani."""
    plan = plan_for(user)
    subscription = user.get("subscription") or {}
    used = _usage_today(user)
    limit = plan["aiMessagesPerDay"]

    return {
        "plan": plan["id"],
        "planName": plan["name"],
        "voiceEnabled": plan["voiceEnabled"],
        "aiMessagesPerDay": limit,
        "aiMessagesUsedToday": used,
        "aiMessagesLeftToday": None if limit == 0 else max(0, limit - used),
        "expiresAt": subscription.get("expiresAt"),
        "startedAt": subscription.get("startedAt"),
        # To'lov tizimi ulanmaganini UI ochiq ko'rsatishi uchun.
        "paymentProvider": subscription.get("paymentProvider", "demo"),
    }


def _usage_today(user: dict) -> int:
    usage = user.get("aiUsage") or {}
    if usage.get("date") != date.today().isoformat():
        return 0
    return int(usage.get("count", 0))


async def record_ai_message(user: dict) -> int:
    """Bugungi AI savollar sonini oshiradi va yangi qiymatni qaytaradi."""
    today = date.today().isoformat()
    count = _usage_today(user) + 1
    usage = {"date": today, "count": count}
    user["aiUsage"] = usage

    db = get_database()
    if db is not None:
        await db["users"].update_one({"id": user["id"]}, {"$set": {"aiUsage": usage}})
    return count


def remaining_ai_messages(user: dict) -> int | None:
    """Qolgan savollar soni; cheksiz reja uchun None."""
    plan = plan_for(user)
    if plan["aiMessagesPerDay"] == 0:
        return None
    return max(0, plan["aiMessagesPerDay"] - _usage_today(user))


async def activate(user: dict, plan_id: str, *, days: int = 30) -> dict:
    """Rejani yoqadi. To'lov tasdiqlangandan KEYIN chaqirilishi kerak.

    Hozir to'lov provayderi yo'q, shuning uchun `paymentProvider: "demo"`
    yoziladi — bu qiymat UI ga ham chiqadi va hech kim buni haqiqiy to'lov
    deb o'ylamaydi.
    """
    if plan_id not in PLANS:
        raise ValueError(f"Noma'lum reja: {plan_id}")

    now = _utc_now()
    if plan_id == FREE_PLAN:
        subscription = {
            "plan": FREE_PLAN,
            "startedAt": now.isoformat(),
            "expiresAt": None,
            "paymentProvider": "demo",
        }
    else:
        subscription = {
            "plan": plan_id,
            "startedAt": now.isoformat(),
            "expiresAt": (now + timedelta(days=days)).isoformat(),
            "paymentProvider": "demo",
        }

    user["subscription"] = subscription
    db = get_database()
    if db is not None:
        await db["users"].update_one(
            {"id": user["id"]}, {"$set": {"subscription": subscription}}
        )
    logger.info("Foydalanuvchi %s rejasi: %s", user.get("id"), plan_id)
    return subscription_state(user)


def public_plans() -> list[dict]:
    """Narxlar sahifasi uchun rejalar ro'yxati, tartibi bilan."""
    return [PLANS[plan_id] for plan_id in PLAN_ORDER]
