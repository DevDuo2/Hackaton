web: uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --no-access-log --timeout-graceful-shutdown 20
worker: python -m app.bot
