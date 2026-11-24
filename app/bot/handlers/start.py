from __future__ import annotations

from html import escape

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot import texts
from app.bot.keyboards.main_menu import back_only, main_menu

MINI_APP_URL_KEY = "mini_app_url"


def welcome_text(first_name: str | None) -> str:
    # Text content only (not an attribute), so quotes don't need escaping.
    return texts.WELCOME.format(name=escape(first_name or "do'stim", quote=False))


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    user = update.effective_user
    await update.message.reply_text(
        welcome_text(user.first_name if user else None),
        parse_mode=ParseMode.HTML,
        reply_markup=main_menu(context.bot_data[MINI_APP_URL_KEY]),
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    await update.message.reply_text(texts.HELP, parse_mode=ParseMode.HTML, reply_markup=back_only())
