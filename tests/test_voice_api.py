"""End-to-end tests of /api/voice/* with a fake Gemini gateway (no network, no real keys)."""

from __future__ import annotations

import json
import time

import pytest
from fastapi.testclient import TestClient
from google.genai import errors, types

from app.main import create_app
from tests.fakes import CLOSED, FakeGateway, audio_message, content_message, make_init_data, settings

BODY = {"mode": "tutor", "language": "uz", "subject": "math", "input_sample_rate": 48000}


def make_client(gateway: FakeGateway | None = None, **setting_overrides) -> tuple[TestClient, FakeGateway]:
    gateway = gateway or FakeGateway()
    app = create_app(settings(**setting_overrides), gateway_factory=lambda _s: gateway)
    return TestClient(app), gateway


def create_ticket(client: TestClient, **body) -> str:
    response = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data(), **body})
    assert response.status_code == 200, response.text
    return response.json()["ticket"]


def receive(ws) -> dict | bytes:
    """Next server message: dict for JSON frames, bytes for audio frames."""
    message = ws.receive()
    if message.get("bytes") is not None:
        return message["bytes"]
    if message.get("text") is not None:
        return json.loads(message["text"])
    return message  # websocket.close


def receive_until(ws, kind: str) -> list:
    seen = []
    while True:
        item = receive(ws)
        seen.append(item)
        if isinstance(item, dict) and item.get("type") == kind:
            return seen


# ---------- session creation ----------


def test_status_reports_missing_key() -> None:
    client, _ = make_client(gemini_api_key=None)
    assert client.get("/api/voice/status").json() == {"configured": False}


def test_status_reports_configured() -> None:
    client, _ = make_client()
    assert client.get("/api/voice/status").json() == {"configured": True}


def test_missing_api_key_returns_503() -> None:
    client, _ = make_client(gemini_api_key=None)
    response = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data()})
    assert response.status_code == 503
    assert response.json()["error"] == "ai_not_configured"
    assert "GEMINI_API_KEY" in response.json()["message"]


def test_missing_bot_token_returns_503() -> None:
    client, _ = make_client(bot_token=None)
    response = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data()})
    assert response.status_code == 503


def test_invalid_init_data_returns_401() -> None:
    client, _ = make_client()
    response = client.post("/api/voice/session", json={**BODY, "init_data": "auth_date=1&hash=deadbeef"})
    assert response.status_code == 401
    assert response.json()["error"] == "invalid_init_data"


def test_empty_init_data_rejected_without_dev_flag() -> None:
    client, _ = make_client()
    assert client.post("/api/voice/session", json={**BODY, "init_data": ""}).status_code == 401


def test_dev_flag_allows_local_testing_without_telegram() -> None:
    gateway = FakeGateway()
    app = create_app(settings(dev_skip_telegram_auth=True), gateway_factory=lambda _s: gateway)
    client = TestClient(app, base_url="http://localhost:8000")
    assert client.post("/api/voice/session", json={**BODY, "init_data": ""}).status_code == 200


@pytest.mark.parametrize("host", ["https://abc.ngrok-free.app", "https://voxy.example.com", "http://testserver"])
def test_dev_flag_is_refused_for_non_local_hosts(host: str) -> None:
    # Through a tunnel the Host header is the public domain: the bypass must not work there.
    app = create_app(settings(dev_skip_telegram_auth=True), gateway_factory=lambda _s: FakeGateway())
    response = TestClient(app, base_url=host).post("/api/voice/session", json={**BODY, "init_data": ""})
    assert response.status_code == 401


def test_dev_flag_cannot_be_enabled_in_production() -> None:
    from app.config import ConfigError

    with pytest.raises(ConfigError, match="production"):
        settings(dev_skip_telegram_auth=True, app_env="production")


def test_frontend_cannot_choose_the_student_identity() -> None:
    # Extra fields such as user_id are ignored; identity comes only from verified initData.
    client, _ = make_client()
    response = client.post(
        "/api/voice/session", json={**BODY, "init_data": make_init_data(user_id=7), "user_id": 999}
    )
    ticket = response.json()["ticket"]
    assert client.app.state.tickets._tickets[ticket][1].user_id == 7


def test_miniapp_assets_are_not_cached_by_telegram_webview() -> None:
    client, _ = make_client()
    for path in ("/miniapp/", "/miniapp/app.js", "/miniapp/session.js"):
        assert client.get(path).headers["cache-control"] == "no-cache"


