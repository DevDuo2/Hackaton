"""Production configuration: fail-fast startup, Origin allow-list, health/readiness, headers, metrics."""

from __future__ import annotations

import json
import logging

import pytest
from fastapi.testclient import TestClient

from app.config import ConfigError, load_settings
from app.main import create_app
from tests.fakes import FakeGateway, audio_message, make_init_data, settings

PROD = dict(
    app_env="production",
    mini_app_url="https://voxy.example.com/miniapp/",
    backend_url="https://voxy.example.com",
)
BODY = {"mode": "tutor", "language": "uz", "subject": "math", "input_sample_rate": 48000}


def prod_client(**overrides) -> tuple[TestClient, FakeGateway]:
    gateway = FakeGateway()
    app = create_app(settings(**{**PROD, **overrides}), gateway_factory=lambda _s: gateway)
    return TestClient(app, base_url="https://voxy.example.com"), gateway


# ---------- fail-fast startup ----------


def test_production_refuses_to_start_without_secrets_and_https() -> None:
    with pytest.raises(ConfigError) as info:
        create_app(settings(app_env="production", bot_token=None, gemini_api_key=None,
                            mini_app_url="http://insecure.example", backend_url="http://x"))
    message = str(info.value)
    for name in ("BOT_TOKEN", "GEMINI_API_KEY", "MINI_APP_URL", "BACKEND_URL"):
        assert name in message


def test_production_env_file_settings_parse() -> None:
    s = load_settings({
        "APP_ENV": "PRODUCTION", "BOT_TOKEN": "1:a", "GEMINI_API_KEY": "k",
        "MINI_APP_URL": "https://a.example/miniapp/", "BACKEND_URL": "https://a.example",
        "ALLOWED_ORIGINS": "https://a.example/, https://web.telegram.org",
    })
    assert s.is_production
    assert s.effective_origins() == {"https://a.example", "https://web.telegram.org"}


def test_invalid_allowed_origin_is_rejected() -> None:
    with pytest.raises(ConfigError, match="ALLOWED_ORIGINS"):
        load_settings({"ALLOWED_ORIGINS": "https://a.example/path"})


def test_production_derives_origins_from_urls() -> None:
    s = settings(**PROD)
    assert s.effective_origins() == {"https://voxy.example.com"}


def test_development_has_no_origin_restriction_by_default() -> None:
    assert settings().effective_origins() is None


# ---------- origin allow-list ----------


def test_post_from_foreign_origin_is_refused_in_production() -> None:
    client, _ = prod_client()
    response = client.post(
        "/api/voice/session", json={**BODY, "init_data": make_init_data()}, headers={"Origin": "https://evil.example"}
    )
    assert response.status_code == 403
    assert response.json()["error"] == "origin_not_allowed"


def test_post_from_mini_app_origin_is_allowed() -> None:
    client, _ = prod_client()
    response = client.post(
        "/api/voice/session", json={**BODY, "init_data": make_init_data()},
        headers={"Origin": "https://voxy.example.com"},
    )
    assert response.status_code == 200


def test_websocket_from_foreign_origin_is_refused() -> None:
    client, gateway = prod_client()
    ticket = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data()}).json()["ticket"]
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}", headers={"Origin": "https://evil.example"}) as ws:
        message = json.loads(ws.receive_text())
        assert message["code"] == "origin_not_allowed"
    assert gateway.opened == 0


