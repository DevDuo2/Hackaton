import pytest

from app.config import ConfigError, load_settings, require_bot_settings

VALID = {"BOT_TOKEN": "123:abc", "MINI_APP_URL": "https://voxy.example.com/miniapp/"}


def test_loads_valid_bot_settings() -> None:
    bot = require_bot_settings(load_settings(VALID))
    assert bot.bot_token == "123:abc"
    assert bot.mini_app_url == "https://voxy.example.com/miniapp/"


def test_backend_url_has_default() -> None:
    assert load_settings({}).backend_url == "http://localhost:8000"


@pytest.mark.parametrize("missing", ["BOT_TOKEN", "MINI_APP_URL"])
def test_missing_required_values(missing: str) -> None:
    env = {**VALID, missing: "   "}
    with pytest.raises(ConfigError, match=missing):
        require_bot_settings(load_settings(env))


@pytest.mark.parametrize("url", ["http://voxy.example.com", "voxy.example.com", "https://", "ftp://x.y"])
def test_mini_app_url_must_be_https(url: str) -> None:
    with pytest.raises(ConfigError, match="https"):
        require_bot_settings(load_settings({**VALID, "MINI_APP_URL": url}))


def test_repr_hides_secrets() -> None:
    settings = load_settings({**VALID, "GEMINI_API_KEY": "secret-key"})
    text = repr(settings)
    assert "123:abc" not in text
    assert "secret-key" not in text