@pytest.mark.parametrize(
    "patch", [{"mode": "chat"}, {"language": "de"}, {"input_sample_rate": 1000}, {"subject": "<script>"}]
)
def test_invalid_body_is_rejected(patch: dict) -> None:
    client, _ = make_client()
    response = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data(), **patch})
    assert response.status_code == 422


def test_valid_session_returns_ticket_and_never_the_key() -> None:
    client, _ = make_client()
    response = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data()})
    assert response.status_code == 200
    body = response.json()
    assert body["ws_path"] == "/api/voice/ws" and len(body["ticket"]) > 30
    assert "test-gemini-key" not in response.text


# ---------- WebSocket ----------


def test_ws_rejects_unknown_ticket() -> None:
    client, gateway = make_client()
    with client.websocket_connect("/api/voice/ws?ticket=bogus") as ws:
        message = receive(ws)
        assert message["type"] == "error" and message["code"] == "invalid_ticket"
        assert receive(ws)["type"] == "websocket.close"
    assert gateway.opened == 0


def test_ws_ticket_is_single_use() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["code"] == "invalid_ticket"


def test_full_conversation_flow() -> None:
    client, gateway = make_client()
    session = gateway.session
    session.on_first_audio = [
        content_message(input_transcription=types.Transcription(text="Salom")),
        audio_message(b"\x10\x00\x20\x00"),
        content_message(output_transcription=types.Transcription(text="Assalomu alaykum!")),
        content_message(interrupted=True),
        content_message(turn_complete=True),
    ]
    ticket = create_ticket(client)

    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        ready = receive(ws)
        assert ready == {"type": "ready", "max_seconds": 600}

        # Tutor configuration: audio out, transcripts on, VOXY persona, greeting kickoff.
        call = gateway.connect_calls[0]
        assert call["model"] == "gemini-3.8-live"
        config: types.LiveConnectConfig = call["config"]
        assert config.response_modalities == [types.Modality.AUDIO]
        assert config.input_audio_transcription is not None and config.output_audio_transcription is not None
        assert "VOXY" in config.system_instruction.parts[0].text
        assert "Mathematics" in config.system_instruction.parts[0].text
        assert session.client_contents and session.client_contents[0]["turn_complete"] is True

        ws.send_bytes(b"\x00\x01" * 800)  # 100 ms-ish PCM16 chunk
        items = receive_until(ws, "turn_complete")

        assert {"type": "transcript", "role": "student", "text": "Salom"} in items
        assert b"\x10\x00\x20\x00" in items  # tutor audio forwarded as a binary frame
        assert {"type": "transcript", "role": "tutor", "text": "Assalomu alaykum!"} in items
        assert {"type": "interrupted"} in items

        sent = session.realtime_inputs[0]["audio"]
        assert sent.mime_type == "audio/pcm;rate=48000"
        assert sent.data == b"\x00\x01" * 800

        ws.send_text(json.dumps({"type": "end"}))
        summary_msg = receive_until(ws, "summary")[-1]
        assert summary_msg["reason"] == "client_end"
        assert summary_msg["summary"]["status"] == "ok"
        assert summary_msg["summary"]["content"]["topics"] == ["Present simple"]
        assert receive(ws)["type"] == "websocket.close"

    assert gateway.opened == 1 and gateway.closed == 1  # Gemini session released
    assert "STUDENT: Salom" in gateway.summary_calls[0]["prompt"]
    assert not client.app.state.tickets.is_active(42)  # per-user lock released


def test_mute_signals_stream_end_and_drops_audio() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        ws.send_text(json.dumps({"type": "mute"}))
        ws.send_bytes(b"\x00\x00" * 100)  # must be dropped
        ws.send_text(json.dumps({"type": "unmute"}))
        ws.send_bytes(b"\x01\x00" * 100)
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")
    inputs = gateway.session.realtime_inputs
    assert inputs[0] == {"audio_stream_end": True}
    assert len(inputs) == 2 and inputs[1]["audio"].data == b"\x01\x00" * 100


def test_invalid_audio_frames_are_ignored() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        ws.send_bytes(b"\x01\x02\x03")  # odd length: not PCM16
        ws.send_bytes(b"\x00" * (64 * 1024 + 2))  # too large
        ws.send_text("{not json")
        ws.send_text(json.dumps({"type": "drop_database"}))
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")
    assert gateway.session.realtime_inputs == []


