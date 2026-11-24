import time
from urllib.parse import parse_qsl, urlencode

import pytest

from app.services.telegram_auth import InitDataError, validate_init_data
from tests.fakes import BOT_TOKEN, make_init_data

MAX_AGE = 3600


def test_valid_init_data_returns_user() -> None:
    user = validate_init_data(make_init_data(user_id=7, first_name="Malika"), BOT_TOKEN, max_age_seconds=MAX_AGE)
    assert user.id == 7
    assert user.first_name == "Malika"
    assert user.language_code == "uz"


def test_signature_field_is_part_of_the_check_string() -> None:
    # Telegram now also sends `signature`; it must be hashed like any other field (only `hash` is excluded).
    data = make_init_data(signature="abc123")
    assert validate_init_data(data, BOT_TOKEN, max_age_seconds=MAX_AGE).id == 42


def test_tampered_user_is_rejected() -> None:
    fields = dict(parse_qsl(make_init_data(user_id=1)))
    fields["user"] = fields["user"].replace('"id":1', '"id":999')
    with pytest.raises(InitDataError, match="signature"):
        validate_init_data(urlencode(fields), BOT_TOKEN, max_age_seconds=MAX_AGE)


def test_wrong_bot_token_is_rejected() -> None:
    with pytest.raises(InitDataError, match="signature"):
        validate_init_data(make_init_data(), "999:OTHER", max_age_seconds=MAX_AGE)


def test_expired_init_data_is_rejected() -> None:
    old = int(time.time()) - MAX_AGE - 10
    with pytest.raises(InitDataError, match="expired"):
        validate_init_data(make_init_data(auth_date=old), BOT_TOKEN, max_age_seconds=MAX_AGE)


def test_future_auth_date_is_rejected() -> None:
    future = int(time.time()) + 3600
    with pytest.raises(InitDataError, match="future"):
        validate_init_data(make_init_data(auth_date=future), BOT_TOKEN, max_age_seconds=MAX_AGE)


@pytest.mark.parametrize("raw", ["", "not a query string", "a=1&a=2&hash=x", "auth_date=1&user=%7B%7D", "x" * 5000])
def test_malformed_init_data_is_rejected(raw: str) -> None:
    with pytest.raises(InitDataError):
        validate_init_data(raw, BOT_TOKEN, max_age_seconds=MAX_AGE)