def test_dev_mode_accepts_any_origin() -> None:
    gateway = FakeGateway()
    client = TestClient(create_app(settings(), gateway_factory=lambda _s: gateway))
    response = client.post(
        "/api/voice/session", json={**BODY, "init_data": make_init_data()}, headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 200


# ---------- health, docs, headers ----------


def test_health_and_readiness_in_production() -> None:
    client, _ = prod_client()
    assert client.get("/api/health").json() == {"status": "ok", "service": "voxy-backend"}
    ready = client.get("/api/health/ready")
    assert ready.status_code == 200
    assert ready.json() == {"status": "ready", "voice_configured": True, "app_env": "production", "active_sessions": 0}


def test_readiness_reports_missing_configuration() -> None:
    client = TestClient(create_app(settings(gemini_api_key=None)))
    response = client.get("/api/health/ready")
    assert response.status_code == 503
    assert response.json()["voice_configured"] is False


def test_api_docs_disabled_in_production_only() -> None:
    client, _ = prod_client()
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404
    assert TestClient(create_app(settings())).get("/docs").status_code == 200


def test_static_files_security_headers() -> None:
    client, _ = prod_client()
    response = client.get("/miniapp/")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["cache-control"] == "no-cache"
    assert "x-frame-options" not in response.headers  # Telegram Web embeds Mini Apps in an iframe
    for asset in ("app.js", "session.js", "voice-client.js", "audio.js", "pcm-worklet.js", "pcm.js", "mic.js", "style.css"):
        assert client.get(f"/miniapp/{asset}").status_code == 200, asset


# ---------- session metrics ----------


def test_session_metrics_are_logged_without_content(caplog: pytest.LogCaptureFixture) -> None:
    client, gateway = prod_client()
    gateway.session.on_first_audio = [audio_message(b"\x01\x00" * 50)]
    ticket = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data()}).json()["ticket"]
    with caplog.at_level(logging.INFO, logger="app.services.live_bridge"):
        with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
            assert json.loads(ws.receive_text())["type"] == "ready"
            ws.send_bytes(b"\x02\x00" * 800)
            assert ws.receive_bytes() == b"\x01\x00" * 50
            ws.send_text(json.dumps({"type": "end"}))
            while json.loads(ws.receive_text())["type"] != "summary":
                pass
    line = next(r.getMessage() for r in caplog.records if r.getMessage().startswith("voice session ended"))
    assert "outcome=client_end" in line
    assert "audio_to_gemini=1 frames/1600 bytes" in line
    assert "audio_from_gemini=1 chunks/100 bytes" in line
    assert str(42) not in line.split("duration")[0]  # no Telegram user id


def test_websocket_ticket_is_redacted_from_uvicorn_logs(caplog: pytest.LogCaptureFixture) -> None:
    # Real finding: uvicorn logs '"WebSocket /api/voice/ws?ticket=…" [accepted]' even with --no-access-log.
    create_app(settings())  # installs the filter
    with caplog.at_level(logging.INFO, logger="uvicorn.error"):
        logging.getLogger("uvicorn.error").info(
            '%s - "WebSocket %s" [accepted]', "127.0.0.1:5000", "/api/voice/ws?ticket=SECRET-TICKET-123&x=1"
        )
    text = caplog.records[-1].getMessage()
    assert "SECRET-TICKET-123" not in text
    assert "ticket=<redacted>&x=1" in text


def test_summary_uses_low_thinking_for_latency() -> None:
    # Real finding: gemini-3.8-flash at its default ("medium") thinking exceeded the 25 s summary timeout.
    import inspect

    from app.services import gemini

    assert "ThinkingLevel.LOW" in inspect.getsource(gemini.GeminiGateway.generate_json)


def test_keepalive_only_runs_against_a_public_https_url():
    """Lokal manzilga ping yuborishning ma'nosi yo'q — vazifa yaratilmaydi."""
    from app.services.keepalive import _is_public_https

    assert _is_public_https("https://voxy-voice.onrender.com")
    assert not _is_public_https("http://localhost:8000")
    assert not _is_public_https("https://localhost:8000")
    assert not _is_public_https("http://voxy-voice.onrender.com")  # https shart
    assert not _is_public_https("")


def test_keepalive_is_off_outside_production():
    """Lokalda ping kerak emas: servis uxlamaydi."""
    from app.services.keepalive import start_keepalive

    assert start_keepalive("https://voxy-voice.onrender.com", enabled=False) is None
    assert start_keepalive("http://localhost:8000", enabled=True) is None
