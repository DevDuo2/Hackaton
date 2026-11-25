"""Telegram endpointlari: webhook himoyasi va halol javoblar."""

import app.routers.telegram as telegram_router
from tests.conftest import auth


def test_webhook_is_refused_when_no_secret_configured(client, monkeypatch):
    monkeypatch.delenv("TELEGRAM_WEBHOOK_SECRET", raising=False)
    res = client.post("/api/telegram/webhook", json={"message": {}})
    assert res.status_code == 503


def test_webhook_rejects_wrong_secret_token(client, monkeypatch):
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "to'g'ri-secret")
    res = client.post(
        "/api/telegram/webhook",
        json={"message": {}},
        headers={"X-Telegram-Bot-Api-Secret-Token": "noto'g'ri"},
    )
    assert res.status_code == 401


def test_webhook_accepts_correct_secret_and_invents_nothing(client, monkeypatch):
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "to'g'ri-secret")
    res = client.post(
        "/api/telegram/webhook",
        json={"message": {"voice": {"file_id": "abc"}}},
        headers={"X-Telegram-Bot-Api-Secret-Token": "to'g'ri-secret"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ignored"
    # Ilgari bu yerda o'ylab topilgan "talaffuzingiz 92% to'g'ri" qaytarardi.
    assert "%" not in str(body)


def test_webhook_rejects_oversized_update(client, monkeypatch):
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "s")
    oversized = {"message": {"text": "x" * (telegram_router.MAX_UPDATE_BYTES + 100)}}
    res = client.post(
        "/api/telegram/webhook",
        json=oversized,
        headers={"X-Telegram-Bot-Api-Secret-Token": "s"},
    )
    assert res.status_code == 413


def test_link_account_requires_authentication(client):
    res = client.post("/api/telegram/link-account", json={"telegramUsername": "ali"})
    assert res.status_code == 401


def test_link_account_validates_username(client, student_token):
    res = client.post(
        "/api/telegram/link-account",
        json={"telegramUsername": "yomon username!"},
        headers=auth(student_token),
    )
    assert res.status_code == 422


def test_link_account_does_not_claim_a_link_it_did_not_make(client, student_token):
    res = client.post(
        "/api/telegram/link-account",
        json={"telegramUsername": "@ali_voxy"},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    body = res.json()
    assert body["telegramUsername"] == "ali_voxy"
    assert body["linked"] is False
