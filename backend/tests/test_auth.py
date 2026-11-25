"""Autentifikatsiya: parol hashi, JWT va rol tekshiruvlari."""

from app.data.database import USERS_DB
from tests.conftest import auth


def test_login_returns_token_and_no_password(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "student@voxy.edu", "password": "password123"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["token"]
    assert "password" not in body["user"]


def test_login_with_wrong_password_is_rejected(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "student@voxy.edu", "password": "noto'g'ri"},
    )
    assert res.status_code == 401


def test_unknown_email_gives_same_answer_as_wrong_password(client):
    """Email ro'yxatdan o'tganini javobdan bilib bo'lmasligi kerak."""
    unknown = client.post("/api/auth/login", json={"email": "yoq@voxy.edu", "password": "x"})
    wrong = client.post(
        "/api/auth/login", json={"email": "student@voxy.edu", "password": "x"}
    )
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json()["detail"] == wrong.json()["detail"]


def test_seed_passwords_are_hashed_not_plaintext():
    for user in USERS_DB:
        assert user["password"].startswith("pbkdf2_sha256$")


def test_register_stores_hash_and_forces_student_role(client):
    res = client.post(
        "/api/auth/register",
        # Emailda "admin" so'zi bor — baribir student bo'lishi kerak.
        json={"name": "Yangi", "email": "admin.yangi@voxy.edu", "password": "parol123"},
    )
    assert res.status_code == 201
    assert res.json()["user"]["role"] == "student"

    created = next(u for u in USERS_DB if u["email"] == "admin.yangi@voxy.edu")
    assert created["password"] != "parol123"
    assert created["password"].startswith("pbkdf2_sha256$")


def test_register_rejects_short_password(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "Qisqa", "email": "qisqa@voxy.edu", "password": "123"},
    )
    assert res.status_code == 422


def test_register_rejects_duplicate_email(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "Takror", "email": "student@voxy.edu", "password": "parol123"},
    )
    assert res.status_code == 409


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_rejects_forged_token(client):
    res = client.get("/api/auth/me", headers=auth("soxta.token.imzo"))
    assert res.status_code == 401


def test_me_returns_the_token_owner(client, student_token):
    res = client.get("/api/auth/me", headers=auth(student_token))
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "student@voxy.edu"


def test_profile_update_requires_token(client):
    assert client.patch("/api/auth/me", json={"name": "Yangi"}).status_code == 401


def test_profile_update_saves_the_name(client, student_token):
    res = client.patch("/api/auth/me", json={"name": "Zumradxon X."}, headers=auth(student_token))
    assert res.status_code == 200
    assert res.json()["user"]["name"] == "Zumradxon X."

    me = client.get("/api/auth/me", headers=auth(student_token))
    assert me.json()["user"]["name"] == "Zumradxon X."


def test_profile_update_rejects_empty_name(client, student_token):
    res = client.patch("/api/auth/me", json={"name": "   "}, headers=auth(student_token))
    assert res.status_code == 422


def test_profile_update_cannot_grant_admin_role(client, student_token):
    """Rol va email PATCH sxemasida yo'q, shuning uchun ular e'tiborsiz qoldiriladi."""
    res = client.patch(
        "/api/auth/me",
        json={"name": "Ali", "role": "admin", "email": "hacker@voxy.edu"},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    user = res.json()["user"]
    assert user["role"] == "student"
    assert user["email"] == "student@voxy.edu"


def test_profile_update_rejects_unknown_subject(client, student_token):
    res = client.patch(
        "/api/auth/me", json={"selectedSubject": "yoq-fan"}, headers=auth(student_token)
    )
    assert res.status_code == 404


def test_orphaned_session_gets_401_not_404(client, student_token):
    """Token amal qiladi, lekin akkaunt yo'q (baza almashdi/o'chirildi).

    404 bo'lsa frontend buni «ma'lumot yo'q» deb qabul qilib, foydalanuvchini
    bo'sh «kirgan» interfeysda qoldirardi. 401 esa sessiyani tozalashga majbur qiladi.
    """
    from app.data.database import USERS_DB

    USERS_DB[:] = [u for u in USERS_DB if u["id"] != "u_student_1"]

    assert client.get("/api/auth/me", headers=auth(student_token)).status_code == 401
    assert client.patch(
        "/api/auth/me", json={"name": "X"}, headers=auth(student_token)
    ).status_code == 401
    assert client.post(
        "/api/quizzes/submit",
        json={"subjectId": "matematika", "questionId": 101, "selectedOption": 0},
        headers=auth(student_token),
    ).status_code == 401


def test_saved_preferences_come_back_in_own_profile(client, student_token):
    """Ilgari til/bildirishnoma saqlanardi, lekin /me da qaytmasdi —
    sahifa yangilanganda sozlama yo'qolgandek ko'rinardi."""
    res = client.patch(
        "/api/auth/me",
        json={"language": "en", "notifications": False},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    assert res.json()["user"]["language"] == "en"
    assert res.json()["user"]["notifications"] is False

    me = client.get("/api/auth/me", headers=auth(student_token)).json()["user"]
    assert me["language"] == "en"
    assert me["notifications"] is False


def test_leaderboard_does_not_expose_other_users_preferences(client, student_token):
    client.patch("/api/auth/me", json={"language": "ru"}, headers=auth(student_token))
    res = client.get("/api/quizzes/leaderboard")
    for entry in res.json()["leaderboard"]:
        assert "language" not in entry
        assert "notifications" not in entry


def test_non_ascii_password_is_rejected_not_crashed(client):
    """Kirill/emoji parol 401 berishi kerak, 500 emas.

    Ilgari hashlanmagan parolni solishtirishda `hmac.compare_digest` ikki `str`
    ni faqat ASCII bo'lsa qabul qilardi: parolda bitta "ё" bo'lsa TypeError va
    500 chiqar, bu esa qaysi akkauntlarda parol hali hashlanmaganini
    tashqaridan aniqlash imkonini berardi.
    """
    for password in ("пароль", "ёлка", "日本語", "pa\U0001F600rol"):
        res = client.post(
            "/api/auth/login",
            json={"email": "student@voxy.edu", "password": password},
        )
        assert res.status_code == 401, f"{password!r} uchun {res.status_code} keldi"
