from unittest.mock import AsyncMock, MagicMock

import pytest
from telegram.ext import CallbackQueryHandler, CommandHandler

from app.bot import texts
from app.bot.application import build_application
from app.bot.handlers.menu import on_menu
from app.bot.handlers.start import MINI_APP_URL_KEY, start, welcome_text
from app.bot.keyboards.main_menu import Callback, main_menu, with_mode
from app.config import BotSettings

URL = "https://voxy.example.com/miniapp/"
SETTINGS = BotSettings(bot_token="123456:TEST-TOKEN", mini_app_url=URL)


def _buttons(markup):
    return [button for row in markup.inline_keyboard for button in row]


def test_application_registers_handlers() -> None:
    application = build_application(SETTINGS)
    handlers = application.handlers[0]
    commands = {cmd for h in handlers if isinstance(h, CommandHandler) for cmd in h.commands}
    assert {"start", "help"} <= commands
    assert any(isinstance(h, CallbackQueryHandler) for h in handlers)
    assert application.bot_data[MINI_APP_URL_KEY] == URL


def test_main_menu_buttons() -> None:
    buttons = _buttons(main_menu(URL))
    assert [b.text for b in buttons] == ["Open VOXY", "AI Voice Tutor", "English Speaking", "Help"]
    open_voxy = buttons[0]
    assert open_voxy.web_app is not None and open_voxy.web_app.url == URL
    assert {b.callback_data for b in buttons[1:]} == {Callback.VOICE_TUTOR, Callback.ENGLISH, Callback.HELP}


def test_with_mode_keeps_existing_query() -> None:
    assert with_mode("https://x.dev/app/?v=2", "english") == "https://x.dev/app/?v=2&mode=english"
    assert with_mode(URL, "tutor") == URL + "?mode=tutor"


def test_welcome_text_is_uzbek_and_escapes_name() -> None:
    text = welcome_text("<script>")
    assert "Assalomu alaykum" in text
    assert "&lt;script&gt;" in text and "<script>" not in text
    assert "do'stim" in welcome_text(None)


def _context() -> MagicMock:
    context = MagicMock()
    context.bot_data = {MINI_APP_URL_KEY: URL}
    return context


async def test_start_replies_with_menu() -> None:
    update = MagicMock()
    update.effective_user.first_name = "Ali"
    update.message.reply_text = AsyncMock()

    await start(update, _context())

    update.message.reply_text.assert_awaited_once()
    args, kwargs = update.message.reply_text.call_args
    assert "Ali" in args[0]
    assert _buttons(kwargs["reply_markup"])[0].web_app.url == URL


@pytest.mark.parametrize(
    ("data", "expected_text", "expected_mode"),
    [
        (Callback.VOICE_TUTOR, texts.VOICE_TUTOR, "tutor"),
        (Callback.ENGLISH, texts.ENGLISH_SPEAKING, "english"),
    ],
)
async def test_menu_mode_screens_open_miniapp_in_mode(data, expected_text, expected_mode) -> None:
    update = MagicMock()
    update.callback_query.data = data
    update.callback_query.answer = AsyncMock()
    update.callback_query.edit_message_text = AsyncMock()

    await on_menu(update, _context())

    update.callback_query.answer.assert_awaited_once()
    args, kwargs = update.callback_query.edit_message_text.call_args
    assert args[0] == expected_text
    assert _buttons(kwargs["reply_markup"])[0].web_app.url == f"{URL}?mode={expected_mode}"


async def test_menu_help_screen() -> None:
    update = MagicMock()
    update.callback_query.data = Callback.HELP
    update.callback_query.answer = AsyncMock()
    update.callback_query.edit_message_text = AsyncMock()

    await on_menu(update, _context())

    assert update.callback_query.edit_message_text.call_args.args[0] == texts.HELP
