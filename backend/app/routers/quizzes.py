from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import QuizAnswerSubmit
from app.core.database import get_database
from app.core.platform import require_service_available
from app.core.security import get_current_user
from app.core.users import (
    find_user_by_id,
    has_answered,
    public_user,
    record_quiz_answer,
    touch_streak,
)
from app.data.database import SUBJECTS_DB, USERS_DB
from typing import Optional

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes & Leaderboard"])

@router.get("/daily")
async def get_daily_quizzes(subjectId: str = "matematika"):
    """Fan bo'yicha test savollari. Noma'lum fan uchun 404 — boshqa fanning
    savollarini jimgina qaytarish talabani chalkashtiradi."""
    db = get_database()
    sub = None
    if db is not None:
        sub = await db["subjects"].find_one({"id": subjectId}, {"_id": 0})
    if not sub or "quizzes" not in sub:
        sub = next((s for s in SUBJECTS_DB if s["id"] == subjectId), None)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday fan topilmadi.",
        )
    # correctIndex va explanation ataylab yuborilmaydi: aks holda javoblarni
    # brauzerning tarmoq panelida ko'rib olish mumkin bo'lardi.
    return {
        "subjectId": sub["id"],
        "subject": sub["name"],
        "quizzes": [
            {"id": q["id"], "question": q["question"], "options": q["options"]}
            for q in sub["quizzes"]
        ],
    }

@router.post("/submit")
async def submit_answer(
    payload: QuizAnswerSubmit,
    # Texnik tanaffus rejimida talaba javob yubora olmaydi (admin — oladi).
    claims: dict = Depends(require_service_available),
):
    """XP tokendagi foydalanuvchiga yoziladi — boshqa odamga XP qo'shib bo'lmaydi."""
    user_id = claims["sub"]
    db = get_database()
    sub = None
    if db is not None:
        sub = await db["subjects"].find_one({"id": payload.subjectId}, {"_id": 0})
    # `"quizzes" not in sub` ni ham tekshirish SHART: Atlasdagi fan hujjati
    # savollarsiz bo'lsa (boshqa vosita bilan kiritilgan), pastdagi
    # sub["quizzes"] KeyError berib, javob yuborishni 500 ga aylantiradi.
    # /daily shoxi buni allaqachon tekshiradi, bu shox esa tekshirmasdi.
    if not sub or "quizzes" not in sub:
        sub = next((s for s in SUBJECTS_DB if s["id"] == payload.subjectId), None)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday fan topilmadi.",
        )

    quiz = next((q for q in sub["quizzes"] if q["id"] == payload.questionId), None)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday test savoli topilmadi.",
        )
    if payload.selectedOption >= len(quiz["options"]):
        raise HTTPException(
            status_code=422,
            detail="Bunday javob varianti yo'q.",
        )

    user = await find_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya endi yaroqsiz. Iltimos, qaytadan kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    is_correct = payload.selectedOption == quiz["correctIndex"]
    # XP har bir savol uchun faqat BIR MARTA beriladi: aks holda bitta savolni
    # qayta-qayta yuborib reytingni cheksiz ko'tarish mumkin bo'lardi.
    already_answered = has_answered(user, payload.questionId)
    earned_xp = 0 if already_answered else (100 if is_correct else 10)
    if not already_answered:
        await record_quiz_answer(user, payload.questionId, earned_xp)
    # Savolga javob berish ham kunlik faollik — seriya shu yerda ham yangilanadi.
    await touch_streak(user)

    if already_answered:
        message = "Bu savolga avval javob bergansiz — XP qayta qo'shilmaydi."
    elif is_correct:
        message = "To'g'ri javob!"
    else:
        message = "Noto'g'ri javob, izohni ko'ring."

    return {
        "isCorrect": is_correct,
        "correctIndex": quiz["correctIndex"],
        "explanation": quiz["explanation"],
        "earnedXP": earned_xp,
        "alreadyAnswered": already_answered,
        "totalXP": user.get("totalXP", 0),
        "message": message,
    }

@router.get("/leaderboard")
async def get_leaderboard():
    db = get_database()
    if db is not None:
        cursor = db["users"].find({}, {"_id": 0, "password": 0}).sort("totalXP", -1).limit(20)
        leaders = await cursor.to_list(length=20)
        if leaders:
            # Xom Mongo hujjatini qaytarib bo'lmaydi: bu endpoint OCHIQ va hujjat
            # ichida email, createdAt, til sozlamalari — hammasi yotadi. Fallback
            # shoxi allaqachon public_user'dan o'tardi, Mongo shoxi esa o'tmagan.
            return {"leaderboard": [public_user(u) for u in leaders]}
    sorted_users = sorted(USERS_DB, key=lambda u: u.get("totalXP", 0), reverse=True)
    return {"leaderboard": [public_user(u) for u in sorted_users]}
