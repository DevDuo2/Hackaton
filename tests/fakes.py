"""Test doubles for the Gemini gateway. No network, no credentials."""

from __future__ import annotations

import asyncio
import json
import queue
import time
from contextlib import asynccontextmanager
from urllib.parse import urlencode

from google.genai import types

from app.config import Settings
from app.services.telegram_auth import compute_hash

BOT_TOKEN = "123456:TEST-BOT-TOKEN"
CLOSED = object()


def settings(**overrides) -> Settings:
    base = dict(
        bot_token=BOT_TOKEN,
        mini_app_url="https://voxy.example.com/miniapp/",
        backend_url="http://testserver",
        gemini_api_key="test-gemini-key",
    )
    base.update(overrides)
    return Settings(**base)


def make_init_data(user_id: int = 42, first_name: str = "Ali", auth_date: int | None = None, **extra) -> str:
    fields = {
        "query_id": "AAH-test",
        "user": json.dumps({"id": user_id, "first_name": first_name, "language_code": "uz"}, separators=(",", ":")),
        "auth_date": str(int(time.time()) if auth_date is None else auth_date),
        **extra,
    }
    fields["hash"] = compute_hash(fields, BOT_TOKEN)
    return urlencode(fields)


def audio_message(data: bytes = b"\x01\x00\x02\x00") -> types.LiveServerMessage:
    return types.LiveServerMessage(
        server_content=types.LiveServerContent(
            model_turn=types.Content(
                parts=[types.Part(inline_data=types.Blob(data=data, mime_type="audio/pcm;rate=24000"))]
            )
        )
    )


def content_message(**kwargs) -> types.LiveServerMessage:
    return types.LiveServerMessage(server_content=types.LiveServerContent(**kwargs))


class FakeLiveSession:
    """Mimics google-genai AsyncSession: receive() yields until a completed turn."""

    def __init__(self) -> None:
        self.realtime_inputs: list[dict] = []
        self.client_contents: list[dict] = []
        # Thread-safe: the test thread pushes, the app's event loop (another thread) pulls.
        self.inbox: queue.Queue = queue.Queue()
        self.on_first_audio: list = []
        self.is_closed = False

    async def send_realtime_input(self, **kwargs) -> None:
        first_audio = "audio" in kwargs and not any("audio" in k for k in self.realtime_inputs)
        self.realtime_inputs.append(kwargs)
        if first_audio:
            for message in self.on_first_audio:
                self.inbox.put(message)

    async def send_client_content(self, **kwargs) -> None:
        self.client_contents.append(kwargs)

    async def receive(self):
        if self.is_closed:
            return  # a closed connection yields nothing, every time
        while True:
            try:
                item = self.inbox.get_nowait()
            except queue.Empty:
                await asyncio.sleep(0.005)
                continue
            if item is CLOSED:
                self.is_closed = True
                return
            if isinstance(item, BaseException):
                raise item
            yield item
            content = item.server_content
            if content is not None and content.turn_complete:
                return


class FakeGateway:
    """`session` is the first connection (configure it before connecting); every reconnect opens a
    new FakeLiveSession, appended to `sessions`. `reconnect_errors` fail the next N reconnects."""

    def __init__(
        self,
        *,
        connect_error: BaseException | None = None,
        summary_json: str | BaseException = '{"topics": ["Present simple"]}',
    ) -> None:
        self.session = FakeLiveSession()
        self.sessions: list[FakeLiveSession] = []
        self.connect_error = connect_error
        self.reconnect_errors: list[BaseException] = []
        self.summary_json = summary_json
        self.opened = 0
        self.closed = 0
        self.connect_calls: list[dict] = []
        self.summary_calls: list[dict] = []

    @property
    def current(self) -> FakeLiveSession:
        return self.sessions[-1] if self.sessions else self.session

    @asynccontextmanager
    async def _connect(self, **kwargs):
        self.connect_calls.append(kwargs)
        if self.connect_error is not None:
            raise self.connect_error
        if self.sessions and self.reconnect_errors:
            raise self.reconnect_errors.pop(0)
        session = self.session if not self.sessions else FakeLiveSession()
        self.sessions.append(session)
        self.opened += 1
        try:
            yield session
        finally:
            self.closed += 1

    def connect_live(self, *, model, config):
        return self._connect(model=model, config=config)

    async def generate_json(self, **kwargs) -> str:
        self.summary_calls.append(kwargs)
        if isinstance(self.summary_json, BaseException):
            raise self.summary_json
        return self.summary_json
