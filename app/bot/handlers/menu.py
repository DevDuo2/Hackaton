"""Inline main-menu button handlers."""

from __future__ import annotations

from telegram import InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.error import BadRequest
from telegram.ext import ContextTypes

from app.bot import texts
from app.bot.handlers.start import MINI_APP_URL_KEY, welcome_text
from app.bot.keyboards.main_menu import Callback, back_only, main_menu, open_mode


def _screen(data: str, mini_app_url: str, first_name: str | None) -> tuple[str, InlineKeyboardMarkup] | None:
    if data == Callback.VOICE_TUTOR:
        return texts.VOICE_TUTOR, open_mode(mini_app_url, "tutor")
    if data == Callback.ENGLISH:
        return texts.ENGLISH_SPEAKING, open_mode(mini_app_url, "english")
    if data == Callback.HELP:
        return texts.HELP, back_only()
    if data == Callback.MAIN:
        return welcome_text(first_name), main_menu(mini_app_url)
    return None


async def on_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()

    user = update.effective_user
    screen = _screen(query.data or "", context.bot_data[MINI_APP_URL_KEY], user.first_name if user else None)
    if screen is None:
        return
    text, markup = screen
    try:
        await query.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=markup)
    except BadRequest as exc:
        # Pressing the same button twice yields "message is not modified" — harmless.
        if "not modified" not in str(exc).lower():
            raise
