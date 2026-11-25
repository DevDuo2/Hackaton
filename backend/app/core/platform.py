"""Platforma sozlamalari — admin panelidan boshqariladi.

Ilgari /admin/settings sahifasi «Saqlandi» yozuvini ko'rsatib, aslida hech
narsa saqlamasdi: `handleSave` faqat state'ni o'zgartirardi. Endi sozlamalar
bazada saqlanadi va HAQIQATDAN kuchga kiradi (ro'yxatdan o'tishni yopish,
texnik tanaffus rejimi).
"""

from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, status

from app.core.database import get_database
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

_COLLECTION = "platform_settings"
_DOC_ID = "platform"

DEFAULTS: dict = {
    "platformName": "VOXY AI Learning Platform",
    "allowRegistration": True,
    "maintenanceMode": False,
}

# Mongo ulanmagan demo rejimi uchun xotiradagi nusxa (tiketlar bilan bir xil yondashuv).
_memory: dict = dict(DEFAULTS)


def _merge(doc: dict | None) -> dict:
    """Faqat ma'lum kalitlar olinadi: bazadagi begona maydon javobga tushmaydi."""
    known = {k: v for k, v in (doc or {}).items() if k in DEFAULTS}
    return {**DEFAULTS, **known}


async def get_settings() -> dict:
    db = get_database()
    if db is None:
        return dict(_memory)
    try:
        doc = await db[_COLLECTION].find_one({"id": _DOC_ID}, {"_id": 0})
    except Exception as e:
        # O'qish ishlamasa ham sayt ishlashda davom etadi: sozlama — yordamchi
        # narsa, uning yo'qligi butun API ni to'xtatib qo'ymasligi kerak.
        logger.warning("Platforma sozlamalarini o'qib bo'lmadi: %s", e)
        return dict(_memory)
    return _merge(doc)


async def save_settings(changes: dict) -> dict:
    """Sozlamalarni saqlaydi. Bazaga yozib bo'lmasa — xato KO'TARILADI.

    Xatoni yutib «muvaffaqiyatli» deb qaytarish aynan tuzatilayotgan nuqson edi:
    admin «Saqlandi» ni ko'rib, keyin sahifani yangilaganda eski qiymatni topardi.
    """
    allowed = {k: v for k, v in changes.items() if k in DEFAULTS and v is not None}
    if not allowed:
        return await get_settings()

    db = get_database()
    if db is not None:
        await db[_COLLECTION].update_one(
            {"id": _DOC_ID}, {"$set": {"id": _DOC_ID, **allowed}}, upsert=True
        )

    _memory.update(allowed)
    return await get_settings()


def reset_memory_settings() -> None:
    """Testlar uchun: xotiradagi nusxani standart holatga qaytaradi."""
    _memory.clear()
    _memory.update(DEFAULTS)


async def require_service_available(claims: dict = Depends(get_current_user)) -> dict:
    """Texnik tanaffus rejimida talabalar uchun yozish amallarini to'xtatadi.

    Admin o'tib ketadi — aks holda rejimni yoqqandan keyin uni o'sha panelning
    o'zidan o'chirib bo'lmay qolardi.
    """
    settings = await get_settings()
    if settings.get("maintenanceMode") and claims.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Platformada texnik ishlar olib borilmoqda. Birozdan keyin urinib ko'ring.",
        )
    return claims
