"""Oddiy, jarayon xotirasidagi rate limiter.

Nega kerak: `admin / admin123` kabi demo akkauntlar bor va parolni cheksiz
marta sinab ko'rishga hech narsa to'sqinlik qilmaydi. Shuningdek `/api/ai/chat`
har bir so'rovda pullik Gemini chaqiruvini amalga oshiradi.

Cheklov: hisob bitta jarayon xotirasida (xuddi ovozli backenddagi tiketlar kabi).
Bir nechta instansiyaga o'tilganda Redis kerak bo'ladi.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

# Tozalashni cheksiz o'stirmaslik uchun: eng ko'p shuncha kalit saqlanadi.
MAX_TRACKED_KEYS = 10_000


class RateLimiter:
    """Sirpanuvchi oyna: `limit` ta so'rov / `window_seconds` sekund, kalit bo'yicha."""

    def __init__(self, *, limit: int, window_seconds: int, name: str) -> None:
        self.limit = limit
        self.window = window_seconds
        self.name = name
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, key: str, now: float) -> deque[float]:
        hits = self._hits[key]
        cutoff = now - self.window
        while hits and hits[0] <= cutoff:
            hits.popleft()
        if not hits:
            self._hits.pop(key, None)
            return self._hits[key]
        return hits

    def _evict(self, now: float) -> None:
        """Kalitlar soni chegaradan oshsa, eskilarini tashlaydi.

        Ilgari bu yerda `self._hits.clear()` turardi: 10 000 ta soxta kalit
        yuborib hisobni butunlay tozalab, allaqachon bloklangan hujumchini
        ozod qilish mumkin edi. Endi faqat oynasi o'tgan (zararsiz) kalitlar
        o'chiriladi; joy yetmasa — eng eski faollikdagilari, shuning uchun
        hozir bloklangan kalit saqlanib qoladi.
        """
        cutoff = now - self.window
        for key in [k for k, hits in self._hits.items() if not hits or hits[-1] <= cutoff]:
            self._hits.pop(key, None)

        overflow = len(self._hits) - MAX_TRACKED_KEYS
        if overflow > 0:
            oldest = sorted(self._hits, key=lambda k: self._hits[k][-1])[:overflow]
            for key in oldest:
                self._hits.pop(key, None)

    def check(self, key: str, now: float | None = None) -> None:
        """Limit oshib ketgan bo'lsa 429 chiqaradi, aks holda urinishni qayd qiladi."""
        current = time.monotonic() if now is None else now

        if len(self._hits) > MAX_TRACKED_KEYS:
            self._evict(current)

        hits = self._prune(key, current)
        if len(hits) >= self.limit:
            retry_after = max(1, int(self.window - (current - hits[0])))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Juda ko'p urinish. {retry_after} sekunddan keyin qaytadan urinib ko'ring.",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(current)

    def reset(self, key: str | None = None) -> None:
        if key is None:
            self._hits.clear()
        else:
            self._hits.pop(key, None)


def client_key(request: Request, suffix: str = "") -> str:
    """IP bo'yicha kalit. Proksi ortida X-Forwarded-For ning birinchi manzili olinadi."""
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return f"{ip}:{suffix}" if suffix else ip


def identity_key(identifier: str, suffix: str = "") -> str:
    """Akkaunt (email yoki username) bo'yicha kalit — IP emas.

    Nega kerak: hakaton zalida hamma bitta wifi ortida, demak bitta IPda.
    Limit faqat IP bo'yicha bo'lsa, bir odamning 10 ta xato urinishi qolgan
    hammaning TO'G'RI parolini 5 daqiqaga bloklab qo'yadi.
    """
    ident = (identifier or "unknown").lower().strip()
    return f"{ident}:{suffix}" if suffix else ident


# Parolni sinab ko'rish: bitta AKKAUNT uchun 10 urinish / 5 daqiqa.
login_limiter = RateLimiter(limit=10, window_seconds=300, name="login")
# Bitta host ko'p akkauntni birma-bir sinab ko'rmasligi uchun — IP bo'yicha,
# lekin ancha bo'sh: bir NAT ortidagi o'nlab sudya bemalol kirishi kerak.
login_ip_limiter = RateLimiter(limit=60, window_seconds=300, name="login-ip")
# Ro'yxatdan o'tish: bitta IP ortida butun zal bo'lishi mumkin, shuning uchun
# 5 emas, 30 — demo paytida navbatdagi sudya 429 olmasligi uchun.
register_limiter = RateLimiter(limit=30, window_seconds=600, name="register")
# Gemini chaqiruvi pullik: 20 savol / daqiqa.
ai_limiter = RateLimiter(limit=20, window_seconds=60, name="ai")
