"""FastAPI entry point.

Development:  uvicorn app.main:app --reload
Production:   see Procfile / Dockerfile / docs/deployment.md (single worker: tickets live in memory)
"""

from __future__ import annotations

import contextlib
import logging
import re
from collections.abc import AsyncIterator, Callable
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.health import router as health_router
from app.api.voice import router as voice_router
from app.config import Settings, VoiceSettings, load_settings, require_production_ready
from app.services.gemini import AIGateway, GeminiGateway
from app.services.tickets import TicketStore

MINIAPP_DIR = Path(__file__).resolve().parent.parent / "miniapp"
logger = logging.getLogger("voxy")

GatewayFactory = Callable[[VoiceSettings], AIGateway]


class MiniAppStaticFiles(StaticFiles):
    """Telegram's WebView caches aggressively; `no-cache` forces revalidation (ETag), so a
    deployed fix reaches users on the next open instead of serving stale JS modules."""

    async def get_response(self, path, scope):  # type: ignore[no-untyped-def]
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "no-cache"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # No X-Frame-Options / frame-ancestors: Telegram Web (web.telegram.org) embeds Mini Apps
        # in an iframe, and Telegram Desktop/mobile load them in a WebView.
        return response


class RedactTicketFilter(logging.Filter):
    """Uvicorn logs every WebSocket handshake path, query string included, even with
    --no-access-log ('"WebSocket /api/voice/ws?ticket=…" [accepted]' on uvicorn.error).
    Tickets are single-use and short-lived, but they still must not land in log storage."""

    PATTERN = re.compile(r"(ticket=)[^&\s\"']+")

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.PATTERN.sub(r"\1<redacted>", record.msg)
        if isinstance(record.args, tuple):
            record.args = tuple(
                self.PATTERN.sub(r"\1<redacted>", a) if isinstance(a, str) else a for a in record.args
            )
        return True


def _configure_logging() -> None:
    # Uvicorn configures only its own loggers; give app loggers (session metrics) a handler too.
    root = logging.getLogger()
    if not root.handlers:
        logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    # httpx INFO qatorlari to'liq URL'ni yozadi, Telegram URL'ida esa BOT TOKEN bor
    # ("POST https://api.telegram.org/bot<TOKEN>/getMe"). RUN_BOT_IN_WEB rejimida bu
    # token hosting loglariga tushib ketardi.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    for name in ("uvicorn.error", "uvicorn.access"):
        target = logging.getLogger(name)
        if not any(isinstance(f, RedactTicketFilter) for f in target.filters):
            target.addFilter(RedactTicketFilter())


def _gemini_gateway(settings: VoiceSettings) -> AIGateway:
    return GeminiGateway(settings.gemini_api_key)


def _lifespan(settings: Settings):
    """RUN_BOT_IN_WEB=true bo'lsa, Telegram botni shu jarayonda yurgizadi.

    Bepul hostinglarda (Render free) alohida worker yo'q — bitta veb-servis
    Mini App'ni ham, ovozli API'ni ham, botni ham ko'taradi.
    """

    @contextlib.asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.bot_application = None
        if settings.run_bot_in_web:
            from app.bot.embedded import start_embedded_bot, stop_embedded_bot

            app.state.bot_application = await start_embedded_bot(settings)
            try:
                yield
            finally:
                await stop_embedded_bot(app.state.bot_application)
            return
        yield

    return lifespan


def create_app(settings: Settings | None = None, gateway_factory: GatewayFactory | None = None) -> FastAPI:
    _configure_logging()
    settings = settings or load_settings()
    require_production_ready(settings)  # production: refuse to start half-configured

    docs = None if settings.is_production else "/docs"  # no interactive API docs in production
    app = FastAPI(title="VOXY API", version="0.3.0", docs_url=docs, redoc_url=None,
                  openapi_url=None if settings.is_production else "/openapi.json",
                  lifespan=_lifespan(settings))
    app.state.settings = settings
    app.state.tickets = TicketStore()
    app.state.gateway_factory = gateway_factory or _gemini_gateway
    logger.info("VOXY starting: app_env=%s live_model=%s origins=%s", settings.app_env,
                settings.gemini_live_model, sorted(settings.effective_origins() or ["*"]))

    if app.state.settings.dev_skip_telegram_auth:
        logger.warning("DEV_SKIP_TELEGRAM_AUTH is ON — voice sessions accept requests without Telegram. "
                       "Never enable this in production.")

    app.include_router(health_router)
    app.include_router(voice_router)

    @app.get("/", include_in_schema=False)
    async def root() -> RedirectResponse:
        return RedirectResponse(url="/miniapp/")

    app.mount("/miniapp", MiniAppStaticFiles(directory=MINIAPP_DIR, html=True), name="miniapp")
    return app


app = create_app()
