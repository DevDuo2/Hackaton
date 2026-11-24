# VOXY backend + Mini App (and, with a different command, the Telegram bot).
#   docker build -t voxy .
#   docker run --env-file .env -p 8000:8000 voxy                 # web
#   docker run --env-file .env voxy python -m app.bot            # bot worker
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    APP_ENV=production \
    FORWARDED_ALLOW_IPS=* \
    PORT=8000

WORKDIR /srv/voxy

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY miniapp ./miniapp
COPY scripts ./scripts

RUN useradd --create-home --uid 10001 voxy
USER voxy

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/api/health', timeout=4)"

# Single worker on purpose: WebSocket tickets and per-user session locks live in memory.
# --proxy-headers (+ FORWARDED_ALLOW_IPS above): TLS is terminated by the platform's proxy.
# --no-access-log: WS URLs carry a ticket. --timeout-graceful-shutdown: on SIGTERM uvicorn closes
# WebSockets with 1012 and drains. No glob characters in the command (shells may expand `*`).
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1 --proxy-headers --no-access-log --timeout-graceful-shutdown 20"]
