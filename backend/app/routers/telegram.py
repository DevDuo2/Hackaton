"""Telegram bilan bog'lanish nuqtalari.

MUHIM: VOXY ning haqiqiy Telegram boti repo ildizidagi `app/bot` da va u **long polling**
bilan ishlaydi (`python -m app.bot`). Agar shu webhook Telegramga ro'yxatdan o'tkazilsa,
Telegram `getUpdates` ni rad etadi va bot ishlamay qoladi — shuning uchun bu endpoint
ataylab hech qanday javob logikasi bajarmaydi va faqat monitoring uchun qoldirilgan.

Ovozli suhbat Mini App ichida, Gemini Live orqali jonli kechadi (`app/services/live_bridge.py`),
ovozli xabarlar tahlili esa mavjud emas — shuning uchun bu yerda talaffuz bahosi qaytarilmaydi.
"""

import logging
import os

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from app.core.security import get_current_user
from app.models.schemas import TelegramLinkRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/telegram", tags=["Telegram Bot Webhook & Voice"])

MAX_UPDATE_BYTES = 64 * 1024


@router.post("/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    """Telegram update'larini qabul qiladi (hozircha hech narsa qilmaydi).

    `TELEGRAM_WEBHOOK_SECRET` sozlanmagan bo'lsa — 503. Aks holda har qanday odam bu
    manzilga istalgan "update" yuborib, log va metrikalarni to'ldirishi mumkin bo'lardi.
    """
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "").strip()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook sozlanmagan (TELEGRAM_WEBHOOK_SECRET yo'q).",
        )
    if x_telegram_bot_api_secret_token != secret:
        logger.warning("Telegram webhook: noto'g'ri secret token bilan so'rov keldi.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Secret token mos kelmadi.",
        )

    raw = await request.body()
    if len(raw) > MAX_UPDATE_BYTES:
        raise HTTPException(status_code=413, detail="Update hajmi juda katta.")

    # Telegram 200 dan boshqa javobda update'ni qayta-qayta yuboradi, shuning uchun 200 qaytaramiz.
    logger.info("Telegram webhook: update qabul qilindi (%d bayt), ishlov berilmadi.", len(raw))
    return {
        "status": "ignored",
        "reason": "voice_handled_by_mini_app",
        "detail": "Botni long polling ishlatadi; ovozli suhbat Mini App ichida kechadi.",
    }


@router.post("/link-account")
async def link_telegram_account(
    payload: TelegramLinkRequest,
    claims: dict = Depends(get_current_user),
):
    """Saytdagi o'quvchi profilini Telegram akkaunti bilan bog'laydi (profil tokendan olinadi)."""
    username = payload.telegramUsername.strip().lstrip("@")
    if not username or len(username) > 32 or not username.replace("_", "").isalnum():
        raise HTTPException(
            status_code=422,
            detail="Telegram username noto'g'ri (faqat harf, raqam va pastki chiziq).",
        )

    # TODO: bog'lanishni bazaga yozish — buning uchun ikki ilova o'rtasida `users` jadvalining
    # egasi kelishilishi kerak (README dagi "Scope and ownership" bo'limi).
    logger.info("Telegram bog'lash so'rovi: user=%s username=@%s", claims["sub"], username)
    return {
        "success": True,
        "linked": False,
        "telegramUsername": username,
        "message": (
            f"@{username} qabul qilindi. Bog'lanishni yakunlash uchun Telegramdagi VOXY botiga "
            "/start yuboring."
        ),
    }
