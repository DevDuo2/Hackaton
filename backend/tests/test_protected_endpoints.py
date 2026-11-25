"""Himoyalangan endpointlar: admin paneli, AI tutor, testlar va fan tanlash."""

from app.data.database import SUBJECTS_DB, USERS_DB
from tests.conftest import auth


def test_admin_stats_requires_authentication(client):
    assert client.get("/api/admin/stats").status_code == 401


def test_admin_stats_rejects_student_token(client, student_token):
    res = client.get("/api/admin/stats", headers=auth(student_token))
    assert res.status_code == 403


def test_admin_stats_allows_admin_token(client, admin_token):
    res = client.get("/api/admin/stats", headers=auth(admin_token))
    assert res.status_code == 200
    assert res.json()["totalStudents"] >= 1


def test_admin_students_never_leaks_passwords(client, admin_token):
    res = client.get("/api/admin/students", headers=auth(admin_token))
    assert res.status_code == 200
    for student in res.json()["students"]:
        assert "password" not in student


def test_admin_login_rejects_non_admin_account(client):
    res = client.post(
        "/api/admin/login",
        json={"username": "student@voxy.edu", "password": "password123"},
    )
    assert res.status_code == 403


def test_ai_chat_requires_authentication(client):
    res = client.post("/api/ai/chat", json={"subjectId": "matematika", "question": "Salom"})
    assert res.status_code == 401


def test_quiz_submit_requires_authentication(client):
    res = client.post(
        "/api/quizzes/submit",
        json={"subjectId": "matematika", "questionId": 101, "selectedOption": 0},
    )
    assert res.status_code == 401


def test_quiz_xp_goes_to_the_token_owner(client, student_token):
    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    before = student["totalXP"]

    # To'g'ri variantning indeksi ma'lumotdan olinadi — hamma savolda 0 emas.
    math_quiz = next(
        q for s in SUBJECTS_DB if s["id"] == "matematika" for q in s["quizzes"] if q["id"] == 101
    )
    res = client.post(
        "/api/quizzes/submit",
        json={
            "subjectId": "matematika",
            "questionId": 101,
            "selectedOption": math_quiz["correctIndex"],
        },
        headers=auth(student_token),
    )
    assert res.status_code == 200
    assert res.json()["isCorrect"] is True
    assert student["totalXP"] == before + 100


def test_quiz_submit_rejects_unknown_question(client, student_token):
    res = client.post(
        "/api/quizzes/submit",
        json={"subjectId": "matematika", "questionId": 999999, "selectedOption": 0},
        headers=auth(student_token),
    )
    assert res.status_code == 404


def test_leaderboard_hides_passwords(client):
    res = client.get("/api/quizzes/leaderboard")
    assert res.status_code == 200
    for entry in res.json()["leaderboard"]:
        assert "password" not in entry


def test_leaderboard_hides_emails(client):
    """Reyting OCHIQ endpoint: u hech kimning emailini tarqatmasligi kerak.

    Ilgari `email` public_user ning doimiy maydoni edi, shuning uchun tokensiz
    GET har bir ro'yxatdan o'tgan odamning emailini qaytarardi.
    """
    res = client.get("/api/quizzes/leaderboard")
    assert res.status_code == 200
    for entry in res.json()["leaderboard"]:
        assert "email" not in entry, f"reytingda email chiqib ketdi: {entry}"


def test_own_profile_still_returns_email(client, student_token):
    """Email faqat reytingdan olib tashlandi — o'z profilida qolishi kerak,
    aks holda /settings va /profile sahifalari bo'sh maydon ko'rsatadi."""
    res = client.get("/api/auth/me", headers=auth(student_token))
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "student@voxy.edu"


