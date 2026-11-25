# VOXY

An educational platform with a Telegram Mini App and a real-time AI voice tutor.

> **Status: ready to deploy, not deployed yet.** The bot, the Mini App and the voice tutor on Gemini Live are implemented and have been used end to end: a person opened the Mini App from the bot on a real device, spoke to the tutor and heard it answer. `check_gemini.py` reaches `gemini-3.8-live` and gets audio back. The site (register, login, quizzes, progress, admin, subscription) was walked in a browser at 1440px and 375px against MongoDB Atlas. **Not confirmed yet:** a deployed server, separate iOS and Android passes, and a real session ending with a real summary. Note that roughly one Live session in four returned a transcript but no audio during testing; starting the session again recovered it. Details are in "What is verified" below.

## Scope and ownership

| Area | Owner |
|---|---|
| Telegram bot, Mini App voice screen, AI voice pipeline | Bot / AI developer |
| Main website frontend and backend | Website developer |

Still to agree between the two developers: which service owns the `users` table and authentication, and whether the website lives in this repository or a separate one.

## Stack

- Python 3.11+, FastAPI, Uvicorn
- python-telegram-bot 22 (async)
- google-genai 3.6 (official Gemini SDK, Live API v1beta)
- HTTPX, python-dotenv
- Mini App: plain HTML, CSS and ES modules, AudioWorklet and the Telegram WebApp SDK. No build step.

## Architecture

```
Mini App (Telegram WebView)                    FastAPI backend                         Google
───────────────────────────                    ───────────────                         ──────
1. Start → getUserMedia (user gesture)
2. POST /api/voice/session  ── initData ──►    verify initData HMAC (BOT_TOKEN)
                            ◄── ticket ────    issue single-use ticket (60 s)
3. WS /api/voice/ws?ticket  ═══ PCM16 ════►    LiveBridge ══ google-genai ══════►  Gemini Live
                            ◄══ PCM16 24k ═               ◄═ audio, transcripts ═   (gemini-3.8-live)
                            ◄── interrupted / transcript / summary (JSON)
4. End → mic released ── {"type":"end"} ──►    close Live session, summarize ────►  gemini-3.8-flash
                            ◄── summary ───
```

**Why a backend proxy and not ephemeral tokens.** The Live API's default authentication is server-to-server. Google offers ephemeral tokens for connecting directly from a browser, and recommends against using them between a backend and Gemini. VOXY uses the proxy because:

- the permanent `GEMINI_API_KEY` never leaves the server, and no token of any kind reaches the browser;
- the backend receives the transcripts and builds the session summary itself, so it doesn't have to trust text sent by the client;
- limits are enforced on the server: one session per user, a maximum session length, and frame size checks.

The cost is one extra network hop. If latency turns out to be a problem in practice, the alternative is to switch to ephemeral tokens with `live_connect_constraints`.

### Reconnection

The Live API resets its connection periodically: about every 10 minutes, after first sending `go_away`. VOXY enables `session_resumption` and keeps the latest `new_handle`. When the connection is lost, or a `go_away` arrives, the backend reconnects using that handle, and the conversation continues where it left off.

