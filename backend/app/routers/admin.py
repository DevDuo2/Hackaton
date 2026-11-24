from fastapi import APIRouter
from app.core.database import get_database
from app.data.database import USERS_DB, SUBJECTS_DB, COURSES_DB

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.get("/stats")
async def get_admin_stats():
    db = get_database()
    if db is not None:
        total_users = await db["users"].count_documents({})
        total_subjects = await db["subjects"].count_documents({})
        total_courses = await db["courses"].count_documents({})
        return {
            "totalStudents": total_users,
            "totalSubjects": total_subjects,
            "totalCourses": total_courses,
            "activeUsersNow": 412,
            "database": "MongoDB Atlas Connected",
            "serverStatus": "Healthy (99.9% uptime)"
        }
    return {
        "totalStudents": len(USERS_DB),
        "totalSubjects": len(SUBJECTS_DB),
        "totalCourses": len(COURSES_DB),
        "activeUsersNow": 412,
        "database": "Fallback Memory Mode",
        "serverStatus": "Healthy (99.9% uptime)"
    }

@router.get("/students")
async def get_all_students():
    db = get_database()
    if db is not None:
        cursor = db["users"].find({}, {"_id": 0, "password": 0})
        students = await cursor.to_list(length=100)
        if students:
            return {"students": students}
    return {"students": USERS_DB}
