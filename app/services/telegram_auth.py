"""Validation of Telegram Mini App `initData`.

Algorithm (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
    secret_key       = HMAC_SHA256(key="WebAppData", msg=bot_token)
    data_check_string = "\n".join(sorted(f"{k}={v}" for every field except `hash`))
    valid            = hex(HMAC_SHA256(key=secret_key, msg=data_check_string)) == hash
`signature` (for third-party Ed25519 validation) is a normal field here and stays in the string.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl

MAX_INIT_DATA_LENGTH = 4096


class InitDataError(ValueError):
    """initData is missing, malformed, forged or expired."""


@dataclass(frozen=True, slots=True)
class TelegramUser:
    id: int
    first_name: str
    language_code: str | None = None


def _secret_key(bot_token: str) -> bytes:
    return hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()


def compute_hash(fields: dict[str, str], bot_token: str) -> str:
    data_check_string = "\n".join(f"{k}={fields[k]}" for k in sorted(fields) if k != "hash")
    return hmac.new(_secret_key(bot_token), data_check_string.encode(), hashlib.sha256).hexdigest()


def validate_init_data(
    init_data: str,
    bot_token: str,
    *,
    max_age_seconds: int,
    now: float | None = None,
) -> TelegramUser:
    if not init_data or len(init_data) > MAX_INIT_DATA_LENGTH:
        raise InitDataError("initData is empty or too long")

    try:
        pairs = parse_qsl(init_data, keep_blank_values=True, strict_parsing=True)
    except ValueError as exc:
        raise InitDataError("initData is not a valid query string") from exc
    fields = dict(pairs)
    if len(fields) != len(pairs):
        raise InitDataError("initData has duplicate fields")

    received_hash = fields.get("hash")
    if not received_hash:
        raise InitDataError("initData has no hash")
    if not hmac.compare_digest(compute_hash(fields, bot_token), received_hash):
        raise InitDataError("initData signature mismatch")

    try:
        auth_date = int(fields["auth_date"])
    except (KeyError, ValueError) as exc:
        raise InitDataError("initData has no valid auth_date") from exc
    current = time.time() if now is None else now
    if current - auth_date > max_age_seconds:
        raise InitDataError("initData has expired")
    if auth_date - current > 60:  # clock skew tolerance
        raise InitDataError("initData auth_date is in the future")

    try:
        user = json.loads(fields["user"])
        return TelegramUser(
            id=int(user["id"]),
            first_name=str(user.get("first_name", ""))[:64],
            language_code=user.get("language_code"),
        )
    except (KeyError, ValueError, TypeError) as exc:
        raise InitDataError("initData has no valid user") from exc