- The student's WebSocket stays open the whole time, and the Mini App shows "Qayta ulanmoqda" (reconnecting).
- Audio that arrives during a reconnect is dropped rather than queued, so the student never hears stale audio.
- Tutor audio that has already arrived keeps playing. Only `interrupted` stops it.
- The backend makes up to 3 consecutive attempts, waiting 0.25, 1 and 2 s between them, with at most 10 reconnects per session. Key, model and quota errors are not retried.
- Without a handle (Gemini hasn't sent one yet), the session ends with a summary.
- `context_window_compression` (sliding window) removes the 15-minute limit; `VOICE_MAX_SESSION_SECONDS` still caps sessions for cost.

### Security

- `initData` is verified with HMAC-SHA256 per the [Telegram docs](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app): constant-time comparison, an `auth_date` age limit, and a rejection of future timestamps. `initDataUnsafe` is never trusted.
- The WebSocket is authorized by a single-use ticket that lives 60 seconds. `initData` never appears in the URL.
- The student's identity comes **only** from verified `initData`. Extra fields such as `user_id` in the request body are ignored. Mode, language and subject are preferences, checked against allowed values.
- `DEV_SKIP_TELEGRAM_AUTH` works only for requests to `localhost` (through a tunnel the `Host` header is the public domain, so the bypass is refused), and it's **forbidden** when `APP_ENV=production`: the server won't start.
- One active voice session per Telegram user, and the Mini App ignores a repeated Start. Audio frames are checked for size and PCM16 alignment, and unknown commands are ignored.
- The user's Telegram name is sanitized before it goes into the system prompt. The summary model is told to treat the transcript as data.
- The frontend renders model output with `textContent` only, never as HTML.
- Errors sent to the client contain no keys or SDK internals. Details go only to the server log.

### Live API facts used (checked against ai.google.dev, November 2026)

| | |
|---|---|
| Model | `gemini-3.8-live`, the default Live model for voice agents. Override it with `GEMINI_LIVE_MODEL` |
| Audio in / out | raw PCM16 LE mono. Input at any rate, declared as `audio/pcm;rate=N`. Output at 24 kHz |
| Interruption | the server's automatic VAD sends `server_content.interrupted`, and the client drops its playback queue immediately |
| Language | native audio models choose the language themselves; `language_code` isn't supported, so language rules go in the system instruction |
| Limits | about 10 minutes per connection (handled by session resumption); 15 minutes per audio session without compression (compression is on). VOXY ends a session after `VOICE_MAX_SESSION_SECONDS` (600 by default) and builds a summary |
| Model check | `models.get` → `supported_actions` must include `bidiGenerateContent` (`scripts/check_gemini.py`) |

## Project structure

```
app/
  main.py                  FastAPI app factory, wiring (settings, tickets, gateway)
  config.py                settings from env / .env, with validation
  api/health.py            GET /api/health
  api/voice.py             GET /api/voice/status, POST /api/voice/session, WS /api/voice/ws
  services/
    telegram_auth.py       initData validation
    tickets.py             single-use WS tickets, one session per user (in-memory)
    tutor_prompt.py        VOXY tutor personality / system instruction
    gemini.py              the only module that calls the SDK (GeminiGateway + Live config)
    live_bridge.py         Mini App WS ↔ Gemini Live bridge, reconnection, timeouts, error mapping
    summary.py             transcript accumulation + end-of-session summary
  bot/                     Telegram bot (Stage 1, unchanged)
miniapp/
  index.html, style.css, app.js   UI and state machine
  session.js               voice session lifecycle: mic → audio → client (no DOM, tested in Node)
  mic.js                   microphone permission and lifecycle (no DOM)
  voice-client.js          session/WS protocol client, reconnect events, backpressure (no DOM)
  audio.js, pcm-worklet.js capture to PCM16 chunks, gapless 24 kHz playback, flush on interruption
  pcm.js                   PCM16 conversion helpers
tests/                     pytest (Gemini fully mocked, never reads .env) + tests/js (node:test)
scripts/check_gemini.py    real key check: model + one Live round-trip (run manually)
docs/real-device-testing.md  checklists for a browser, Telegram Android and Telegram iOS
docs/deployment.md         hosting, HTTPS/WSS, env, BotFather, deployment checks
deploy/env.template        full template for .env / platform variables (no secrets)
Procfile, Dockerfile       production start commands: web (uvicorn) and worker (bot)
```

## Mini App states

| State | Meaning |
|---|---|
| `requesting` | waiting for microphone permission |
| `connecting` | creating the session and connecting to Gemini |
| `listening` | connected (label "Ulandi · Tinglayapti", connected · listening); the student speaks, and the meter shows the microphone level |
| muted | `listening`/`speaking` with mute on: label "Ovoz o'chirilgan" (muted); no audio is sent |
| `reconnecting` | the backend is reconnecting to Gemini; the microphone stays on, and the conversation continues |
| `speaking` | the tutor is speaking, and the meter shows the tutor's audio level. If the student starts talking, Gemini sends `interrupted` and playback stops |
| `ending` | microphone already released, waiting for the summary |
| `disconnected` | the connection dropped unexpectedly |
| `error` | an AI or server error; the message comes from the server |
| `denied` / `no-device` / `busy` / `unsupported` | microphone problems (Stage 1) |

The microphone button acts as **Start** when idle and as **Mute** during a call. Mute stops sending audio and tells Gemini `audio_stream_end`.

## Session summary

When a session ends, the backend sends the transcript to `GEMINI_SUMMARY_MODEL` with a strict JSON schema. The summary contains the duration, topics, questions the student answered, new vocabulary, grammar corrections and recommendations. The model is told to use only what's in the transcript: empty categories stay empty, and nothing is invented. If the student said nothing, the model isn't called at all.

**Storage:** VOXY has no secure backend storage yet, so the summary is **not saved**. It is returned to the Mini App and shown once. To integrate it, either save the `summary` object from `LiveBridge.run` (in `app/services/live_bridge.py`) in the main backend's database, or send it through an API from the website developer.

## Configuration

The full list of variables is in `deploy/env.template`. Create `.env.example` from it (`cp deploy/env.template .env.example`), then `.env` with real values. Never commit `.env`. For production settings, see [`docs/deployment.md`](docs/deployment.md#4-environment-variables).

| Variable | Required | Purpose |
|---|---|---|
| `BOT_TOKEN` | **yes** | Telegram bot token. Used by the bot and to verify `initData` |
| `MINI_APP_URL` | **yes** (bot) | public **HTTPS** URL of the Mini App, e.g. `https://<tunnel>/miniapp/` |
| `GEMINI_API_KEY` | **yes** (voice) | key from Google AI Studio. Server only |
| `BACKEND_URL` | no | public backend URL (default `http://localhost:8000`) |
| `GEMINI_LIVE_MODEL` | no | default `gemini-3.8-live` |
| `GEMINI_SUMMARY_MODEL` | no | default `gemini-3.8-flash` |
| `GEMINI_SUMMARY_FALLBACK_MODELS` | no | default `gemini-3.6-flash` (comma-separated; used on 503/429 or a slow response) |
| `VOICE_MAX_SESSION_SECONDS` | no | 30–1800, default 600 |
| `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` | no | 60–86400, default 3600 |
| `APP_ENV` | no | `development` (default) or `production`. In `production`, the server won't start with `DEV_SKIP_TELEGRAM_AUTH=true` |
| `DEV_SKIP_TELEGRAM_AUTH` | no | `true` only for local testing at `http://localhost`. Refused through a tunnel and in production |
| `RUN_BOT_IN_WEB` | no | `true` runs the Telegram bot inside the web process. For free hosts (Render free) that have no background worker: one service serves the Mini App, the voice API and the bot. Requires a single instance — two pollers make Telegram return `Conflict` |

If `GEMINI_API_KEY` is missing, `/api/voice/status` returns `configured: false`, the Mini App shows "AI: sozlanmagan" (not configured) and disables Start, and `POST /api/voice/session` responds `503 ai_not_configured`. A wrong key, a missing model or an exhausted quota shows up as an error state with codes `ai_auth_failed`, `ai_model_unavailable` or `ai_quota`.

## Running locally

### One command (Windows)

```powershell
.\scripts\start-bot.ps1   # tunnel + voice API + bot, prints the Mini App URL
.\scripts\stop-bot.ps1    # stop everything before deploying
```

The tunnel address changes on every start; the script passes the new one to the
bot, so the Mini App button always points somewhere that works. Run
`stop-bot.ps1` before a Render deploy — two pollers make Telegram return
`Conflict` and then neither of them answers.

Manual equivalent:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows;  source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt

# 1) Backend + Mini App
uvicorn app.main:app --reload --port 8000

# 2) HTTPS tunnel (Telegram requires HTTPS), in another terminal
ngrok http 8000                 # or: cloudflared tunnel --url http://localhost:8000
#    -> set MINI_APP_URL=https://<tunnel-host>/miniapp/ in .env

# 3) Bot, in another terminal
python -m app.bot
```

Open the bot in Telegram, send `/start`, then tap **Open VOXY**.

**Quick test in a regular browser, without Telegram:** set `DEV_SKIP_TELEGRAM_AUTH=true` and open `http://localhost:8000/miniapp/`. `localhost` counts as a secure context, so the microphone works. Turn the flag off afterwards.

## Production

In short (details in [`docs/deployment.md`](docs/deployment.md)):
- a host with **persistent WebSockets** (not serverless);
- **1** web instance and **1** worker; `APP_ENV=production`; HTTPS on one domain.

```bash
# web
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --no-access-log --timeout-graceful-shutdown 20
# worker
python -m app.bot
```

**Free hosting without a worker process.** Render's free plan has no background
worker, so set `RUN_BOT_IN_WEB=true` and the web service runs the bot in its own
event loop (one instance only). Such plans also sleep after ~15 minutes without
inbound traffic, which stops polling — keep a free cron pinging `/api/health`
every 10 minutes. Step by step: [`DEPLOYMENT.md`](DEPLOYMENT.md) step 4.5.

Or `docker build -t voxy .`, which gives one image for both services.

- **Health:** `/api/health` (liveness) and `/api/health/ready` (configuration complete).
- **Graceful shutdown:** WebSockets are closed with 1012, and Gemini sessions and locks are released.

## Tests

```bash
pytest                              # API, config, bot, initData, tickets, prompt, summary, voice WS bridge
node --test "tests/js/*.test.mjs"   # microphone, voice protocol client, PCM conversion (Node 20+)
```

The automated tests never call Google: `tests/fakes.py` replaces the gateway.

## What is verified, and what is not

Each item below is marked with how it was checked. A mock or fake Gemini is **not** counted as proof that real voice works.

**Checked against real Gemini (2026-11-24, real key):**
- `scripts/check_gemini.py` passed:
  - `models/gemini-3.8-live` exists and supports `bidiGenerateContent`;
  - Live connected in about 1.6 s, with 5–9 s of real 24 kHz audio coming back;
  - a transcript arrived ("Salom! Matematikadan qaysi mavzuni…"), and so did a resumption handle;
  - first audio took 1–2.7 s on five runs; **one run took 22 s**, a one-off on Google's side.
- **Mini App in Chromium + VOXY backend + real Gemini.** The microphone *source* was a recording of real English speech made locally with Windows TTS; everything after `getUserMedia` was real:
  - 289 frames (2.8 MB) of microphone audio reached Gemini, and Gemini recognised the speech ("My name is Ali. I am student and I likes play football…");
  - 66 chunks (about 22 s) of tutor audio arrived and were played (the `speaking` state follows the actual audio buffers);
  - in English Speaking mode the tutor spoke English, corrected the mistake politely ("you can say: I am a student and I like playing football every day") and asked one question;
  - interruption: when the student talked over the tutor, Gemini sent `interrupted` and the tutor's audio stopped. It took 0.6 s on the first run and 3.6 s on the second; VAD latency varies;
  - with only silence, there was no false interruption and the greeting played to the end.
- **Telegram (one real session, from the server log):**
  - `audio_to_gemini=485 frames/4.6 MB`, `audio_from_gemini=61 chunks`;
  - `student_speech=True`, `tutor_speech=True`, `interruptions=2`, 58 s;
  - the session ended by closing the app (`client_disconnected`), not with End.

**Problems found in the real tests and fixed in code:**
- The summary model `gemini-3.8-flash` returned `503 UNAVAILABLE` ("high demand"), and the SDK's default retries made it hang for up to 90 s. Fixes: `thinking_level=low`, SDK retries off, and a fallback model `gemini-3.6-flash`. That model answered in 12.4 s in a direct real call; **a full session ending in a real summary hasn't been re-run since the fix**.
- The UI was flickering between speaking and listening during network jitter. Fix: a 250 ms hold and an 80 ms start buffer.
- The bot hit `TimedOut` on a slow link to `api.telegram.org`. Fix: longer timeouts. The bot then started.
- Uvicorn was logging the WS ticket even with `--no-access-log`. Fix: a logging filter masks it.

**Not confirmed yet:**
- **Audible playback on a phone** in Telegram. The server sent the audio; only a person can confirm hearing it.
- iOS and Android separately: microphone permission, the silent switch, echo through the speaker, minimising the app.
- Uzbek and Russian **by real voice** (only English voice and text greetings in Uzbek were tested).
- A real Gemini reconnect after about 10 minutes (`go_away` and resumption); only fake Gemini was tested.
- A deployed server (HTTPS on a hosting platform); tested only locally and through a Cloudflare quick tunnel.

Automated tests (pytest, `node --test`) replace Gemini with fakes; they check the logic, not the real service.

## Known risks

1. **Echo.** Without headphones, the tutor's voice can reach the microphone and interrupt the tutor. `echoCancellation` is on, but it needs checking on real phones.
2. **iOS WebView.** Audio must be unlocked by a user gesture; the AudioContext is created synchronously in the click handler. AudioWorklet requires iOS 14.5 or later.
3. **In-memory tickets and locks.** These work only with a single backend process. Scaling to several instances needs Redis or similar.
4. **The WS ticket in logs.** Uvicorn logs the handshake path, query string included, even with `--no-access-log`. `RedactTicketFilter` (`app/main.py`) masks the ticket. If you add a custom proxy or logging pipeline, make sure it doesn't log `?ticket=` either.
7. **Summary model availability.** On 2026-11-24, `gemini-3.8-flash` was returning 503. The fallback chain is set with `GEMINI_SUMMARY_FALLBACK_MODELS`.
5. **Cost.** Each voice minute is billed by Google. There is one session per user and a time limit, but no daily quotas yet.
6. **Live API is in preview**, according to Google's docs. Model IDs and the protocol may change; the model is set through env variables.
