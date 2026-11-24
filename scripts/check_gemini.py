"""Check the real Gemini setup: is the configured model available for the Live API, and does one
Live round-trip return audio?

    .venv\\Scripts\\python scripts\\check_gemini.py            # model check + Live round-trip
    .venv\\Scripts\\python scripts\\check_gemini.py --model-only

Costs a few seconds of real API usage. Reads GEMINI_API_KEY from .env / the environment.
The key is never printed: the SDK sends it only as the `x-goog-api-key` header over TLS to
generativelanguage.googleapis.com. The script refuses to run if the endpoint resolves to any other
host or if proxy / base-URL / CA-override variables are set.
This script does NOT test the microphone or browser playback; see docs/real-device-testing.md.
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from google.genai import types  # noqa: E402

from app.config import ConfigError, load_settings, require_voice_settings  # noqa: E402
from app.services.gemini import GeminiGateway, build_live_config  # noqa: E402
from app.services.live_bridge import KICKOFF, _error_code  # noqa: E402
from app.services.tutor_prompt import build_system_instruction  # noqa: E402

LIVE_ACTION = "bidiGenerateContent"  # supported_actions entry for Live API models
OFFICIAL_HOST = "generativelanguage.googleapis.com"
# Anything that could send the key somewhere else or let a proxy intercept TLS: refuse to run.
REDIRECTING_ENV = (
    "GOOGLE_GEMINI_BASE_URL", "GOOGLE_VERTEX_BASE_URL", "GOOGLE_GENAI_USE_VERTEXAI",
    "GOOGLE_GENAI_USE_ENTERPRISE", "HTTPS_PROXY", "HTTP_PROXY", "ALL_PROXY", "SSL_CERT_FILE", "SSL_CERT_DIR",
)


def redact(text: str, secret: str) -> str:
    return text.replace(secret, "***") if secret else text


async def check_model(gateway: GeminiGateway, model: str, key: str) -> bool:
    try:
        info = await gateway.get_model(model)
    except Exception as exc:  # noqa: BLE001
        code, message = _error_code(exc)
        print(f"MODEL CHECK FAILED: {code} — {message}\n  detail: {type(exc).__name__}: {redact(str(exc), key)[:300]}")
        return False
    actions = info.supported_actions or []
    print(f"model: {info.name} ({info.display_name or '-'})")
    print(f"supported actions: {', '.join(actions) or 'not reported'}")
    if actions and LIVE_ACTION not in actions:
        print(f"MODEL CHECK FAILED: {model} does not list {LIVE_ACTION}; choose a Live model in GEMINI_LIVE_MODEL.")
        return False
    print("model check: OK")
    return True


async def live_round_trip(gateway: GeminiGateway, model: str, key: str) -> bool:
    config = build_live_config(build_system_instruction(mode="tutor", language="uz", subject="math"))
    t0 = time.monotonic()
    audio_bytes, transcript, first_audio_at, handle = 0, "", None, False
    try:
        async with gateway.connect_live(model=model, config=config) as session:
            print(f"Live connected in {time.monotonic() - t0:.2f}s")
            await session.send_client_content(
                turns=types.Content(role="user", parts=[types.Part(text=KICKOFF)]), turn_complete=True
            )

            async def collect() -> None:
                nonlocal audio_bytes, transcript, first_audio_at, handle
                async for msg in session.receive():
                    if msg.session_resumption_update and msg.session_resumption_update.new_handle:
                        handle = True
                    content = msg.server_content
                    if not content:
                        continue
                    for part in (content.model_turn.parts if content.model_turn else None) or []:
                        if part.inline_data and part.inline_data.data:
                            first_audio_at = first_audio_at or time.monotonic()
                            audio_bytes += len(part.inline_data.data)
                    if content.output_transcription and content.output_transcription.text:
                        transcript += content.output_transcription.text

            await asyncio.wait_for(collect(), timeout=30)
    except Exception as exc:  # noqa: BLE001
        code, message = _error_code(exc)
        print(f"LIVE FAILED: {code} — {message}\n  detail: {type(exc).__name__}: {redact(str(exc), key)[:300]}")
        return False

    print(f"first audio after {first_audio_at - t0:.2f}s" if first_audio_at else "no audio received")
    print(f"audio received: {audio_bytes} bytes ≈ {audio_bytes / 2 / 24000:.1f}s of 24 kHz PCM16")
    print(f"resumption handle received: {handle}")
    print(f"tutor said: {transcript.strip()!r}")
    return audio_bytes > 0


async def main() -> int:
    settings = load_settings()
    print(f"GEMINI_API_KEY set: {bool(settings.gemini_api_key)}")
    print(f"live model: {settings.gemini_live_model} | summary model: {settings.gemini_summary_model}")
    present = {k.upper() for k, v in os.environ.items() if v}
    for name in REDIRECTING_ENV:
        if name in present:  # case-insensitive: http_proxy / HTTP_PROXY
            print(f"WARNING: {name} is set — requests may not go straight to {OFFICIAL_HOST}. Aborting.")
            return 4
    # Only the Gemini key is needed here (BOT_TOKEN matters for the web app, not for this check).
    if not settings.gemini_api_key:
        print("CONFIG ERROR: GEMINI_API_KEY is not set.")
        return 1
    try:
        require_voice_settings(settings)
    except ConfigError as exc:
        print(f"note (not needed for this check, but needed by the web app): {exc}")
    api_key = settings.gemini_api_key
    live_model = settings.gemini_live_model

    gateway = GeminiGateway(api_key)
    # Show (and enforce) where the key will be sent, before any request is made.
    base_url = str(getattr(gateway._client._api_client._http_options, "base_url", "") or "")  # noqa: SLF001
    print(f"endpoint: {base_url}")
    if urlparse(base_url).hostname != OFFICIAL_HOST or urlparse(base_url).scheme != "https":
        print(f"WARNING: endpoint is not https://{OFFICIAL_HOST}/ — aborting without sending anything.")
        return 4
    if not await check_model(gateway, live_model, api_key):
        return 2
    if "--model-only" in sys.argv:
        return 0
    return 0 if await live_round_trip(gateway, live_model, api_key) else 3


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
