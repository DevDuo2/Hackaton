from fastapi import APIRouter, HTTPException
from app.core.database import get_database
from app.data.database import COURSES_DB
from typing import Optional

router = APIRouter(prefix="/api/courses", tags=["Courses & Curriculum"])

@router.get("/")
async def get_courses(subjectId: Optional[str] = None):
    db = get_database()
    if db is not None:
        query = {"subjectId": subjectId} if subjectId else {}
        cursor = db["courses"].find(query, {"_id": 0})
        courses = await cursor.to_list(length=100)
        if courses:
            return {"courses": courses}
    if subjectId:
        return {"courses": [c for c in COURSES_DB if c["subjectId"] == subjectId]}
    return {"courses": COURSES_DB}

@router.get("/{course_id}")
async def get_course_detail(course_id: str):
    db = get_database()
    if db is not None:
        course = await db["courses"].find_one({"id": course_id}, {"_id": 0})
        if course:
            return {"course": course}
    course = next((c for c in COURSES_DB if c["id"] == course_id), None)
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    return {"course": course}
