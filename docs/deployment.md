# VOXY: deployment

## 1. Recommended architecture (the simplest reliable one)

```
                 Telegram (Android / iOS / Desktop / Web)
                    │  HTTPS + WSS (single domain)
                    ▼
     ┌───────────── platform TLS proxy (HTTPS, WebSocket upgrade) ─────────────┐
     │                                                                          │
     │  service "web"    uvicorn app.main:app  (1 instance, 1 worker)           │
     │     /miniapp/*         static Mini App files (same origin → no CORS)     │
     │     /api/health        liveness (platform health check)                  │
     │     /api/health/ready  readiness (configuration complete)                │
     │     /api/voice/session POST: initData → ticket                           │
     │     /api/voice/ws      WSS: audio ⇄ Gemini Live  ───────►  Google Gemini │
     │                                                                          │
     │  service "worker" python -m app.bot (1 instance, long polling)  ──►  Telegram Bot API
     └──────────────────────────────────────────────────────────────────────────┘
```

- **One web instance, one worker.** WebSocket tickets and the one-session-per-user lock live in memory. Two instances (or `--workers 2`) would break both. Scaling out needs Redis (see the end of this document).
- **One bot instance.** Two long-polling processes with the same token conflict with each other (`409 Conflict`). The bot needs no public URL.
- **The Mini App and the API share one domain.** That avoids CORS, and `wss://` follows `https://` automatically.

## 2. Choosing a host: persistent WebSockets are required

A voice session is a WebSocket that stays open for up to `VOICE_MAX_SESSION_SECONDS` (10 minutes by default). **Not every host supports this.** Check the provider's documentation before choosing.

| Type | Suitable? | What to check |
|---|---|---|
| A container or process platform with long-lived processes (Railway, Render web service, Fly.io, Koyeb and similar) | yes, usually | WebSocket support, the idle timeout, the maximum connection length, and whether it scales to zero (a cold start adds delay) |
| A VPS (Hetzner, DigitalOcean, …) + Caddy or nginx | yes | proxy settings for WebSocket upgrade and timeouts (see §6) |
| Google Cloud Run | with limits | WebSockets work, but a connection is bounded by the request timeout (configure up to 60 minutes); set min-instances to 1 and max-instances to 1 |
| Heroku | with limits | WebSockets are supported, but connections close after 55 s without traffic. During a call audio flows continuously, but the pause while the summary is prepared can be long |
| Serverless functions (Vercel/Netlify Functions, AWS Lambda behind a regular API Gateway) | **no** | they don't hold a persistent WebSocket server |
| Static hosting (GitHub Pages and similar) | Mini App only | the backend has to live somewhere else |

**Idle timeouts.** During a call the client sends audio about every 100 ms, and uvicorn sends WebSocket pings every 20 s (its default). So proxies with an idle timeout of 60 s or more don't break the connection.

## 3. Deploying the backend

The repository already contains:
- **`Procfile`** for platforms that read one (`web` and `worker`);
- **`Dockerfile`** for everything else: one image for both services;
- **`.python-version`**: Python 3.13, the version the tests ran on.

### Option A: a platform that reads the repo (Procfile/buildpacks)
1. Create a project and connect the repository.
2. **Service `web`**: start command
   ```
   uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --no-access-log --timeout-graceful-shutdown 20
   ```
   Health check path: `/api/health`. Instances: **1**, with no autoscaling.
3. **Service `worker`**: start command `python -m app.bot`. Instances: **1**. It doesn't need a public port.
4. Set the variables from §4 in both services. Keep the same `BOT_TOKEN` and `MINI_APP_URL`; the worker doesn't need `GEMINI_API_KEY`.
5. Enable a public domain (HTTPS) for `web` only.