def test_empty_session_summary_without_model_call() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        ws.send_text(json.dumps({"type": "end"}))
        summary = receive_until(ws, "summary")[-1]["summary"]
    assert summary["status"] == "empty"
    assert gateway.summary_calls == []


@pytest.mark.parametrize(
    ("error", "code"),
    [
        (errors.APIError(401, {"error": {"message": "API key not valid"}}), "ai_auth_failed"),
        (errors.APIError(404, {"error": {"message": "model not found"}}), "ai_model_unavailable"),
        (errors.APIError(429, {"error": {"message": "quota"}}), "ai_quota"),
        (OSError("network unreachable"), "ai_connect_failed"),
    ],
)
def test_gemini_connect_failures_are_reported(error: BaseException, code: str) -> None:
    client, gateway = make_client(FakeGateway(connect_error=error))
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        message = receive(ws)
        assert message["type"] == "error" and message["code"] == code
        assert "test-gemini-key" not in message["message"]
        assert receive(ws)["type"] == "websocket.close"
    assert not client.app.state.tickets.is_active(42)


def test_gemini_connection_lost_mid_session() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(errors.APIError(1011, {"error": {"message": "internal"}}))
        message = receive_until(ws, "error")[-1]
        assert message["code"] == "ai_connection_lost"
    assert gateway.closed == 1


def test_gemini_closing_the_stream_ends_with_summary() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(CLOSED)
        assert receive_until(ws, "summary")[-1]["reason"] == "ai_closed"


def test_go_away_ends_gracefully() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(types.LiveServerMessage(go_away=types.LiveServerGoAway(time_left="5s")))
        items = receive_until(ws, "summary")
    assert {"type": "go_away"} in items
    assert items[-1]["reason"] == "ai_go_away"


def test_time_limit_ends_session() -> None:
    client, gateway = make_client(max_session_seconds=1)
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["max_seconds"] == 1
        assert receive_until(ws, "summary")[-1]["reason"] == "time_limit"
    assert gateway.closed == 1


def test_client_disconnect_cleans_up_without_summary() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
    # Leaving the block closes the socket abruptly. Wait for the server to notice.
    for _ in range(200):
        if gateway.closed:
            break
        time.sleep(0.01)
    assert gateway.closed == 1
    assert gateway.summary_calls == []
    assert not client.app.state.tickets.is_active(42)


def test_second_concurrent_session_for_same_user_is_refused() -> None:
    client, _ = make_client()
    first = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={first}") as ws:
        assert receive(ws)["type"] == "ready"
        response = client.post("/api/voice/session", json={**BODY, "init_data": make_init_data()})
        assert response.status_code == 409
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")


# ---------- reconnection (session resumption) ----------


def resumption(handle: str) -> types.LiveServerMessage:
    return types.LiveServerMessage(
        session_resumption_update=types.LiveServerSessionResumptionUpdate(new_handle=handle, resumable=True)
    )


def test_live_config_enables_resumption_and_compression() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        config = gateway.connect_calls[0]["config"]
        assert config.session_resumption is not None and config.session_resumption.handle is None
        assert config.context_window_compression.sliding_window is not None
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")


def test_go_away_with_handle_reconnects_transparently() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(resumption("handle-1"))
        gateway.session.inbox.put(types.LiveServerMessage(go_away=types.LiveServerGoAway(time_left="5s")))
        items = receive_until(ws, "reconnected")
        assert {"type": "go_away"} in items and {"type": "reconnecting"} in items

        # The same conversation is resumed with the last handle, and no second greeting is sent.
        assert gateway.connect_calls[1]["config"].session_resumption.handle == "handle-1"
        assert gateway.current.client_contents == []

        # Audio now flows to the new connection.
        ws.send_bytes(b"\x05\x00" * 10)
        ws.send_text(json.dumps({"type": "end"}))
        assert receive_until(ws, "summary")[-1]["reason"] == "client_end"
    assert gateway.current.realtime_inputs[0]["audio"].data == b"\x05\x00" * 10
    assert gateway.opened == 2 and gateway.closed == 2


def test_connection_lost_with_handle_reconnects() -> None:
    client, gateway = make_client()
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(resumption("h"))
        gateway.session.inbox.put(errors.APIError(1011, {"error": {"message": "internal"}}))
        assert {"type": "reconnecting"} in receive_until(ws, "reconnected")
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")


