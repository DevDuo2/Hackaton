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


async def test_voice_message_gets_an_honest_answer() -> None:
    """A voice note must not be answered with an invented pronunciation score."""
    from app.bot.handlers.fallback import on_voice

    update = MagicMock()
    update.message.reply_text = AsyncMock()
    await on_voice(update, _context())

    text = update.message.reply_text.call_args.args[0]
    assert "tahlil qilmaydi" in text
    assert "%" not in text
    markup = update.message.reply_text.call_args.kwargs["reply_markup"]
    assert any(b.web_app is not None for b in _buttons(markup))


async def test_unknown_message_is_never_ignored() -> None:
    from app.bot.handlers.fallback import on_unknown

    update = MagicMock()
    update.message.reply_text = AsyncMock()
    await on_unknown(update, _context())

    assert update.message.reply_text.await_count == 1
    assert "/start" in update.message.reply_text.call_args.args[0]


def test_application_answers_plain_messages() -> None:
    from telegram.ext import CommandHandler, MessageHandler

    handlers = build_application(SETTINGS).handlers[0]
    # Aniq son emas, TARTIB tekshiriladi: fallbacklar buyruqlardan KEYIN
    # bo'lishi kerak, aks holda ular /start ni ham yutib yuboradi.
    first_fallback = next(i for i, h in enumerate(handlers) if isinstance(h, MessageHandler))
    last_command = max(i for i, h in enumerate(handlers) if isinstance(h, CommandHandler))
    assert first_fallback > last_command
    assert isinstance(handlers[-1], MessageHandler)


def test_unknown_slash_command_gets_an_answer() -> None:
    """/menu yoki /foo yuborilganda bot jim qolmasligi kerak.

    Ilgari fallback `~filters.COMMAND` bilan ro'yxatdan o'tgani uchun
    tanilmagan buyruq HECH QANDAY handlerga tushmasdi va bot javob bermasdi.
    """
    import datetime as _dt

    from telegram import Chat, Message, MessageEntity, Update, User
    from telegram.ext import MessageHandler

    message = Message(
        message_id=1,
        date=_dt.datetime(2026, 1, 1, tzinfo=_dt.timezone.utc),
        chat=Chat(id=1, type=Chat.PRIVATE),
        from_user=User(id=1, first_name="Talaba", is_bot=False),
        text="/foo",
        entities=(MessageEntity(type=MessageEntity.BOT_COMMAND, offset=0, length=4),),
    )
    update = Update(update_id=1, message=message)

    handlers = build_application(SETTINGS).handlers[0]
    assert any(
        isinstance(h, MessageHandler) and h.check_update(update) for h in handlers
    ), "tanilmagan buyruq uchun mos handler yo'q — bot jim qoladi"


def test_mode_texts_do_not_promise_the_ai_for_later() -> None:
    """Stage 1 texts said the AI tutor would be connected later; it is connected now."""
    for text in (texts.VOICE_TUTOR, texts.ENGLISH_SPEAKING):
        assert "keyingi bosqich" not in text.lower()


def test_bot_commands_are_registered_on_startup() -> None:
    """getMyCommands bo'sh bo'lsa, Telegram menyusida ham buyruq ko'rinmaydi."""
    from app.bot.application import BOT_COMMANDS

    application = build_application(SETTINGS)
    assert {c.command for c in BOT_COMMANDS} == {"start", "help"}
    assert application.post_init is not None, "post_init orqali buyruqlar yozilishi kerak"


def test_web_logging_silences_httpx_so_the_bot_token_never_lands_in_logs() -> None:
    """httpx INFO qatori "POST https://api.telegram.org/bot<TOKEN>/getMe" ni yozadi.

    RUN_BOT_IN_WEB rejimida bot veb-servis ichida ishlaydi, shuning uchun veb
    tarafdagi logging sozlamasi ham httpx'ni jimlashtirishi SHART.
    """
    import logging

    from app.main import _configure_logging

    logging.getLogger("httpx").setLevel(logging.INFO)
    _configure_logging()
    assert logging.getLogger("httpx").level >= logging.WARNING
    assert logging.getLogger("httpcore").level >= logging.WARNING


async def test_embedded_bot_is_skipped_without_config(caplog) -> None:
    """Token yo'q bo'lsa, veb-servis yiqilmasligi kerak — Mini App botsiz ham ishlaydi."""
    from app.bot.embedded import start_embedded_bot
    from app.config import load_settings

    settings = load_settings({"GEMINI_API_KEY": "k", "RUN_BOT_IN_WEB": "true"})
    assert await start_embedded_bot(settings) is None


def test_embedded_bot_flag_is_off_by_default() -> None:
    from app.config import load_settings

    assert load_settings({}).run_bot_in_web is False
    assert load_settings({"RUN_BOT_IN_WEB": "true"}).run_bot_in_web is True
