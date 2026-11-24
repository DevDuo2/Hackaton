from __future__ import annotations

from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from app.bot import texts


class Callback:
    VOICE_TUTOR = "menu:voice_tutor"
    ENGLISH = "menu:english"
    HELP = "menu:help"
    MAIN = "menu:main"


def with_mode(url: str, mode: str) -> str:
    """Append ?mode=<mode> so the Mini App opens in the right mode."""
    parts = urlparse(url)
    query = dict(parse_qsl(parts.query))
    query["mode"] = mode
    return urlunparse(parts._replace(query=urlencode(query)))


def main_menu(mini_app_url: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Open VOXY", web_app=WebAppInfo(url=mini_app_url))],
            [
                InlineKeyboardButton("AI Voice Tutor", callback_data=Callback.VOICE_TUTOR),
                InlineKeyboardButton("English Speaking", callback_data=Callback.ENGLISH),
            ],
            [InlineKeyboardButton("Help", callback_data=Callback.HELP)],
        ]
    )


def open_mode(mini_app_url: str, mode: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton(texts.OPEN_APP, web_app=WebAppInfo(url=with_mode(mini_app_url, mode)))],
            [InlineKeyboardButton(texts.BACK, callback_data=Callback.MAIN)],
        ]
    )


def back_only() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton(texts.BACK, callback_data=Callback.MAIN)]])
