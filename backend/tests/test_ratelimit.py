"""Rate limiting: parolni cheksiz sinab ko'rish va Gemini kvotasini sarflashga qarshi."""

import pytest

from app.core.ratelimit import ai_limiter, login_limiter, register_limiter
from tests.conftest import auth


def test_repeated_wrong_passwords_get_rate_limited(client):
    body = {"email": "student@voxy.edu", "password": "xato"}
    codes = [client.post("/api/auth/login", json=body).status_code for _ in range(login_limiter.limit + 3)]

    assert codes[0] == 401, "birinchi urinishlar oddiy 401 bo'lishi kerak"
    assert 429 in codes, "limitdan keyin 429 kelishi kerak"
    assert codes[-1] == 429


def test_rate_limit_response_has_retry_after(client):
    body = {"email": "student@voxy.edu", "password": "xato"}
    for _ in range(login_limiter.limit + 1):
        res = client.post("/api/auth/login", json=body)
    assert res.status_code == 429
    assert res.headers.get("retry-after")
    assert "urinish" in res.json()["detail"]


def test_admin_login_shares_the_same_limit(client):
    """Admin paroli eng qimmatli nishon — u ham cheklanishi kerak."""
    for _ in range(login_limiter.limit + 1):
        res = client.post("/api/admin/login", json={"username": "admin", "password": "xato"})
    assert res.status_code == 429


def test_correct_login_still_works_below_the_limit(client):
    for _ in range(3):
        client.post("/api/auth/login", json={"email": "student@voxy.edu", "password": "xato"})
    ok = client.post("/api/auth/login", json={"email": "student@voxy.edu", "password": "password123"})
    assert ok.status_code == 200


def test_registration_from_one_ip_is_capped(client):
    codes = []
    for i in range(register_limiter.limit + 2):
        codes.append(
            client.post(
                "/api/auth/register",
                json={"name": "QA", "email": f"rl{i}@voxy.edu", "password": "parol123"},
            ).status_code
        )
    assert codes[0] == 201
    assert codes[-1] == 429


def test_ai_chat_is_capped_per_user(client, student_token):
    codes = []
    for _ in range(ai_limiter.limit + 2):
        codes.append(
            client.post(
                "/api/ai/chat",
                json={"subjectId": "matematika", "question": "Savol"},
                headers=auth(student_token),
            ).status_code
        )
    assert codes[0] == 200
    assert codes[-1] == 429


def test_limiter_window_expires(monkeypatch):
    """Oyna o'tgandan keyin urinishlar yana ruxsat etiladi."""
    from app.core.ratelimit import RateLimiter

    limiter = RateLimiter(limit=2, window_seconds=60, name="test")
    limiter.check("k", now=0.0)
    limiter.check("k", now=1.0)
    with pytest.raises(Exception):
        limiter.check("k", now=2.0)
    limiter.check("k", now=70.0)  # oyna o'tdi
