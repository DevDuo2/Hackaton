"""Thin boundary around the google-genai SDK. Everything else depends on the protocols below,
so tests can substitute fakes without network access or credentials.

SDK surface used (verified against google-genai 3.6 and ai.google.dev Live API docs):
  client.aio.live.connect(model=..., config=LiveConnectConfig) -> async context manager session
  session.send_realtime_input(audio=Blob | audio_stream_end=True)
  session.send_client_content(turns=Content, turn_complete=True)
  session.receive() -> async iterator of LiveServerMessage, ends after each completed turn
  client.aio.models.generate_content(model=..., contents=..., config=GenerateContentConfig)
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import AbstractAsyncContextManager
from typing import Any, Protocol

from google import genai
from google.genai import types


class LiveSession(Protocol):
    async def send_realtime_input(self, **kwargs: Any) -> None: ...

    async def send_client_content(self, **kwargs: Any) -> None: ...

    def receive(self) -> AsyncIterator[types.LiveServerMessage]: ...


class AIGateway(Protocol):
    def connect_live(
        self, *, model: str, config: types.LiveConnectConfig
    ) -> AbstractAsyncContextManager[LiveSession]: ...

    async def generate_json(
        self, *, model: str, system_instruction: str, prompt: str, schema: type
    ) -> str: ...


class GeminiGateway:
    """Real implementation. The API key stays here, on the server."""

    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})

    def connect_live(
        self, *, model: str, config: types.LiveConnectConfig
    ) -> AbstractAsyncContextManager[LiveSession]:
        return self._client.aio.live.connect(model=model, config=config)

    async def generate_json(
        self, *, model: str, system_instruction: str, prompt: str, schema: type
    ) -> str:
        response = await self._client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2,
                # gemini-3.8-flash thinks at "medium" by default; a real test took >25 s.
                # A transcript summary needs little reasoning, and the student is waiting for it.
                thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW),
                # The SDK retries 5x with backoff by default; on a real 503 ("high demand") that
                # hung for 90 s. Fail fast instead: summary.py falls back to the next model.
                http_options=types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=1)),
            ),
        )
        return response.text or ""


    async def get_model(self, model: str) -> types.Model:
        """Model metadata (used by scripts/check_gemini.py to verify Live support)."""
        return await self._client.aio.models.get(model=model)


def build_live_config(system_instruction: str, resume_handle: str | None = None) -> types.LiveConnectConfig:
    return types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        system_instruction=types.Content(parts=[types.Part(text=system_instruction)]),
        # Transcripts power the captions and the end-of-session summary.
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
        # Automatic VAD (the default) lets the student interrupt; the server then sends
        # server_content.interrupted and we flush playback on the client.
        #
        # Session management (ai.google.dev/gemini-api/docs/live-api/session-management):
        # - session_resumption makes the server send resumable handles; passing the last one on a
        #   new connection continues the same conversation after a reset or GoAway.
        # - sliding-window compression lifts the 15-minute audio session limit.
        session_resumption=types.SessionResumptionConfig(handle=resume_handle),
        context_window_compression=types.ContextWindowCompressionConfig(sliding_window=types.SlidingWindow()),
    )
