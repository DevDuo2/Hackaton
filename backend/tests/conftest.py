"""Testlar MongoDB'ga ulanmaydi: xotiradagi USERS_DB bilan (fallback rejim) ishlaydi."""

import copy

import pytest
from fastapi.testclient import TestClient

from app.core.platform import reset_memory_settings
from app.core.ratelimit import ai_limiter, login_ip_limiter, login_limiter, register_limiter
from app.data import database as seed
from app.main import app


@pytest.fixture(autouse=True)
def _no_real_gemini_calls(monkeypatch):
    """Testlar hech qachon pullik Gemini API'ga chiqmasligi kerak.

    Ildizdagi `.env` da haqiqiy kalit bo'lsa, `load_dotenv()` uni ko'tarib ketadi
    va `/api/ai/chat` testlari real so'rov yuborib, sekin va beqaror bo'lib qolardi.
    Kalit kerak bo'lgan testlar uni o'zi monkeypatch qiladi.
    """
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)


@pytest.fixture(autouse=True)
def _isolate_seed_data():
    """Har bir test toza demo ma'lumotlar bilan boshlanadi (register, XP o'zgarishi)."""
    original = copy.deepcopy(seed.USERS_DB)
    yield
    seed.USERS_DB[:] = original


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Limiterlar modul darajasida yashaydi; har bir test alohida «sessiya»."""
    for limiter in (login_limiter, login_ip_limiter, register_limiter, ai_limiter):
        limiter.reset()
    yield
    for limiter in (login_limiter, login_ip_limiter, register_limiter, ai_limiter):
        limiter.reset()


@pytest.fixture(autouse=True)
def _reset_platform_settings():
    """Platforma sozlamalari modul darajasida yashaydi — har bir test toza boshlaydi."""
    reset_memory_settings()
    yield
    reset_memory_settings()


@pytest.fixture
def client():
    # Ataylab `with` ishlatilmaydi: lifespan ishga tushsa, har bir test Mongo'ga
    # 5 sekund ulanishga urinadi. Lifespan'siz `get_database()` None qaytaradi va
    # kod xotiradagi fallback rejimda ishlaydi — testlarga aynan shu kerak.
    return TestClient(app)


@pytest.fixture
def student_token(client) -> str:
    res = client.post(
        "/api/auth/login",
        json={"email": "student@voxy.edu", "password": "password123"},
    )
    assert res.status_code == 200, res.text
    return res.json()["token"]


@pytest.fixture
def admin_token(client) -> str:
    res = client.post("/api/admin/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200, res.text
    return res.json()["token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