def test_subject_select_writes_to_the_token_owner(client, student_token):
    res = client.post(
        "/api/subjects/select",
        json={"subjectId": "fizika", "level": "O'rta"},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    assert student["selectedSubject"] == "fizika"


def test_subject_select_rejects_unknown_subject(client, student_token):
    res = client.post(
        "/api/subjects/select",
        json={"subjectId": "yoq-fan", "level": "O'rta"},
        headers=auth(student_token),
    )
    assert res.status_code == 404


def test_public_catalogue_stays_open(client):
    """Fanlar va kurslar katalogi — ochiq ma'lumot, token talab qilmaydi."""
    assert client.get("/api/subjects/").status_code == 200
    assert client.get("/api/courses/").status_code == 200
    assert client.get("/api/health").status_code == 200


def test_daily_quiz_does_not_leak_the_correct_answer(client):
    """Javoblar brauzerga yuborilmaydi — aks holda tarmoq panelida ko'rinib qoladi."""
    res = client.get("/api/quizzes/daily", params={"subjectId": "kimyo"})
    assert res.status_code == 200
    for quiz in res.json()["quizzes"]:
        assert "correctIndex" not in quiz
        assert "explanation" not in quiz


def test_daily_quiz_rejects_unknown_subject(client):
    assert client.get("/api/quizzes/daily", params={"subjectId": "yoq-fan"}).status_code == 404


def test_ai_chat_rejects_unknown_subject(client, student_token):
    """Ilgari noma'lum fan jimgina matematikaga aylanardi."""
    res = client.post(
        "/api/ai/chat",
        json={"subjectId": "yoq-fan", "question": "Salom"},
        headers=auth(student_token),
    )
    assert res.status_code == 404


def test_every_frontend_subject_exists_in_the_backend(client):
    """my-app/data/mockData.ts dagi id lar bilan bir xil bo'lishi shart."""
    frontend_ids = {
        "matematika", "fizika", "dasturlash", "kimyo",
        "biologiya", "ingliz-tili", "ona-tili",
    }
    res = client.get("/api/subjects/")
    assert frontend_ids <= {s["id"] for s in res.json()["subjects"]}


def test_subject_catalogue_never_leaks_quiz_answers(client):
    """Ilgari /api/subjects/ barcha savollarni correctIndex bilan qaytarardi."""
    res = client.get("/api/subjects/")
    assert res.status_code == 200
    assert "correctIndex" not in res.text
    assert "explanation" not in res.text
    for subject in res.json()["subjects"]:
        assert "quizzes" not in subject
        assert subject["quizCount"] >= 1


def test_leaderboard_does_not_expose_other_users_answers(client):
    res = client.get("/api/quizzes/leaderboard")
    assert res.status_code == 200
    for entry in res.json()["leaderboard"]:
        assert "answeredQuizzes" not in entry
        assert "answeredCount" in entry


def test_profile_reports_answered_count(client, student_token):
    before = client.get("/api/auth/me", headers=auth(student_token)).json()["user"]["answeredCount"]
    client.post(
        "/api/quizzes/submit",
        json={"subjectId": "ona-tili", "questionId": 701, "selectedOption": 0},
        headers=auth(student_token),
    )
    after = client.get("/api/auth/me", headers=auth(student_token)).json()["user"]["answeredCount"]
    assert after == before + 1


def test_ai_status_tells_whether_the_key_is_configured(client, monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = client.get("/api/ai/status")
    assert res.status_code == 200
    assert res.json()["configured"] is False
    assert res.json()["model"] is None

    monkeypatch.setenv("GEMINI_API_KEY", "test-kalit")
    res = client.get("/api/ai/status")
    assert res.json()["configured"] is True
    # Kalitning o'zi hech qachon qaytarilmaydi.
    assert "test-kalit" not in res.text


def test_ai_answer_declares_offline_source_without_a_key(client, student_token, monkeypatch):
    """Zaxira bilim bazasidan kelgan javob «AI javobi» sifatida ko'rsatilmasligi kerak."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = client.post(
        "/api/ai/chat",
        json={"subjectId": "matematika", "question": "Diskriminant nima?"},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    assert res.json()["source"] == "offline"


def test_offline_fallback_does_not_answer_from_another_subject(client, student_token, monkeypatch):
    """«tenglama» kalit so'zi Kimyo savoliga matematika javobini bermasligi kerak."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = client.post(
        "/api/ai/chat",
        json={"subjectId": "kimyo", "question": "Reaksiya tenglamasini qanday tenglashtiraman?"},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    body = res.json()["response"]
    assert "Diskriminant" not in body
    assert "Kimyo" in body


def test_tests_never_use_a_real_gemini_key():
    """Agar bu test yiqilsa — test to'plami pullik API'ga chiqib ketyapti."""
    import os

    assert not os.getenv("GEMINI_API_KEY"), (
        "GEMINI_API_KEY testlar davomida o'chirilgan bo'lishi kerak "
        "(conftest._no_real_gemini_calls)"
    )


def test_platform_settings_require_admin(client, student_token):
    """Sozlamalar faqat admin uchun: talaba ham o'qiy olmasligi kerak."""
    assert client.get("/api/admin/settings").status_code == 401
    assert client.get("/api/admin/settings", headers=auth(student_token)).status_code == 403
    assert client.put(
        "/api/admin/settings", json={"maintenanceMode": True}, headers=auth(student_token)
    ).status_code == 403


def test_platform_settings_actually_persist(client, admin_token):
    """«Saqlandi» yozuvi haqiqiy bo'lishi kerak.

    Ilgari /admin/settings sahifasidagi `handleSave` faqat state'ni o'zgartirardi:
    yashil «Saqlandi» chiqar, sahifa yangilanganda esa eski qiymat qaytib kelardi.
    """
    res = client.put(
        "/api/admin/settings",
        json={"platformName": "VOXY Demo", "allowRegistration": False},
        headers=auth(admin_token),
    )
    assert res.status_code == 200
    assert res.json()["settings"]["platformName"] == "VOXY Demo"

    again = client.get("/api/admin/settings", headers=auth(admin_token))
    assert again.json()["settings"]["platformName"] == "VOXY Demo"
    assert again.json()["settings"]["allowRegistration"] is False


def test_closed_registration_is_enforced(client, admin_token):
    """Kalitcha HAQIQATAN ro'yxatdan o'tishni to'xtatishi kerak, UI bezagi emas."""
    client.put(
        "/api/admin/settings", json={"allowRegistration": False}, headers=auth(admin_token)
    )
    blocked = client.post(
        "/api/auth/register",
        json={"name": "Yangi", "email": "yangi@voxy.edu", "password": "parol123"},
    )
    assert blocked.status_code == 403

    client.put(
        "/api/admin/settings", json={"allowRegistration": True}, headers=auth(admin_token)
    )
    allowed = client.post(
        "/api/auth/register",
        json={"name": "Yangi", "email": "yangi2@voxy.edu", "password": "parol123"},
    )
    assert allowed.status_code == 201


def test_maintenance_mode_blocks_students_but_not_admins(client, admin_token, student_token):
    client.put(
        "/api/admin/settings", json={"maintenanceMode": True}, headers=auth(admin_token)
    )
    body = {"subjectId": "matematika", "questionId": 101, "selectedOption": 0}

    student = client.post("/api/quizzes/submit", json=body, headers=auth(student_token))
    assert student.status_code == 503

    # Admin o'tib ketadi: aks holda rejimni o'chirib bo'lmay qolardi.
    admin = client.post("/api/quizzes/submit", json=body, headers=auth(admin_token))
    assert admin.status_code != 503


def test_quiz_bank_is_admin_only(client, student_token):
    """Javoblar bilan birga keladigan bank faqat admin uchun."""
    assert client.get("/api/admin/quizzes").status_code == 401
    assert client.get("/api/admin/quizzes", headers=auth(student_token)).status_code == 403


def test_quiz_bank_returns_answers_for_admin(client, admin_token):
    res = client.get("/api/admin/quizzes", headers=auth(admin_token))
    assert res.status_code == 200
    questions = res.json()["questions"]
    assert len(questions) >= 10
    for q in questions:
        assert 0 <= q["correctIndex"] < len(q["options"])
        assert q["subjectId"] and q["question"]
