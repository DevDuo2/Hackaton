"""Bepul hostingda servisni uyqudan saqlash.

Muammo: Render bepul tarifda servisni 15 daqiqa harakatsizlikdan keyin
uxlatadi. Bot esa shu jarayonning ICHIDA yuradi (RUN_BOT_IN_WEB=true), demak
servis uxlasa — bot ham o'ladi va demo o'rtasida javob bermay qoladi.

Yechim: servis o'zining OCHIQ manziliga vaqti-vaqti bilan so'rov yuboradi.
Render uchun bu tashqaridan kelgan trafik hisoblanadi va uyqu taymeri
qaytadan boshlanadi. Tashqi cron (cron-job.org) ham shu ishni qiladi, lekin
uni qo'lda sozlash kerak va demodan oldin buni unutish juda oson.

Faqat production'da va faqat BACKEND_URL ochiq https manzil bo'lganda ishlaydi:
lokalda `http://localhost` ga ping yuborishning ma'nosi yo'q.
"""

from __future__ import annotations

import asyncio
import logging
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("voxy.keepalive")

# Render 15 daqiqada uxlatadi — 10 daqiqa zapas bilan yetarli.
PING_INTERVAL_SECONDS = 10 * 60
REQUEST_TIMEOUT_SECONDS = 15.0


def _is_public_https(url: str) -> bool:
    parsed = urlparse(url or "")
    if parsed.scheme != "https" or not parsed.netloc:
        return False
    host = parsed.hostname or ""
    return host not in {"localhost", "127.0.0.1", "::1"}


async def _ping_forever(url: str) -> None:
    """Xatolar yutiladi: ping — yordamchi vazifa, u servisni yiqitmasligi kerak."""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        while True:
            await asyncio.sleep(PING_INTERVAL_SECONDS)
            try:
                response = await client.get(url)
                logger.debug("keep-alive ping %s -> %s", url, response.status_code)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001
                # Tarmoq xatosi odatiy hol (servis hali ko'tarilmagan bo'lishi
                # mumkin). INFO emas, DEBUG: loglarni to'ldirmaslik uchun.
                logger.debug("keep-alive ping muvaffaqiyatsiz: %s", exc)


def start_keepalive(backend_url: str, *, enabled: bool) -> asyncio.Task | None:
    """Ping vazifasini ishga tushiradi. Kerak bo'lmasa — None qaytaradi."""
    if not enabled:
        return None
    if not _is_public_https(backend_url):
        logger.info(
            "keep-alive o'chirilgan: BACKEND_URL ochiq https manzil emas (%r).",
            backend_url,
        )
        return None

    url = backend_url.rstrip("/") + "/api/health"
    logger.info("keep-alive yoqildi: har %d daqiqada %s", PING_INTERVAL_SECONDS // 60, url)
    return asyncio.create_task(_ping_forever(url), name="keepalive")


async def stop_keepalive(task: asyncio.Task | None) -> None:
    if task is None:
        return
    task.cancel()
    try:
        await task
    except (asyncio.CancelledError, Exception):  # noqa: BLE001
        pass
