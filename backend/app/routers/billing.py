"""Obuna rejalarini ko'rish va yoqish.

To'lov provayderi ULANMAGAN — batafsil izoh `app/core/billing.py` da.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.billing import PLANS, activate, public_plans, subscription_state
from app.core.security import get_current_user
from app.core.users import find_user_by_id
from app.models.schemas import SubscribeRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/billing", tags=["Subscription"])


@router.get("/plans")
async def list_plans():
    """Rejalar ro'yxati — ochiq: narxlar sahifasi kirmasdan ham ko'rinadi."""
    return {"plans": public_plans(), "paymentProvider": "demo"}


async def _current_user_or_401(claims: dict) -> dict:
    user = await find_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya endi yaroqsiz. Iltimos, qaytadan kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.get("/me")
async def my_subscription(claims: dict = Depends(get_current_user)):
    """Joriy reja, muddati va bugungi limitdan qolgani."""
    user = await _current_user_or_401(claims)
    return {"subscription": subscription_state(user)}


@router.post("/subscribe")
async def subscribe(
    payload: SubscribeRequest,
    claims: dict = Depends(get_current_user),
):
    """Rejani yoqadi.

    To'lov provayderi ulanganda bu yerga uning tasdig'i qo'shiladi; hozircha
    javobda `paymentProvider: "demo"` qaytadi va UI buni ochiq yozadi.
    """
    if payload.plan not in PLANS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday reja mavjud emas.",
        )

    user = await _current_user_or_401(claims)
    updated = await activate(user, payload.plan)
    return {
        "success": True,
        "subscription": updated,
        "message": f"{PLANS[payload.plan]['name']} rejasi yoqildi.",
    }


@router.post("/cancel")
async def cancel(claims: dict = Depends(get_current_user)):
    """Obunani bekor qiladi — foydalanuvchi bepul rejaga qaytadi."""
    user = await _current_user_or_401(claims)
    updated = await activate(user, "bepul")
    return {
        "success": True,
        "subscription": updated,
        "message": "Obuna bekor qilindi. Bepul reja faol.",
    }
