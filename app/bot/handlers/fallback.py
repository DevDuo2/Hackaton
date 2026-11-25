"""Replies to anything that isn't /start or /help.

Without this the bot stays completely silent when a student sends a voice message, a
photo or plain text — the most visible flaw a user can hit. Voice messages get their
own answer because people naturally try them first with a "voice AI" bot.
"""

from __future__ import annotations

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import ContextTypes

from app.bot import texts
from app.bot.handlers.start import MINI_APP_URL_KEY
from app.bot.keyboards.main_menu import open_mode


async def on_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    await update.message.reply_text(
        texts.VOICE_MESSAGE,
        parse_mode=ParseMode.HTML,
        reply_markup=open_mode(context.bot_data[MINI_APP_URL_KEY], "tutor"),
    )


async def on_unknown(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return
    await update.message.reply_text(
        texts.FALLBACK,
        parse_mode=ParseMode.HTML,
        reply_markup=open_mode(context.bot_data[MINI_APP_URL_KEY], "tutor"),
    )


async def on_unknown_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Noma'lum slash-buyruqqa javob beradi.

    `on_unknown` `~filters.COMMAND` bilan ro'yxatdan o'tgan, shuning uchun u
    buyruqlarni ko'rmaydi: /menu yoki /foo yuborilganda bot butunlay jim
    qolardi. Ma'lum buyruqlar oldin ro'yxatdan o'tgani uchun (PTB handlerlarni
    tartib bo'yicha tekshiradi) bu yerga faqat tanilmagan buyruq yetib keladi.
    """
    if update.message is None:
        return
    await update.message.reply_text(
        texts.UNKNOWN_COMMAND,
        parse_mode=ParseMode.HTML,
        reply_markup=open_mode(context.bot_data[MINI_APP_URL_KEY], "tutor"),
    )
