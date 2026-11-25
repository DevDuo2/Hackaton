"""Telegram botni veb-servis jarayonining ICHIDA yurgizish.

Nega kerak: Render.com (va boshqa bepul hostinglar) bepul tarifda alohida
«Background Worker» bermaydi — faqat bitta veb-servis. Shu moduldagi funksiyalar
botni FastAPI ning asosiy event loop'ida long polling bilan ishga tushiradi,
ya'ni bitta bepul servis ham Mini App'ni, ham ovozli API'ni, ham botni yurgizadi.

Yoqilishi: RUN_BOT_IN_WEB=true (lokal ishlashda kerak emas — `python -m app.bot`).
Ogohlantirish: bu faqat BITTA instansiya bilan to'g'ri ishlaydi. Ikki instansiya
bir vaqtda polling qilsa, Telegram `Conflict` xatosini qaytaradi.
"""

from __future__ import annotations

import logging

from telegram import Update
from telegram.ext import Application

from app.bot.application import build_application
from app.config import ConfigError, Settings, require_bot_settings

logger = logging.getLogger("voxy.bot")


async def start_embedded_bot(settings: Settings) -> Application | None:
    """Botni ishga tushiradi va `Application` ni qaytaradi (yoki None).

    Hech qanday xato veb-servisni yiqitmaydi: Mini App va ovozli API botsiz ham
    ishlashi kerak.
    """
    try:
        bot_settings = require_bot_settings(settings)
    except ConfigError as exc:
        logger.warning("Bot jarayon ichida ishga tushmadi: %s", exc)
        return None

    application = build_application(bot_settings)
    try:
        await application.initialize()
        await application.start()
        await application.updater.start_polling(
            allowed_updates=Update.ALL_TYPES,
            # Bepul hosting uxlab qolganda kelgan xabarlar YO'QOLMASIN: uyg'ongach
            # bot ularga javob beradi. Kechikkan javob — javobsizlikdan yaxshi.
            drop_pending_updates=False,
        )
    except Exception:
        logger.exception("Botni ishga tushirib bo'lmadi — veb-servis botsiz davom etadi")
        await stop_embedded_bot(application)
        return None

    bot = application.bot
    logger.info("Bot jarayon ichida ishlayapti: @%s (mini app: %s)", bot.username, bot_settings.mini_app_url)
    return application


async def stop_embedded_bot(application: Application | None) -> None:
    """Botni tartibli to'xtatadi. Har bir qadam alohida himoyalangan."""
    if application is None:
        return
    for step in (
        lambda: application.updater.stop(),
        lambda: application.stop(),
        lambda: application.shutdown(),
    ):
        try:
            await step()
        except Exception:  # noqa: BLE001 — to'xtatishdagi xato deploy'ni to'sib qo'ymasligi kerak
            logger.debug("Botni to'xtatishda xato", exc_info=True)