### Option B: Docker
```bash
docker build -t voxy .
# web
docker run -d --name voxy-web --restart unless-stopped -p 8000:8000 --env-file /etc/voxy/voxy.env voxy
# bot
docker run -d --name voxy-bot --restart unless-stopped --env-file /etc/voxy/voxy.env voxy python -m app.bot
```
The image is built without `.env` (see `.dockerignore`), runs as a non-root user, and includes a `HEALTHCHECK`.

### Graceful shutdown (what happens on deploy or restart)
1. The platform sends SIGTERM.
2. Uvicorn stops accepting new connections and **immediately closes every WebSocket with code 1012** (Service Restart).
3. Each active session sees the disconnect. Its tasks are cancelled, the **Gemini session is closed**, and the per-user lock is released.
4. The Mini App receives 1012 and shows "Server yangilanmoqda. Bir daqiqadan so'ng qayta boshlang." (the server is updating; start again in a minute). The microphone is released.
5. Uvicorn waits up to 20 s (`--timeout-graceful-shutdown`) for connections to finish, then exits.

A session that was in progress at that moment ends without a summary. That's expected, because nothing is saved yet.

## 4. Environment variables

The full template is `deploy/env.template`; copy it to `.env.example` with `cp deploy/env.template .env.example`. Enter the values in the platform's Variables UI and **never commit them**.

| Variable | web | worker | Production value |
|---|---|---|---|
| `APP_ENV` | ✔ | ✔ | `production` |
| `BOT_TOKEN` | ✔ (verifies initData) | ✔ | from @BotFather |
| `GEMINI_API_KEY` | ✔ | – | from Google AI Studio |
| `MINI_APP_URL` | ✔ | ✔ | `https://<domain>/miniapp/` |
| `BACKEND_URL` | ✔ | – | `https://<domain>` |
| `DEV_SKIP_TELEGRAM_AUTH` | ✔ | – | `false`: with `true` the server **won't start** in production |
| `ALLOWED_ORIGINS` | ✔ | – | empty = only the origins of `MINI_APP_URL` and `BACKEND_URL` |
| `FORWARDED_ALLOW_IPS` | ✔ | – | `*` on managed platforms; on a VPS, the proxy's IP (`127.0.0.1`) |
| `GEMINI_LIVE_MODEL` / `GEMINI_SUMMARY_MODEL` | ✔ | – | `gemini-3.8-live` / `gemini-3.8-flash` |
| `GEMINI_SUMMARY_FALLBACK_MODELS` | ✔ | – | `gemini-3.6-flash` |
| `VOICE_MAX_SESSION_SECONDS` | ✔ | – | `600` |
| `TELEGRAM_INIT_DATA_MAX_AGE_SECONDS` | ✔ | – | `3600` |
| `PORT` | set by the platform | – | – |

With `APP_ENV=production`, the server checks at startup that `BOT_TOKEN`, `GEMINI_API_KEY` and https `MINI_APP_URL`/`BACKEND_URL` are set, and **refuses to start**, naming what's missing. Secret values never appear in that message or in the log.

## 5. Configuring Gemini

1. Create a key in Google AI Studio.
2. Recommended: in Google Cloud Console → APIs & Services → Credentials, restrict the key to the **Generative Language API** only.
3. Check that the key has a quota (and billing if needed) for Live API models.
4. Check the key and model from your own machine before deploying. This is a few seconds of real API usage:
   ```
   .venv\Scripts\python scripts\check_gemini.py
   ```
   It must show `model check: OK`, `audio received: … > 0` and `tutor said: '…'`. **Until it succeeds on the deployed server's key, voice there is not confirmed.** (It succeeded locally on 2026-11-24; see "What is verified" in the README.)
5. If Google retires a model, change `GEMINI_LIVE_MODEL` without touching the code.

## 6. HTTPS and WSS

- Telegram opens Mini Apps **only over HTTPS**, and browsers allow the microphone only in a secure context (HTTPS or localhost).
- The Mini App opens `wss://<same domain>/api/voice/ws`. The proxy must pass the WebSocket upgrade through.
- Managed platforms issue TLS certificates automatically for their own domain or a custom one. Nothing else is needed.

