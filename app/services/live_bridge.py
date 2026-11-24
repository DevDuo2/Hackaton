"""Bridges one Mini App WebSocket to a Gemini Live session (with transparent reconnects).

Client -> server
  binary frame          PCM16 LE mono at the sample rate given when the session was created
  {"type": "mute"}      stop forwarding audio; tells Gemini the audio stream paused
  {"type": "unmute"}
  {"type": "end"}       finish: close Gemini, build the summary, send it, close
Server -> client
  {"type": "ready", "max_seconds": n}     Gemini session is set up
  binary frame                            PCM16 LE mono 24 kHz tutor audio
  {"type": "interrupted"}                 student barged in: flush queued playback now
  {"type": "turn_complete"}
  {"type": "transcript", "role": "student"|"tutor", "text": "..."}
  {"type": "go_away"}                     Gemini announced the connection will end soon
  {"type": "reconnecting"}                Gemini connection dropped; resuming with the last handle
  {"type": "reconnected"}                 same conversation continues
  {"type": "summary", "reason": "...", "summary": {...}}
  {"type": "error", "code": "...", "message": "..."}  then close

Structure: three tasks run side by side for the whole session —
  upstream     reads the client WS and forwards audio to the *current* Gemini session
               (audio arriving while (re)connecting is dropped, never queued: stale audio is useless)
  connections  opens Gemini, pumps Gemini -> client, reconnects with the resumption handle
  time_limit   caps session length (cost control)
The first one to finish decides how the session ends.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Literal

from fastapi import WebSocket
from google.genai import errors, types
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.config import VoiceSettings
from app.services.gemini import AIGateway, LiveSession, build_live_config
from app.services.summary import Transcript, summarize
from app.services.tickets import SessionRequest
from app.services.tutor_prompt import build_system_instruction

logger = logging.getLogger(__name__)

MAX_AUDIO_FRAME_BYTES = 64 * 1024  # ~1 s at 32 kHz; real frames are ~100 ms
KICKOFF = "(The student has just joined the voice session. Greet them now.)"
MAX_CONSECUTIVE_FAILURES = 3
MAX_RECONNECTS_PER_SESSION = 10
RECONNECT_BACKOFF_SECONDS = (0.25, 1.0, 2.0)
NON_RETRYABLE = frozenset({"ai_auth_failed", "ai_model_unavailable", "ai_quota"})

EndReason = Literal["client_end", "client_disconnected", "time_limit", "ai_go_away", "ai_closed"]


class SessionFailed(Exception):
    """Unrecoverable failure; `code`/`message` are safe to show to the student."""

    def __init__(self, code: str, message: str) -> None:
        super().__init__(code)
        self.code = code
        self.message = message


def _error_code(exc: BaseException) -> tuple[str, str]:
    """Map SDK failures to client-safe codes. Details go to the server log only."""
    if isinstance(exc, errors.APIError):
        status = getattr(exc, "code", None)
        text = str(exc).lower()
        if status in (401, 403) or "api key" in text or "permission" in text:
            return "ai_auth_failed", "AI xizmati kalitni qabul qilmadi (GEMINI_API_KEY noto'g'ri)."
        if status == 404 or "not found" in text:
            return "ai_model_unavailable", "AI modeli topilmadi (GEMINI_LIVE_MODEL)."
        if status == 429 or "quota" in text or "resource_exhausted" in text:
            return "ai_quota", "AI xizmati limiti tugadi. Keyinroq urinib ko'ring."
    return "ai_connect_failed", "AI xizmatiga ulanib bo'lmadi."


CONNECTION_LOST = ("ai_connection_lost", "AI bilan aloqa uzildi.")


@dataclass(slots=True)
class SessionStats:
    frames_to_gemini: int = 0  # microphone frames Gemini accepted (send succeeded)
    bytes_to_gemini: int = 0
    dropped_frames: int = 0  # muted, invalid, (re)connecting or failed sends
    chunks_from_gemini: int = 0  # tutor audio chunks forwarded to the browser
    bytes_from_gemini: int = 0
    interruptions: int = 0


class LiveBridge:
    def __init__(
        self,
        ws: WebSocket,
        request: SessionRequest,
        settings: VoiceSettings,
        gateway: AIGateway,
        clock: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], object] = asyncio.sleep,
    ) -> None:
        self.ws = ws
        self.request = request
        self.settings = settings
        self.gateway = gateway
        self.clock = clock
        self.sleep = sleep
        self.transcript = Transcript()
        self.muted = False
        self.mime_type = f"audio/pcm;rate={request.input_sample_rate}"
        self.instruction = build_system_instruction(
            mode=request.mode, language=request.language, subject=request.subject, first_name=request.first_name
        )
        self._session: LiveSession | None = None  # current Gemini connection, None while (re)connecting
        self._resume_handle: str | None = None
        self.reconnects = 0
        self.stats = SessionStats()

    async def run(self) -> None:
        started = self.clock()
        outcome = "unknown"
        try:
            outcome = await self._run()
        finally:
            s = self.stats
            # One line per session, counts only (no audio, no text, no user id): this is how an
            # operator verifies that microphone audio reached Gemini and Gemini audio came back.
            logger.info(
                "voice session ended: outcome=%s duration=%ds audio_to_gemini=%d frames/%d bytes "
                "dropped_frames=%d audio_from_gemini=%d chunks/%d bytes interruptions=%d reconnects=%d "
                "student_speech=%s tutor_speech=%s",
                outcome, round(self.clock() - started), s.frames_to_gemini, s.bytes_to_gemini,
                s.dropped_frames, s.chunks_from_gemini, s.bytes_from_gemini, s.interruptions,
                self.reconnects, self.transcript.count("student") > 0, self.transcript.count("tutor") > 0,
            )

    async def _run(self) -> str:
        started = self.clock()
        tasks = {
            asyncio.create_task(self._upstream(), name="upstream"),
            asyncio.create_task(self._connections(), name="connections"),
            asyncio.create_task(self._time_limit(), name="time_limit"),
        }
        try:
            done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
        finally:
            # Cancelling `connections` exits its `async with`, which closes the Gemini WebSocket.
            for task in tasks:
                task.cancel()
            for task in tasks:
                with contextlib.suppress(asyncio.CancelledError, Exception):
                    await task

        finished = done.pop()
        exc = finished.exception()
        if isinstance(exc, WebSocketDisconnect):
            return "client_disconnected"  # nobody to deliver a summary to
        if isinstance(exc, SessionFailed):
            await self._fail(exc.code, exc.message)
            return exc.code
        if exc is not None:
            logger.error("voice session failed: %r", exc)
            await self._fail(*CONNECTION_LOST)
            return CONNECTION_LOST[0]

        reason: EndReason = finished.result()
        if reason == "client_disconnected":
            # Includes server shutdown: uvicorn closes every WebSocket with 1012 on SIGTERM and the
            # app sees a disconnect. Cancelling the tasks above already closed the Gemini session.
            return reason

        summary = await summarize(
            self.gateway,
            models=self.settings.summary_models,
            transcript=self.transcript,
            language="en" if self.request.mode == "english" else self.request.language,
            duration_seconds=round(self.clock() - started),
        )
        try:
            await self._send_json({"type": "summary", "reason": reason, "summary": summary.model_dump()})
        except Exception as send_error:  # client left (or server shut down) while we summarized
            logger.info("summary not delivered: %r", send_error)
            return f"{reason}+summary_undelivered"
        await self._close(1000)
        return reason

    # ---------- Gemini side ----------

    async def _connections(self) -> EndReason:
        first = True
        failures = 0
        while True:
            outcome: str
            try:
                config = build_live_config(self.instruction, resume_handle=self._resume_handle)
                async with self.gateway.connect_live(model=self.settings.live_model, config=config) as session:
                    if first:
                        await session.send_client_content(
                            turns=types.Content(role="user", parts=[types.Part(text=KICKOFF)]),
                            turn_complete=True,
                        )
                        await self._send_json({"type": "ready", "max_seconds": self.settings.max_session_seconds})
                        first = False
                    else:
                        await self._send_json({"type": "reconnected"})
                    failures = 0
                    self._session = session
                    try:
                        outcome = await self._downstream(session)
                    finally:
                        self._session = None
            except WebSocketDisconnect:
                raise  # client went away while we were sending to it
            except Exception as exc:
                code, message = _error_code(exc)
                if first:
                    logger.warning("Gemini Live connect failed: %r", exc)
                    raise SessionFailed(code, message) from exc
                if code in NON_RETRYABLE:
                    logger.warning("Gemini Live failed (not retryable): %r", exc)
                    raise SessionFailed(code, message) from exc
                logger.warning("Gemini Live connection lost: %r", exc)
                outcome = "lost"
                failures += 1

            if self._resume_handle is None:
                # Nothing to resume: a fresh session would forget the conversation.
                if outcome == "lost":
                    raise SessionFailed(*CONNECTION_LOST)
                return outcome  # type: ignore[return-value]  # ai_go_away / ai_closed
            if failures > MAX_CONSECUTIVE_FAILURES or self.reconnects >= MAX_RECONNECTS_PER_SESSION:
                raise SessionFailed(*CONNECTION_LOST)

            self.reconnects += 1
            await self._send_json({"type": "reconnecting"})
            if failures:
                await self.sleep(RECONNECT_BACKOFF_SECONDS[min(failures, len(RECONNECT_BACKOFF_SECONDS)) - 1])

    async def _downstream(self, session: LiveSession) -> str:
        while True:
            received_any = False
            # receive() ends after each completed turn, so it is re-entered in a loop.
            async for message in session.receive():
                received_any = True
                update = message.session_resumption_update
                if update is not None and update.resumable and update.new_handle:
                    self._resume_handle = update.new_handle
                if message.go_away is not None:
                    await self._send_json({"type": "go_away"})
                    return "ai_go_away"
                await self._forward(message.server_content)
            if not received_any:
                return "ai_closed"

    async def _forward(self, content: types.LiveServerContent | None) -> None:
        if content is None:
            return
        if content.interrupted:
            self.stats.interruptions += 1
            await self._send_json({"type": "interrupted"})
        if content.model_turn and content.model_turn.parts:
            for part in content.model_turn.parts:
                blob = part.inline_data
                if blob and blob.data and (blob.mime_type or "").startswith("audio/"):
                    await self.ws.send_bytes(blob.data)
                    self.stats.chunks_from_gemini += 1
                    self.stats.bytes_from_gemini += len(blob.data)
        if content.input_transcription and content.input_transcription.text:
            await self._caption("student", content.input_transcription.text)
        if content.output_transcription and content.output_transcription.text:
            await self._caption("tutor", content.output_transcription.text)
        if content.turn_complete:
            await self._send_json({"type": "turn_complete"})

    async def _caption(self, role: Literal["student", "tutor"], text: str) -> None:
        self.transcript.add(role, text)
        await self._send_json({"type": "transcript", "role": role, "text": text})

    # ---------- client side ----------

    async def _upstream(self) -> EndReason:
        while True:
            message = await self.ws.receive()
            if message["type"] == "websocket.disconnect":
                return "client_disconnected"

            data = message.get("bytes")
            if data is not None:
                if self.muted or not data or len(data) > MAX_AUDIO_FRAME_BYTES or len(data) % 2:
                    self.stats.dropped_frames += 1  # invalid / muted frames
                    continue
                if await self._send_to_gemini(audio=types.Blob(data=data, mime_type=self.mime_type)):
                    self.stats.frames_to_gemini += 1
                    self.stats.bytes_to_gemini += len(data)
                else:
                    self.stats.dropped_frames += 1
                continue

            command = _parse_command(message.get("text"))
            if command == "end":
                return "client_end"
            if command == "mute" and not self.muted:
                self.muted = True
                # Docs: signal a paused stream so server-side VAD can close the user's turn.
                await self._send_to_gemini(audio_stream_end=True)
            elif command == "unmute":
                self.muted = False

    async def _send_to_gemini(self, **kwargs) -> bool:
        session = self._session
        if session is None:
            return False  # (re)connecting: drop instead of buffering stale audio
        try:
            await session.send_realtime_input(**kwargs)
        except Exception as exc:
            # A broken connection is detected and handled by the downstream reader; dropping one
            # frame here is better than tearing the whole session down from the upload path.
            logger.info("dropped input frame, Gemini send failed: %r", exc)
            return False
        return True

    async def _time_limit(self) -> EndReason:
        await asyncio.sleep(self.settings.max_session_seconds)
        return "time_limit"

    async def _send_json(self, payload: dict) -> None:
        if self.ws.application_state == WebSocketState.CONNECTED:
            await self.ws.send_text(json.dumps(payload, ensure_ascii=False))

    async def _fail(self, code: str, message: str) -> None:
        await self._send_json({"type": "error", "code": code, "message": message})
        await self._close(1011)

    async def _close(self, code: int) -> None:
        if self.ws.application_state == WebSocketState.CONNECTED:
            with contextlib.suppress(Exception):
                await self.ws.close(code)


def _parse_command(text: str | None) -> str | None:
    if not text or len(text) > 256:
        return None
    try:
        payload = json.loads(text)
    except ValueError:
        return None
    kind = payload.get("type") if isinstance(payload, dict) else None
    return kind if kind in {"end", "mute", "unmute"} else None
