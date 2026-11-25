from __future__ import annotations

import logging

from telegram import BotCommand
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters

from app.bot.handlers.fallback import on_unknown, on_unknown_command, on_voice
from app.bot.handlers.menu import on_menu
from app.bot.handlers.start import MINI_APP_URL_KEY, help_command, start
from app.config import BotSettings

logger = logging.getLogger("voxy.bot")


# PTB defaults to 5 s; a real run timed out on the first Bot API call over a slow link
# (api.telegram.org connect took 1-3 s). Generous timeouts make startup and polling robust.
TELEGRAM_CONNECT_TIMEOUT = 20.0
TELEGRAM_READ_TIMEOUT = 30.0


# Telegram menyusida ko'rinadigan buyruqlar (getMyCommands bo'sh bo'lsa, menyu ham bo'sh).
BOT_COMMANDS = (
    BotCommand("start", "Menyuni ochish"),
    BotCommand("help", "Yordam va qisqa qo'llanma"),
)


async def _register_commands(application: Application) -> None:
    """Har ishga tushishda buyruqlar ro'yxatini Telegramga yozadi.

    Xato bo'lsa ham bot ishlashda davom etadi — bu faqat menyu ko'rinishi.
    """
    try:
        await application.bot.set_my_commands(BOT_COMMANDS)
    except Exception:  # noqa: BLE001
        logger.warning("Buyruqlar ro'yxatini yangilab bo'lmadi", exc_info=True)


def build_application(settings: BotSettings) -> Application:
    application = (
        Application.builder()
        .token(settings.bot_token)
        .connect_timeout(TELEGRAM_CONNECT_TIMEOUT)
        .read_timeout(TELEGRAM_READ_TIMEOUT)
        .write_timeout(TELEGRAM_READ_TIMEOUT)
        .pool_timeout(TELEGRAM_CONNECT_TIMEOUT)
        .get_updates_connect_timeout(TELEGRAM_CONNECT_TIMEOUT)
        .get_updates_read_timeout(TELEGRAM_READ_TIMEOUT)
        .post_init(_register_commands)
        .build()
    )
    application.bot_data[MINI_APP_URL_KEY] = settings.mini_app_url

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CallbackQueryHandler(on_menu, pattern=r"^menu:"))
    # Registered last: a bot that silently ignores a message looks broken. Voice notes get a
    # dedicated answer, everything else a short hint. Service updates (joins, pins) are skipped.
    application.add_handler(MessageHandler(filters.VOICE | filters.VIDEO_NOTE | filters.AUDIO, on_voice))
    application.add_handler(MessageHandler(~filters.COMMAND & ~filters.StatusUpdate.ALL, on_unknown))
    # Eng oxirida: tanilmagan buyruq (/menu, /foo). Ma'lum buyruqlar yuqorida
    # ro'yxatdan o'tgan va PTB handlerlarni tartib bo'yicha tekshirgani uchun
    # /start va /help bu yerga yetib kelmaydi.
    application.add_handler(MessageHandler(filters.COMMAND, on_unknown_command))
    return application