**VPS + Caddy** (automatic certificate, with WebSocket support built in):
```
voxy.example.com {
    reverse_proxy 127.0.0.1:8000
}
```

**VPS + nginx** (WebSocket and timeouts must be set explicitly):
```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
}
```
On a VPS, bind uvicorn to `127.0.0.1` and set `FORWARDED_ALLOW_IPS=127.0.0.1`.

## 7. Telegram: BotFather and the Mini App URL

- **Required:** nothing in BotFather. The bot opens the Mini App through `web_app` buttons pointing at `MINI_APP_URL`, so updating the variable and restarting the `worker` is enough.
- **Optional:**
  - BotFather → `/mybots` → bot → **Bot Settings → Menu Button** → set the URL to `https://<domain>/miniapp/`. That adds a Mini App button next to the input field.
  - BotFather → `/newapp` creates a direct link `t.me/<bot>/<app>` with the same URL.
- When the domain changes, update `MINI_APP_URL` in **both services** and the Menu Button URL in BotFather.

## 8. Verifying the deployment

```bash
curl -s https://<domain>/api/health           # {"status":"ok",...}
curl -s https://<domain>/api/health/ready     # {"status":"ready","voice_configured":true,"app_env":"production",...}
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/miniapp/   # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/docs       # 404 (closed in production)
curl -s -o /dev/null -w "%{http_code}\n" -H "Origin: https://evil.example" \
     -H "Content-Type: application/json" -d '{}' https://<domain>/api/voice/session   # 403
```
In the web logs, look for: `VOXY starting: app_env=production live_model=… origins=['https://<domain>']`.
In the worker logs: no `Conflict` errors, which would mean a second bot is running.

## 9. Verifying real voice (only after `check_gemini.py` succeeds)

At the end of every session the backend logs **one line of counts**, with no audio, no text and no user ID:
```
voice session ended: outcome=client_end duration=42s audio_to_gemini=410 frames/3936000 bytes
dropped_frames=12 audio_from_gemini=95 chunks/1824000 bytes interruptions=1 reconnects=0
student_speech=True tutor_speech=True
```

| What to check | How | Proof |
|---|---|---|
| Microphone audio reaches Gemini | Telegram → Open VOXY → Start → say a few phrases | `audio_to_gemini` > 0 **and** `student_speech=True` (Gemini recognised speech); the caption shows "Siz: …" (you) with your words |
| Gemini audio comes back | wait for the reply | `audio_from_gemini` > 0, `tutor_speech=True` |
| Playback | listen | you **hear** VOXY; the label reads "VOXY gapiryapti" (VOXY speaking) and the meter follows its voice |
| Interruption | start talking while VOXY is speaking | its audio stops within about 0.5 s, and `interruptions` ≥ 1 |
| Ending | tap "Suhbatni tugatish" (End) | the OS microphone indicator turns off immediately, a summary appears, `outcome=client_end`, and `active_sessions` returns to 0 in `/api/health/ready` |
| Restart mid-call | restart `web` during a call | the Mini App shows "Server yangilanmoqda…" (server updating); the log shows `outcome=client_disconnected` |

If `audio_to_gemini` > 0 but `student_speech=False`, audio is arriving but Gemini didn't recognise speech. Check the microphone, the sample rate, and noise.
If `audio_from_gemini` = 0 with no error, check the model (`check_gemini.py`).
Full checklists for Android and iOS are in [`real-device-testing.md`](real-device-testing.md).

## 10. Known limits and next steps

- **Single instance.** Horizontal scaling needs tickets and locks moved into Redis (`app/services/tickets.py`), plus sticky sessions or a shared store.
- **The summary is not saved.** That needs secure storage on the main backend.
- **No daily quotas.** Limits are one session per user and the session length. Add quotas before a public launch.
- **CSP is not set.** Telegram's script and Google Fonts are external. Test a Content-Security-Policy on real Telegram clients before turning it on.
