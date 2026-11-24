"""Run the bot with long polling: `python -m app.bot`."""

from __future__ import annotations

import logging
import sys

from telegram import Update

from app.bot.application import build_application
from app.config import ConfigError, load_settings, require_bot_settings


def main() -> int:
    logging.basicConfig(format="%(asctime)s %(levelname)s %(name)s: %(message)s", level=logging.INFO)
    logging.getLogger("httpx").setLevel(logging.WARNING)  # its INFO lines include the bot token in URLs

    try:
        settings = require_bot_settings(load_settings())
    except ConfigError as exc:
        print(f"Config error: {exc}", file=sys.stderr)
        return 1

    build_application(settings).run_polling(allowed_updates=Update.ALL_TYPES)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
