from fastapi import APIRouter
from app.models.schemas import QuizAnswerSubmit
from app.core.database import get_database
from app.data.database import SUBJECTS_DB, USERS_DB
from typing import Optional

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes & Leaderboard"])

@router.get("/daily")
async def get_daily_quizzes(subjectId: Optional[str] = "matematika"):
    db = get_database()
    if db is not None:
        sub = await db["subjects"].find_one({"id": subjectId}, {"_id": 0})
        if sub and "quizzes" in sub:
            return {"subject": sub["name"], "quizzes": sub["quizzes"]}
    sub = next((s for s in SUBJECTS_DB if s["id"] == subjectId), SUBJECTS_DB[0])
    return {"subject": sub["name"], "quizzes": sub["quizzes"]}

@router.post("/submit")
async def submit_answer(payload: QuizAnswerSubmit):
    db = get_database()
    sub = None
    if db is not None:
        sub = await db["subjects"].find_one({"id": payload.subjectId})
    if not sub:
        sub = next((s for s in SUBJECTS_DB if s["id"] == payload.subjectId), SUBJECTS_DB[0])

    quiz = next((q for q in sub["quizzes"] if q["id"] == payload.questionId), sub["quizzes"][0])
    is_correct = payload.selectedOption == quiz["correctIndex"]
    earned_xp = 100 if is_correct else 10

    if db is not None:
        await db["users"].update_one(
            {"id": payload.userId},
            {"$inc": {"totalXP": earned_xp}}
        )

    return {
        "isCorrect": is_correct,
        "correctIndex": quiz["correctIndex"],
        "explanation": quiz["explanation"],
        "earnedXP": earned_xp,
        "message": "To'g'ri javob!" if is_correct else "Noto'g'ri javob, izohni ko'ring."
    }

@router.get("/leaderboard")
async def get_leaderboard():
    db = get_database()
    if db is not None:
        cursor = db["users"].find({}, {"_id": 0, "password": 0}).sort("totalXP", -1).limit(20)
        leaders = await cursor.to_list(length=20)
        if leaders:
            return {"leaderboard": leaders}
    sorted_users = sorted(USERS_DB, key=lambda u: u.get("totalXP", 0), reverse=True)
    return {"leaderboard": sorted_users}
