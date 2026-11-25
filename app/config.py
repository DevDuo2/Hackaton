"""Application settings loaded from environment variables (and an optional .env file)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlparse

from dotenv import load_dotenv


class ConfigError(ValueError):
    """Raised when required configuration is missing or invalid."""


# Verified against ai.google.dev Live API docs (Nov 2026): default Live model for voice agents.
DEFAULT_LIVE_MODEL = "gemini-3.8-live"
# Stable Flash text model, used only for the end-of-session summary.
DEFAULT_SUMMARY_MODEL = "gemini-3.8-flash"
# Tried in order when the primary returns 503/429 or is too slow. gemini-3.6-flash answered in a
# real test (2026-11-24) while gemini-3.8-flash was returning 503 "high demand".
DEFAULT_SUMMARY_FALLBACK_MODELS = ("gemini-3.6-flash",)
# Live API: one connection lives ~10 min; session resumption + context compression (enabled in
# app/services/gemini.py) let a session continue across reconnects. VOXY still caps a session for cost.
DEFAULT_MAX_SESSION_SECONDS = 600
MAX_SESSION_SECONDS_LIMIT = 1800
DEFAULT_INIT_DATA_MAX_AGE_SECONDS = 3600
APP_ENVS = ("development", "production")
# Set to 1 by tests / local tooling so they never read the developer's real .env.
DISABLE_DOTENV_ENV = "VOXY_DISABLE_DOTENV"


@dataclass(frozen=True, slots=True)
class Settings:
    bot_token: str | None
    mini_app_url: str | None
    backend_url: str
    gemini_api_key: str | None
    gemini_live_model: str = DEFAULT_LIVE_MODEL
    gemini_summary_model: str = DEFAULT_SUMMARY_MODEL
    max_session_seconds: int = DEFAULT_MAX_SESSION_SECONDS
    init_data_max_age_seconds: int = DEFAULT_INIT_DATA_MAX_AGE_SECONDS
    dev_skip_telegram_auth: bool = False
    # Bepul hostingda alohida worker yo'q: bot veb-servis jarayonida yuradi.
    run_bot_in_web: bool = False
    app_env: str = "development"
    allowed_origins: tuple[str, ...] = ()  # explicit ALLOWED_ORIGINS; empty = derive (see below)
    gemini_summary_fallback_models: tuple[str, ...] = DEFAULT_SUMMARY_FALLBACK_MODELS

    def __post_init__(self) -> None:
        if self.app_env not in APP_ENVS:
            raise ConfigError(f"APP_ENV must be one of {', '.join(APP_ENVS)}.")
        if self.app_env == "production" and self.dev_skip_telegram_auth:
            raise ConfigError("DEV_SKIP_TELEGRAM_AUTH must not be enabled when APP_ENV=production.")
        for origin in self.allowed_origins:
            _validate_origin(origin)

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    def effective_origins(self) -> frozenset[str] | None:
        """Origins allowed to call the voice API from a browser. None = no Origin check (dev only).
        Production default: the origins of MINI_APP_URL and BACKEND_URL (the Mini App is same-origin)."""
        if self.allowed_origins:
            return frozenset(self.allowed_origins)
        if not self.is_production:
            return None
        return frozenset(o for o in (_origin_of(self.mini_app_url), _origin_of(self.backend_url)) if o)

    def __repr__(self) -> str:  # never leak secrets into logs
        return (
            f"Settings(bot_token={'***' if self.bot_token else None}, "
            f"mini_app_url={self.mini_app_url!r}, backend_url={self.backend_url!r}, "
            f"gemini_api_key={'***' if self.gemini_api_key else None}, "
            f"gemini_live_model={self.gemini_live_model!r}, "
            f"gemini_summary_model={self.gemini_summary_model!r}, "
            f"max_session_seconds={self.max_session_seconds}, "
            f"dev_skip_telegram_auth={self.dev_skip_telegram_auth}, "
            f"run_bot_in_web={self.run_bot_in_web}, app_env={self.app_env!r}, "
            f"allowed_origins={self.allowed_origins!r})"
        )


def _origin_of(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}".lower() if parsed.scheme and parsed.netloc else None


def _validate_origin(origin: str) -> None:
    parsed = urlparse(origin)
    if parsed.scheme not in ("http", "https") or not parsed.netloc or parsed.path not in ("", "/"):
        raise ConfigError(f"ALLOWED_ORIGINS entries must look like https://host[:port], got {origin!r}.")


@dataclass(frozen=True, slots=True)
class BotSettings:
    bot_token: str
    mini_app_url: str


@dataclass(frozen=True, slots=True)
class VoiceSettings:
    gemini_api_key: str
    bot_token: str | None  # None only when dev_skip_telegram_auth is on
    live_model: str
    summary_model: str
    max_session_seconds: int
    init_data_max_age_seconds: int
    dev_skip_telegram_auth: bool
    summary_fallback_models: tuple[str, ...] = DEFAULT_SUMMARY_FALLBACK_MODELS

    @property
    def summary_models(self) -> tuple[str, ...]:
        """Primary first, then fallbacks, without duplicates."""
        return tuple(dict.fromkeys((self.summary_model, *self.summary_fallback_models)))

    def __repr__(self) -> str:
        return f"VoiceSettings(live_model={self.live_model!r}, summary_models={self.summary_models!r})"


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def load_settings(env: dict[str, str] | None = None) -> Settings:
    """Read settings. Pass `env` explicitly in tests; otherwise os.environ (+ .env) is used."""
    if env is None:
        if os.environ.get(DISABLE_DOTENV_ENV) != "1":
            load_dotenv()
        env = dict(os.environ)
    return Settings(
        bot_token=_clean(env.get("BOT_TOKEN")),
        mini_app_url=_clean(env.get("MINI_APP_URL")),
        backend_url=_clean(env.get("BACKEND_URL")) or "http://localhost:8000",
        gemini_api_key=_clean(env.get("GEMINI_API_KEY")),
        gemini_live_model=_clean(env.get("GEMINI_LIVE_MODEL")) or DEFAULT_LIVE_MODEL,
        gemini_summary_model=_clean(env.get("GEMINI_SUMMARY_MODEL")) or DEFAULT_SUMMARY_MODEL,
        max_session_seconds=_int(
            env, "VOICE_MAX_SESSION_SECONDS", DEFAULT_MAX_SESSION_SECONDS, 30, MAX_SESSION_SECONDS_LIMIT
        ),
        init_data_max_age_seconds=_int(
            env, "TELEGRAM_INIT_DATA_MAX_AGE_SECONDS", DEFAULT_INIT_DATA_MAX_AGE_SECONDS, 60, 86400
        ),
        dev_skip_telegram_auth=_bool(env.get("DEV_SKIP_TELEGRAM_AUTH")),
        run_bot_in_web=_bool(env.get("RUN_BOT_IN_WEB")),
        app_env=(_clean(env.get("APP_ENV")) or "development").lower(),
        allowed_origins=tuple(
            o.strip().rstrip("/").lower() for o in (env.get("ALLOWED_ORIGINS") or "").split(",") if o.strip()
        ),
        gemini_summary_fallback_models=(
            tuple(m.strip() for m in env["GEMINI_SUMMARY_FALLBACK_MODELS"].split(",") if m.strip())
            if env.get("GEMINI_SUMMARY_FALLBACK_MODELS") is not None
            else DEFAULT_SUMMARY_FALLBACK_MODELS
        ),
    )


def require_production_ready(settings: Settings) -> None:
    """Fail fast at startup in production instead of serving a half-configured app."""
    if not settings.is_production:
        return
    problems = []
    if not settings.bot_token:
        problems.append("BOT_TOKEN is not set")
    if not settings.gemini_api_key:
        problems.append("GEMINI_API_KEY is not set")
    for name, url in (("MINI_APP_URL", settings.mini_app_url), ("BACKEND_URL", settings.backend_url)):
        if not url or urlparse(url).scheme != "https" or not urlparse(url).netloc:
            problems.append(f"{name} must be a public https:// URL")
    if problems:
        raise ConfigError("APP_ENV=production but: " + "; ".join(problems) + ".")


def _int(env: dict[str, str], key: str, default: int, minimum: int, maximum: int) -> int:
    raw = _clean(env.get(key))
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ConfigError(f"{key} must be an integer.") from exc
    if not minimum <= value <= maximum:
        raise ConfigError(f"{key} must be between {minimum} and {maximum}.")
    return value


def _bool(raw: str | None) -> bool:
    return (_clean(raw) or "").lower() in {"1", "true", "yes", "on"}


def validate_mini_app_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ConfigError("MINI_APP_URL must be an absolute https:// URL (Telegram requirement).")
    return url


def require_bot_settings(settings: Settings) -> BotSettings:
    """Validate the subset of settings the Telegram bot needs to start."""
    if not settings.bot_token:
        raise ConfigError("BOT_TOKEN is not set. Copy .env.example to .env and fill it in.")
    if not settings.mini_app_url:
        raise ConfigError("MINI_APP_URL is not set. Copy .env.example to .env and fill it in.")
    return BotSettings(
        bot_token=settings.bot_token,
        mini_app_url=validate_mini_app_url(settings.mini_app_url),
    )


def require_voice_settings(settings: Settings) -> VoiceSettings:
    """Validate what the voice tutor needs. Error messages are safe to show to operators."""
    if not settings.gemini_api_key:
        raise ConfigError("GEMINI_API_KEY is not set on the server.")
    if not settings.bot_token and not settings.dev_skip_telegram_auth:
        raise ConfigError("BOT_TOKEN is not set on the server (needed to verify Telegram initData).")
    return VoiceSettings(
        gemini_api_key=settings.gemini_api_key,
        bot_token=settings.bot_token,
        live_model=settings.gemini_live_model,
        summary_model=settings.gemini_summary_model,
        summary_fallback_models=settings.gemini_summary_fallback_models,
        max_session_seconds=settings.max_session_seconds,
        init_data_max_age_seconds=settings.init_data_max_age_seconds,
        dev_skip_telegram_auth=settings.dev_skip_telegram_auth,
    )