def test_reconnect_gives_up_after_repeated_failures() -> None:
    client, gateway = make_client()
    gateway.reconnect_errors = [OSError("down")] * 10
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(resumption("h"))
        gateway.session.inbox.put(errors.APIError(1011, {"error": {"message": "internal"}}))
        error = receive_until(ws, "error")[-1]
        assert error["code"] == "ai_connection_lost"
    assert not client.app.state.tickets.is_active(42)


def test_auth_error_during_reconnect_is_not_retried() -> None:
    client, gateway = make_client()
    gateway.reconnect_errors = [errors.APIError(403, {"error": {"message": "permission denied"}})]
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(resumption("h"))
        gateway.session.inbox.put(CLOSED)
        assert receive_until(ws, "error")[-1]["code"] == "ai_auth_failed"
    assert len(gateway.connect_calls) == 2


def test_audio_send_failure_does_not_kill_the_session() -> None:
    client, gateway = make_client()

    async def broken_send(**kwargs):
        raise OSError("socket write failed")

    gateway.session.send_realtime_input = broken_send
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        ws.send_bytes(b"\x01\x00" * 100)  # upload fails; frame is dropped
        gateway.session.inbox.put(audio_message(b"\x09\x00"))
        assert receive(ws) == b"\x09\x00"  # downstream still works
        ws.send_text(json.dumps({"type": "end"}))
        assert receive_until(ws, "summary")[-1]["reason"] == "client_end"


def test_audio_during_reconnect_is_dropped_not_queued() -> None:
    client, gateway = make_client()
    release = __import__("threading").Event()

    original_connect = gateway._connect

    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def slow_reconnect(**kwargs):
        if gateway.sessions:  # second connection: wait until the test has sent stale audio
            while not release.is_set():
                await __import__("asyncio").sleep(0.005)
        async with original_connect(**kwargs) as session:
            yield session

    gateway._connect = slow_reconnect
    ticket = create_ticket(client)
    with client.websocket_connect(f"/api/voice/ws?ticket={ticket}") as ws:
        assert receive(ws)["type"] == "ready"
        gateway.session.inbox.put(resumption("h"))
        gateway.session.inbox.put(CLOSED)
        receive_until(ws, "reconnecting")
        ws.send_bytes(b"\x07\x00" * 10)  # arrives while reconnecting
        ws.send_text(json.dumps({"type": "mute"}))  # forces a round-trip through upstream
        time.sleep(0.05)
        release.set()
        receive_until(ws, "reconnected")
        ws.send_text(json.dumps({"type": "end"}))
        receive_until(ws, "summary")
    assert gateway.current.realtime_inputs == []


def test_user_facing_ai_errors_do_not_name_server_env_vars() -> None:
    """Talabaga «GEMINI_API_KEY noto'g'ri» deyish — ichki sozlama nomini oshkor qilish."""
    from google.genai import errors

    from app.services.live_bridge import _error_code

    for exc in (
        errors.APIError(401, {"error": {"message": "API key not valid"}}),
        errors.APIError(404, {"error": {"message": "model not found"}}),
    ):
        code, message = _error_code(exc)
        assert code.startswith("ai_")
        lowered = message.lower()
        assert "gemini_api_key" not in lowered
        assert "gemini_live_model" not in lowered
        assert "api key" not in lowered


def test_high_sample_rate_microphones_are_accepted():
    """96 kHz mikrofon suhbatni boshlashga to'sqinlik qilmasligi kerak.

    Brauzer AudioContext ning haqiqiy chastotasini yuboradi — biz uni
    tanlamaymiz. Ilgari yuqori chegara 48000 edi va professional audio
    interfeys yoki ba'zi Android qurilmalari 96000 ni xabar qilganda
    pydantic tushunarsiz 422 qaytarar, suhbat esa umuman boshlanmasdi.
    """
    from app.api.voice import CreateSessionBody

    for rate in (8000, 16000, 44100, 48000, 96000, 192000):
        assert CreateSessionBody(input_sample_rate=rate).input_sample_rate == rate


def test_absurd_sample_rates_are_still_rejected():
    """Chegara butunlay olib tashlanmadi: ma'nosiz qiymat baribir rad etiladi."""
    import pytest
    from pydantic import ValidationError

    from app.api.voice import CreateSessionBody

    for rate in (0, 100, 1_000_000):
        with pytest.raises(ValidationError):
            CreateSessionBody(input_sample_rate=rate)
