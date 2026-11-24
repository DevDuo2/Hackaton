from fastapi import APIRouter, HTTPException, status
from app.core.database import get_database
from app.data.database import USERS_DB, SUBJECTS_DB, COURSES_DB
from app.models.schemas import AdminLoginRequest
import time

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

@router.post("/login")
async def admin_login(payload: AdminLoginRequest):
    """Alohida administrator kirish endpointi"""
    login_val = payload.username.lower().strip()
    db = get_database()
    admin_user = None

    if db is not None:
        if login_val == "admin":
            admin_user = await db["users"].find_one({"$or": [{"email": "admin@voxy.edu"}, {"role": "admin"}, {"username": "admin"}]})
        else:
            admin_user = await db["users"].find_one({"$or": [{"email": login_val}, {"username": login_val}]})

    if not admin_user:
        if login_val in ["admin", "admin@voxy.edu"]:
            admin_user = next((u for u in USERS_DB if u.get("role") == "admin"), None)
        else:
            admin_user = next((u for u in USERS_DB if u.get("email", "").lower() == login_val or u.get("username", "").lower() == login_val), None)

    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin foydalanuvchisi topilmadi."
        )

    if admin_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan: Siz administrator huquqiga ega emassiz!"
        )

    if admin_user.get("password") != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kiritilgan admin paroli noto'g'ri."
        )

    token = f"voxy_admin_jwt_{admin_user['id']}_{int(time.time())}"
    return {
        "success": True,
        "token": token,
        "user": {
            "id": admin_user["id"],
            "name": admin_user.get("name", "Administrator"),
            "email": admin_user.get("email", "admin@voxy.edu"),
            "username": "admin",
            "role": "admin",
            "avatar": admin_user.get("avatar", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200")
        }
    }

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
