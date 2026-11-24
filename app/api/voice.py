"""Voice tutor endpoints.

POST /api/voice/session   verified Telegram initData -> single-use WS ticket
WS   /api/voice/ws?ticket= audio bridge to Gemini Live (see app/services/live_bridge.py)
"""

from __future__ import annotations

import contextlib
import logging
from typing import Literal

from fastapi import APIRouter, Request, WebSocket
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.websockets import WebSocketState

from app.config import ConfigError, VoiceSettings, require_voice_settings
from app.services.live_bridge import LiveBridge
from app.services.telegram_auth import InitDataError, validate_init_data
from app.services.tickets import SessionRequest, TicketStore
from app.services.tutor_prompt import SUBJECTS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/voice", tags=["voice"])

DEV_USER_ID = 0


class CreateSessionBody(BaseModel):
    init_data: str = Field(default="", max_length=4096)
    mode: Literal["tutor", "english"] = "tutor"
    language: Literal["uz", "en", "ru"] = "uz"
    subject: str | None = Field(default=None, max_length=32)
    input_sample_rate: int = Field(default=16000, ge=8000, le=48000)


def _error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": code, "message": message})


LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})


def _is_local_request(request: Request) -> bool:
    return (request.url.hostname or "").strip("[]").lower() in LOCAL_HOSTS


def _voice_settings(request: Request | WebSocket) -> VoiceSettings:
    return require_voice_settings(request.app.state.settings)


def _origin_allowed(request: Request | WebSocket) -> bool:
    """Browsers always send Origin on WebSocket handshakes and on cross-site/POST fetches.
    A missing Origin (curl, server-to-server) is not a browser attack vector; tickets and
    initData still protect those paths."""
    allowed = request.app.state.settings.effective_origins()
    origin = request.headers.get("origin")
    if allowed is None or origin is None:
        return True
    return origin.rstrip("/").lower() in allowed


@router.get("/status")
async def voice_status(request: Request) -> dict[str, bool]:
    """Lets the Mini App show whether the AI tutor is configured. Reveals no secrets."""
    try:
        _voice_settings(request)
    except ConfigError:
        return {"configured": False}
    return {"configured": True}


@router.post("/session")
async def create_session(body: CreateSessionBody, request: Request) -> JSONResponse:
    if not _origin_allowed(request):
        logger.warning("voice session refused: origin not allowed")
        return _error(403, "origin_not_allowed", "Bu manzildan foydalanish ruxsat etilmagan.")
    try:
        settings = _voice_settings(request)
    except ConfigError as exc:
        logger.error("voice tutor not configured: %s", exc)
        return _error(503, "ai_not_configured", f"AI ustoz serverda sozlanmagan: {exc}")

    if body.subject is not None and body.subject not in SUBJECTS:
        return _error(422, "invalid_subject", "Noma'lum fan.")

    if settings.dev_skip_telegram_auth and not body.init_data:
        # Dev bypass works only for requests addressed to localhost. Through a tunnel (ngrok,
        # cloudflared) the Host header is the public domain, so the bypass is refused there.
        if not _is_local_request(request):
            return _error(401, "invalid_init_data", "DEV_SKIP_TELEGRAM_AUTH faqat localhost uchun ishlaydi.")
        user_id, first_name = DEV_USER_ID, "Developer"
    elif not settings.bot_token:
        return _error(503, "ai_not_configured", "BOT_TOKEN serverda sozlanmagan.")
    else:
        try:
            user = validate_init_data(
                body.init_data, settings.bot_token, max_age_seconds=settings.init_data_max_age_seconds
            )
        except InitDataError as exc:
            logger.info("rejected initData: %s", exc)  # never log the initData itself
            return _error(401, "invalid_init_data", "Telegram orqali ochilgan ilova kerak (initData tasdiqlanmadi).")
        user_id, first_name = user.id, user.first_name

    tickets: TicketStore = request.app.state.tickets
    if tickets.is_active(user_id):
        return _error(409, "session_active", "Sizda faol suhbat allaqachon bor.")

    ticket = tickets.issue(
        SessionRequest(
            user_id=user_id,
            first_name=first_name,
            mode=body.mode,
            language="en" if body.mode == "english" else body.language,
            subject=None if body.mode == "english" else body.subject,
            input_sample_rate=body.input_sample_rate,
        )
    )
    return JSONResponse(
        {
            "ticket": ticket,
            "ws_path": "/api/voice/ws",
            "expires_in": tickets.ttl_seconds,
            "max_session_seconds": settings.max_session_seconds,
        }
    )


@router.websocket("/ws")
async def voice_ws(ws: WebSocket, ticket: str = "") -> None:
    await ws.accept()

    async def reject(code: str, message: str, close_code: int) -> None:
        await ws.send_json({"type": "error", "code": code, "message": message})
        await ws.close(close_code)

    if not _origin_allowed(ws):
        logger.warning("voice websocket refused: origin not allowed")
        return await reject("origin_not_allowed", "Bu manzildan foydalanish ruxsat etilmagan.", 4403)

    try:
        settings = _voice_settings(ws)
    except ConfigError:
        return await reject("ai_not_configured", "AI ustoz serverda sozlanmagan.", 1011)

    tickets: TicketStore = ws.app.state.tickets
    session_request = tickets.redeem(ticket) if ticket else None
    if session_request is None:
        return await reject("invalid_ticket", "Sessiya muddati tugagan. Qaytadan boshlang.", 4401)
    if not tickets.try_acquire(session_request.user_id):
        return await reject("session_active", "Sizda faol suhbat allaqachon bor.", 4409)

    try:
        gateway = ws.app.state.gateway_factory(settings)
        await LiveBridge(ws, session_request, settings, gateway).run()
    except Exception:
        logger.exception("voice session crashed")
        if ws.application_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await reject("internal_error", "Kutilmagan xatolik.", 1011)
    finally:
        tickets.release(session_request.user_id)
