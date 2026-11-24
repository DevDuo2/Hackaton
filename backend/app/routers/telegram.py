from fastapi import APIRouter, Request
from app.models.schemas import TelegramLinkRequest

router = APIRouter(prefix="/api/telegram", tags=["Telegram Bot Webhook & Voice"])

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Do'stingiz yaratayotgan Telegram botidan xabarlarni qabul qiluvchi webhook.
    Ovozli xabarlar (voice messages) shu endpointga keladi.
    """
    body = await request.json()
    message = body.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    voice = message.get("voice")

    if voice:
        # Voice processing simulation
        return {
            "status": "ok",
            "chat_id": chat_id,
            "type": "voice",
            "ai_response": "Ovozingiz qabul qilindi. Sizning talaffuzingiz: 92% to'g'ri!",
        }

    return {"status": "ok", "message": "Matnli xabar qabul qilindi"}

@router.post("/link-account")
def link_telegram_account(payload: TelegramLinkRequest):
    """Saytdagi o'quvchi profilini Telegram bot bilan bog'laydi"""
    return {
        "success": True,
        "message": f"@{payload.telegramUsername} akkaunti profilingizga muvaffaqiyatli bog'landi."
    }
