"""Obuna rejalari: narxlar, yoqish va kunlik limitning HAQIQIY ta'siri."""

from tests.conftest import auth


def test_plans_are_public(client):
    """Narxlar sahifasi kirmasdan ham ko'rinishi kerak."""
    res = client.get("/api/billing/plans")
    assert res.status_code == 200
    plans = res.json()["plans"]
    assert [p["id"] for p in plans] == ["bepul", "pro", "ustoz"]
    # To'lov tizimi ulanmagani ochiq aytiladi — UI buni yashirmasligi uchun.
    assert res.json()["paymentProvider"] == "demo"


def test_subscription_requires_authentication(client):
    assert client.get("/api/billing/me").status_code == 401
    assert client.post("/api/billing/subscribe", json={"plan": "pro"}).status_code == 401


def test_new_user_starts_on_the_free_plan(client, student_token):
    res = client.get("/api/billing/me", headers=auth(student_token))
    assert res.status_code == 200
    state = res.json()["subscription"]
    assert state["plan"] == "bepul"
    assert state["voiceEnabled"] is False
    assert state["aiMessagesLeftToday"] == 10


def test_subscribe_and_cancel(client, student_token):
    up = client.post(
        "/api/billing/subscribe", json={"plan": "pro"}, headers=auth(student_token)
    )
    assert up.status_code == 200
    assert up.json()["subscription"]["plan"] == "pro"
    assert up.json()["subscription"]["voiceEnabled"] is True

    down = client.post("/api/billing/cancel", headers=auth(student_token))
    assert down.status_code == 200
    assert down.json()["subscription"]["plan"] == "bepul"


def test_unknown_plan_is_rejected(client, student_token):
    res = client.post(
        "/api/billing/subscribe", json={"plan": "oltin"}, headers=auth(student_token)
    )
    assert res.status_code == 404


def test_free_plan_daily_limit_is_enforced_server_side(client, student_token):
    """Limit UI da emas, SERVERDA ishlashi kerak.

    Aks holda /api/ai/chat ga to'g'ridan-to'g'ri murojaat qilib, cheklovni
    butunlay aylanib o'tish mumkin bo'lardi va reja bezakka aylanardi.
    """
    body = {"subjectId": "matematika", "question": "Tushuntirib ber"}
    codes = [
        client.post("/api/ai/chat", json=body, headers=auth(student_token)).status_code
        for _ in range(12)
    ]
    assert codes[:10] == [200] * 10, "bepul rejada 10 ta savol o'tishi kerak"
    assert codes[10] == 402, "11-savol 402 (to'lov kerak) qaytarishi kerak"


def test_upgrading_restores_access_immediately(client, student_token):
    body = {"subjectId": "matematika", "question": "Tushuntirib ber"}
    for _ in range(11):
        client.post("/api/ai/chat", json=body, headers=auth(student_token))
    assert client.post("/api/ai/chat", json=body, headers=auth(student_token)).status_code == 402

    client.post("/api/billing/subscribe", json={"plan": "pro"}, headers=auth(student_token))
    after = client.post("/api/ai/chat", json=body, headers=auth(student_token))
    assert after.status_code == 200
    assert after.json()["messagesLeftToday"] is not None


def test_expired_subscription_falls_back_to_free():
    """Muddati o'tgan obuna avtomatik bepulga qaytadi — cron kerak emas."""
    from datetime import datetime, timedelta, timezone

    from app.core.billing import plan_for

    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    user = {"id": "u_x", "subscription": {"plan": "pro", "expiresAt": past}}
    assert plan_for(user)["id"] == "bepul"

    future = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    user["subscription"]["expiresAt"] = future
    assert plan_for(user)["id"] == "pro"
