"""QA auditda topilgan nuqsonlar uchun regression testlari.

Har bir test aniq bitta nuqsonni qaytib kelmasligini kuzatadi.
"""

from app.data.database import SUBJECTS_DB, USERS_DB
from tests.conftest import auth

def _unanswered_quiz() -> tuple[str, dict]:
    """Demo talaba HALI javob bermagan savolni topadi.

    Seed'dagi demo akkaunt endi bir nechta savolga javob bergan holda keladi
    (raqamlari bir-biriga mos bo'lishi uchun). Testlar aniq bir savol id siga
    bog'lanib qolmasligi kerak: aks holda seed o'zgarganda ular sinadi,
    garchi tekshirayotgan xatti-harakat buzilmagan bo'lsa ham.
    """
    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    answered = set(student.get("answeredQuizzes") or [])
    for subject in SUBJECTS_DB:
        for quiz in subject.get("quizzes", []):
            if quiz["id"] not in answered:
                return subject["id"], quiz
    raise AssertionError("barcha savollarga javob berilgan — test uchun savol qolmadi")


MATH_QUIZ = SUBJECTS_DB[0]["quizzes"][0]


# ----------------------------------------------------------- ro'yxatdan o'tish

def test_register_rejects_malformed_email(client):
    """Ilgari 'notanemail' ham qabul qilinardi."""
    res = client.post(
        "/api/auth/register",
        json={"name": "QA", "email": "notanemail", "password": "parol123"},
    )
    assert res.status_code == 422


def test_register_rejects_absurdly_long_name(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "Q" * 5000, "email": "uzun@voxy.edu", "password": "parol123"},
    )
    assert res.status_code == 422


def test_register_rejects_absurdly_long_password(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "QA", "email": "uzunparol@voxy.edu", "password": "p" * 5000},
    )
    assert res.status_code == 422


def test_register_short_password_message_is_readable(client):
    """Xabar foydalanuvchiga ko'rsatiladi — tushunarli bo'lishi kerak."""
    res = client.post(
        "/api/auth/register",
        json={"name": "QA", "email": "qisqa2@voxy.edu", "password": "123"},
    )
    assert res.status_code == 422
    assert "Parol" in str(res.json()["detail"])


# ----------------------------------------------------------- test javoblari

def test_quiz_rejects_option_outside_range(client, student_token):
    """Ilgari 99-variant 'noto'g'ri javob' deb hisoblanib, XP berib yuborardi."""
    res = client.post(
        "/api/quizzes/submit",
        json={"subjectId": "matematika", "questionId": MATH_QUIZ["id"], "selectedOption": 99},
        headers=auth(student_token),
    )
    assert res.status_code == 422


def test_quiz_rejects_negative_option(client, student_token):
    res = client.post(
        "/api/quizzes/submit",
        json={"subjectId": "matematika", "questionId": MATH_QUIZ["id"], "selectedOption": -1},
        headers=auth(student_token),
    )
    assert res.status_code == 422


def test_quiz_rejects_option_beyond_this_questions_options(client, student_token):
    """Sxema 0..9 ni ruxsat beradi, lekin savolda 4 ta variant bor."""
    assert len(MATH_QUIZ["options"]) == 4
    res = client.post(
        "/api/quizzes/submit",
        json={"subjectId": "matematika", "questionId": MATH_QUIZ["id"], "selectedOption": 7},
        headers=auth(student_token),
    )
    assert res.status_code == 422


# ----------------------------------------------------------- XP suiiste'moli

def test_xp_is_awarded_only_once_per_question(client, student_token):
    """Eng og'ir nuqson: bitta savolni qayta yuborib cheksiz XP to'plash mumkin edi."""
    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    before = student["totalXP"]
    # To'g'ri variant ma'lumotdan olinadi: ilgari bu yerda 0 yozilgan edi va test
    # faqat barcha savollarning javobi birinchi variant bo'lgani uchun o'tardi.
    subject_id, quiz = _unanswered_quiz()
    body = {
        "subjectId": subject_id,
        "questionId": quiz["id"],
        "selectedOption": quiz["correctIndex"],
    }

    first = client.post("/api/quizzes/submit", json=body, headers=auth(student_token))
    assert first.status_code == 200
    assert first.json()["earnedXP"] == 100
    assert first.json()["alreadyAnswered"] is False

    for _ in range(4):
        again = client.post("/api/quizzes/submit", json=body, headers=auth(student_token))
        assert again.status_code == 200
        assert again.json()["earnedXP"] == 0
        assert again.json()["alreadyAnswered"] is True
        # Javob va izoh baribir qaytadi — UI ishlashda davom etadi.
        assert again.json()["correctIndex"] == quiz["correctIndex"]

    assert student["totalXP"] == before + 100


def test_quiz_response_reports_server_side_total(client, student_token):
    res = client.post(
        "/api/quizzes/submit",
        json={"subjectId": "fizika", "questionId": SUBJECTS_DB[1]["quizzes"][0]["id"], "selectedOption": 0},
        headers=auth(student_token),
    )
    assert res.status_code == 200
    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    assert res.json()["totalXP"] == student["totalXP"]


def test_wrong_answer_also_counts_only_once(client, student_token):
    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    before = student["totalXP"]
    # Javob berilmagan savol + ataylab NOTO'G'RI variant tanlanadi.
    subject_id, quiz = _unanswered_quiz()
    wrong = (quiz["correctIndex"] + 1) % len(quiz["options"])
    body = {"subjectId": subject_id, "questionId": quiz["id"], "selectedOption": wrong}

    assert client.post("/api/quizzes/submit", json=body, headers=auth(student_token)).json()["earnedXP"] == 10
    assert client.post("/api/quizzes/submit", json=body, headers=auth(student_token)).json()["earnedXP"] == 0
    assert student["totalXP"] == before + 10


