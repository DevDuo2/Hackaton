from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import SelectSubjectRequest
from app.core.database import get_database
from app.core.security import get_current_user
from app.data.database import SUBJECTS_DB, USERS_DB

router = APIRouter(prefix="/api/subjects", tags=["Subjects & Onboarding"])

CATALOGUE_FIELDS = (
    "id",
    "name",
    "iconSymbol",
    "color",
    "description",
    "topicsCount",
    "studentsCount",
    "sampleQuestions",
)


def _catalogue_entry(subject: dict) -> dict:
    """Faqat katalog maydonlari + savollar SONI.

    `quizzes` ataylab chiqarilmaydi: u `correctIndex` va `explanation` ni ham
    o'z ichiga oladi, ya'ni bu endpoint barcha test javoblarini oshkor qilardi.
    """
    entry = {k: subject.get(k) for k in CATALOGUE_FIELDS if subject.get(k) is not None}
    entry["quizCount"] = len(subject.get("quizzes") or [])
    return entry


@router.get("/")
async def get_all_subjects():
    """Fanlar katalogi (ochiq ma'lumot). Test javoblari bu yerda yo'q."""
    db = get_database()
    subjects = None
    if db is not None:
        cursor = db["subjects"].find({}, {"_id": 0})
        subjects = await cursor.to_list(length=100)
    if not subjects:
        subjects = SUBJECTS_DB
    return {"subjects": [_catalogue_entry(s) for s in subjects]}

@router.post("/select")
async def select_subject(
    payload: SelectSubjectRequest,
    claims: dict = Depends(get_current_user),
):
    """Tanlangan fanni saqlaydi. Kimga yozilishi tokendan olinadi, so'rov tanasidan emas."""
    user_id = claims["sub"]
    if not any(s["id"] == payload.subjectId for s in SUBJECTS_DB):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday fan topilmadi.",
        )

    db = get_database()
    if db is not None:
        result = await db["users"].update_one(
            {"id": user_id},
            {"$set": {"selectedSubject": payload.subjectId, "level": payload.level}}
        )
        saved = result.matched_count > 0
    else:
        saved = False
        for user in USERS_DB:
            if user["id"] == user_id:
                user["selectedSubject"] = payload.subjectId
                user["level"] = payload.level
                saved = True

    if not saved:
        # Ilgari bu holatda ham {"success": true} qaytardi. Token amal qiladi,
        # lekin undagi foydalanuvchi bazada yo'q (akkaunt o'chirilgan yoki baza
        # almashgan) — onboarding "saqlandi" deb ko'rsatib, aslida hech narsa
        # yozmasdi va talaba tanlovi keyingi sahifada yo'qolib qolardi.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya endi yaroqsiz. Iltimos, qaytadan kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "success": True,
        "subjectId": payload.subjectId,
        "level": payload.level,
        "message": f"{payload.subjectId} fani muvaffaqiyatli saqlandi."
    }
