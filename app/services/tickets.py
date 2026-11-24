"""Single-use, short-lived tickets that authorize one voice WebSocket.

Browsers cannot set headers on WebSocket requests, so the client exchanges verified initData
for an opaque ticket over HTTPS (POST) and passes only the ticket in the WS URL.
In-memory: valid for a single backend process. Multi-instance deployments need Redis or similar.
"""

from __future__ import annotations

import secrets
import time
from dataclasses import dataclass, field
from typing import Literal

Mode = Literal["tutor", "english"]
Language = Literal["uz", "en", "ru"]

TICKET_TTL_SECONDS = 60


def _now(now: float | None) -> float:
    return time.monotonic() if now is None else now


@dataclass(frozen=True, slots=True)
class SessionRequest:
    user_id: int
    first_name: str
    mode: Mode
    language: Language
    subject: str | None
    input_sample_rate: int


@dataclass(slots=True)
class TicketStore:
    ttl_seconds: int = TICKET_TTL_SECONDS
    _tickets: dict[str, tuple[float, SessionRequest]] = field(default_factory=dict)
    _active_users: set[int] = field(default_factory=set)

    def issue(self, request: SessionRequest, now: float | None = None) -> str:
        self._purge(now)
        ticket = secrets.token_urlsafe(32)
        self._tickets[ticket] = (_now(now) + self.ttl_seconds, request)
        return ticket

    def redeem(self, ticket: str, now: float | None = None) -> SessionRequest | None:
        """Return the request and invalidate the ticket; None if unknown or expired."""
        self._purge(now)
        entry = self._tickets.pop(ticket, None)
        return entry[1] if entry else None

    # One live voice session per Telegram user — limits cost and accidental duplicate tabs.
    def try_acquire(self, user_id: int) -> bool:
        if user_id in self._active_users:
            return False
        self._active_users.add(user_id)
        return True

    def release(self, user_id: int) -> None:
        self._active_users.discard(user_id)

    def is_active(self, user_id: int) -> bool:
        return user_id in self._active_users

    @property
    def active_count(self) -> int:
        return len(self._active_users)

    def _purge(self, now: float | None) -> None:
        current = _now(now)
        for key in [k for k, (expires, _) in self._tickets.items() if expires <= current]:
            del self._tickets[key]
