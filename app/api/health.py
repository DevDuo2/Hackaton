from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.config import ConfigError, require_voice_settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Liveness: the process is up and serving. Use this as the platform health check —
    it never depends on Gemini, so a Google outage doesn't make the platform restart VOXY."""
    return {"status": "ok", "service": "voxy-backend"}


@router.get("/health/ready")
async def ready(request: Request) -> JSONResponse:
    """Readiness: configuration is complete. Does not call Gemini (no cost, no secrets exposed)."""
    try:
        require_voice_settings(request.app.state.settings)
        configured = True
    except ConfigError:
        configured = False
    body = {
        "status": "ready" if configured else "not_ready",
        "voice_configured": configured,
        "app_env": request.app.state.settings.app_env,
        "active_sessions": request.app.state.tickets.active_count,
    }
    return JSONResponse(body, status_code=200 if configured else 503)
