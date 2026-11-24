from fastapi import APIRouter
from app.models.schemas import SelectSubjectRequest
from app.core.database import get_database
from app.data.database import SUBJECTS_DB

router = APIRouter(prefix="/api/subjects", tags=["Subjects & Onboarding"])

@router.get("/")
async def get_all_subjects():
    """MongoDB dan barcha fanlar ro'yxatini oladi"""
    db = get_database()
    if db is not None:
        cursor = db["subjects"].find({}, {"_id": 0})
        subjects = await cursor.to_list(length=100)
        if subjects:
            return {"subjects": subjects}
    return {"subjects": SUBJECTS_DB}

@router.post("/select")
async def select_subject(payload: SelectSubjectRequest):
    """Talaba uchun tanlangan fanni saqlaydi"""
    db = get_database()
    if db is not None:
        await db["users"].update_one(
            {"id": payload.userId},
            {"$set": {"selectedSubject": payload.subjectId, "level": payload.level}}
        )
    return {
        "success": True,
        "subjectId": payload.subjectId,
        "level": payload.level,
        "message": f"{payload.subjectId} fani muvaffaqiyatli saqlandi."
    }
