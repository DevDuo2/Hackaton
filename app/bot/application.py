from __future__ import annotations

from telegram.ext import Application, CallbackQueryHandler, CommandHandler

from app.bot.handlers.menu import on_menu
from app.bot.handlers.start import MINI_APP_URL_KEY, help_command, start
from app.config import BotSettings


# PTB defaults to 5 s; a real run timed out on the first Bot API call over a slow link
# (api.telegram.org connect took 1-3 s). Generous timeouts make startup and polling robust.
TELEGRAM_CONNECT_TIMEOUT = 20.0
TELEGRAM_READ_TIMEOUT = 30.0


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
        .build()
    )
    application.bot_data[MINI_APP_URL_KEY] = settings.mini_app_url

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CallbackQueryHandler(on_menu, pattern=r"^menu:"))
    return application