# ----------------------------------------------------------- AI tutor chegaralari

def test_ai_chat_rejects_oversized_question(client, student_token):
    """Gemini so'rovi pullik — cheksiz uzun savol yuborib bo'lmaydi."""
    res = client.post(
        "/api/ai/chat",
        json={"subjectId": "matematika", "question": "x" * 20000},
        headers=auth(student_token),
    )
    assert res.status_code == 422


def test_ai_chat_rejects_blank_question(client, student_token):
    res = client.post(
        "/api/ai/chat",
        json={"subjectId": "matematika", "question": "   "},
        headers=auth(student_token),
    )
    assert res.status_code == 422


def test_subject_select_rejects_oversized_level(client, student_token):
    res = client.post(
        "/api/subjects/select",
        json={"subjectId": "matematika", "level": "L" * 500},
        headers=auth(student_token),
    )
    assert res.status_code == 422


def test_correct_answers_are_not_all_the_first_option():
    """Barcha savollarning javobi birinchi variant bo'lmasligi kerak.

    Ilgari 10 ta savolning HAMMASIDA correctIndex = 0 edi: sudya "A" ni bosib
    har safar to'g'ri javob olardi va test o'yini ko'zbo'yamachilikka aylanardi.
    """
    indexes = [q["correctIndex"] for s in SUBJECTS_DB for q in s.get("quizzes", [])]
    assert len(indexes) >= 10, "savollar soni kamayib ketdi"
    assert len(set(indexes)) >= 3, f"javoblar bir xil pozitsiyada: {indexes}"
    assert indexes.count(0) <= len(indexes) // 2, "javoblarning yarmidan ko'pi birinchi variant"


def test_every_correct_index_points_inside_its_options():
    """correctIndex har doim o'z variantlari ichida bo'lishi kerak."""
    for subject in SUBJECTS_DB:
        for quiz in subject.get("quizzes", []):
            assert 0 <= quiz["correctIndex"] < len(quiz["options"]), (
                f"{subject['id']} q{quiz['id']}: correctIndex {quiz['correctIndex']} "
                f"variantlar soni {len(quiz['options'])}"
            )


def test_streak_counts_consecutive_days_and_resets_after_a_gap():
    """`streakDays` haqiqatan o'sishi kerak.

    Ilgari u faqat ro'yxatdan o'tishda `1` deb yozilar va boshqa hech qayerda
    o'zgarmasdi — profil, dashboard va nishonlar doim «1 kun» ko'rsatardi.
    """
    import asyncio
    from datetime import date

    from app.core.users import touch_streak

    user = {"id": "u_streak_test", "streakDays": 1, "lastActiveDate": "2026-03-01"}

    # Shu kunning o'zida qayta kirish seriyani oshirmaydi.
    assert asyncio.run(touch_streak(user, today=date(2026, 3, 1))) == 1

    # Ertasi kun — +1.
    assert asyncio.run(touch_streak(user, today=date(2026, 3, 2))) == 2
    assert asyncio.run(touch_streak(user, today=date(2026, 3, 3))) == 3

    # Bir kun tashlab ketilsa — 1 dan qayta boshlanadi.
    assert asyncio.run(touch_streak(user, today=date(2026, 3, 10))) == 1


def test_streak_starts_at_one_for_a_user_with_no_history():
    import asyncio
    from datetime import date

    from app.core.users import touch_streak

    assert asyncio.run(touch_streak({"id": "u_new"}, today=date(2026, 3, 1))) == 1


def test_login_updates_the_streak(client):
    """Kirish — kunlik faollik: seriya kirishdan keyin yozilgan bo'lishi kerak."""
    from app.data.database import USERS_DB

    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    student.pop("lastActiveDate", None)

    res = client.post(
        "/api/auth/login", json={"email": "student@voxy.edu", "password": "password123"}
    )
    assert res.status_code == 200
    assert student.get("lastActiveDate"), "kirishdan keyin lastActiveDate yozilmadi"


def test_demo_student_stats_are_internally_consistent():
    """Demo akkauntning raqamlari bir-biriga mos bo'lishi kerak.

    Ilgari u 2840 XP va 12 kunlik seriya bilan kelar, javob berilgan savollar
    esa bo'sh edi. Platformada jami 10 ta savol bor: hammasiga to'g'ri javob
    berilganda ham ko'pi bilan 1000 XP chiqadi, ya'ni profil o'ziga zid edi.
    """
    from app.data.database import SUBJECTS_DB, USERS_DB

    student = next(u for u in USERS_DB if u["id"] == "u_student_1")
    answered = student.get("answeredQuizzes") or []
    all_ids = {q["id"] for s in SUBJECTS_DB for q in s.get("quizzes", [])}

    assert set(answered) <= all_ids, "javob berilgan savol katalogda yo'q"

    # Har bir savol uchun eng ko'pi 100 XP (to'g'ri javob), eng kami 10 (xato).
    assert 10 * len(answered) <= student["totalXP"] <= 100 * len(answered), (
        f"{len(answered)} ta javob bilan {student['totalXP']} XP bo'lishi mumkin emas"
    )
    assert student["totalXP"] <= 100 * len(all_ids), "XP butun katalog imkoniyatidan oshib ketdi"
