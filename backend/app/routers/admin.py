import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.database import get_database
from app.core.platform import get_settings, save_settings
from app.core.ratelimit import client_key, identity_key, login_ip_limiter, login_limiter
from app.core.security import create_access_token, require_admin, verify_password
from app.core.users import find_user, public_user, upgrade_password_hash
from app.data.database import COURSES_DB, SUBJECTS_DB, USERS_DB
from app.models.schemas import (
    AdminLoginRequest,
    AuthResponse,
    PlatformSettingsRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])

ACTIVE_WINDOW_SECONDS = 24 * 3600


@router.post("/login", response_model=AuthResponse)
async def admin_login(payload: AdminLoginRequest, request: Request):
    """Alohida administrator kirish endpointi."""
    # Admin paroli eng qimmatli nishon — shuning uchun bir xil limit.
    # Akkaunt bo'yicha: bitta IPdagi boshqa odamlarni bloklab qo'ymasligi uchun.
    login_limiter.check(identity_key(payload.username, "login"))
    login_ip_limiter.check(client_key(request, "login-ip"))

    user = await find_user(payload.username)

    if not user or not verify_password(payload.password, user.get("password")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin login yoki paroli noto'g'ri.",
        )
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kirish taqiqlangan: siz administrator huquqiga ega emassiz!",
        )

    await upgrade_password_hash(user, payload.password)
    return AuthResponse(
        success=True,
        token=create_access_token(user),
        user={**public_user(user, include_email=True), "username": user.get("username", "admin")},
        message="Administrator sifatida muvaffaqiyatli kirildi.",
    )


@router.get("/stats")
async def get_admin_stats(_: dict = Depends(require_admin)):
    db = get_database()
    if db is not None:
        active_since = time.time() - ACTIVE_WINDOW_SECONDS
        return {
            "totalStudents": await db["users"].count_documents({"role": "student"}),
            "totalSubjects": await db["subjects"].count_documents({}),
            "totalCourses": await db["courses"].count_documents({}),
            # Oxirgi 24 soatda AI tutorga savol bergan noyob foydalanuvchilar.
            "activeUsersNow": len(
                await db["ai_conversations"].distinct("userId", {"timestamp": {"$gte": active_since}})
            ),
            "database": "MongoDB Atlas Connected",
            "serverStatus": "Healthy",
        }
    return {
        "totalStudents": sum(1 for u in USERS_DB if u.get("role") == "student"),
        "totalSubjects": len(SUBJECTS_DB),
        "totalCourses": len(COURSES_DB),
        "activeUsersNow": 0,
        "database": "Fallback Memory Mode",
        "serverStatus": "Healthy",
    }


@router.get("/students")
async def get_all_students(_: dict = Depends(require_admin)):
    db = get_database()
    if db is not None:
        cursor = db["users"].find({}, {"_id": 0, "password": 0})
        students = await cursor.to_list(length=100)
        if students:
            # Mongo hujjatini xom holda qaytarib bo'lmaydi: admin jadvali
            # `answeredCount` ni o'qiydi (xom hujjatda u yo'q — ustun doim 0
            # bo'lib turardi), qolgan maydonlar esa — til, bildirishnoma kabi
            # shaxsiy sozlamalar — bu ro'yxatga umuman kerak emas.
            return {"students": [public_user(u, include_email=True) for u in students]}
    # public_user parolni ham, Mongo `_id` ni ham tashlab ketadi.
    return {"students": [public_user(u, include_email=True) for u in USERS_DB]}


@router.get("/settings")
async def read_platform_settings(_: dict = Depends(require_admin)):
    """Joriy platforma sozlamalari. Sahifa yangilanganda haqiqiy qiymat ko'rinadi."""
    return {"settings": await get_settings()}


@router.put("/settings")
async def write_platform_settings(
    payload: PlatformSettingsRequest,
    _: dict = Depends(require_admin),
):
    """Sozlamalarni saqlaydi va YANGILANGAN holatni qaytaradi.

    Javobdagi `settings` — bazadan qayta o'qilgan qiymat, yuborilgan emas:
    shuning uchun UI «Saqlandi» deb ko'rsatsa, u haqiqatan saqlangan bo'ladi.
    """
    try:
        updated = await save_settings(payload.model_dump(exclude_none=True))
    except Exception as e:
        logger.error("Platforma sozlamalarini saqlab bo'lmadi: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sozlamalarni saqlab bo'lmadi: baza javob bermadi.",
        )
    return {"success": True, "settings": updated, "message": "Sozlamalar saqlandi."}


@router.get("/quizzes")
async def get_quiz_bank(_: dict = Depends(require_admin)):
    """To'liq savollar banki — javoblari bilan, FAQAT admin uchun.

    Nega kerak: /admin/quizzes sahifasi javoblarni ko'rsatishi kerak, lekin
    ilgari u `my-app/data/mockData.ts` dan o'qiydi edi. Bu fayl brauzer
    bundliga tushadi, demak to'g'ri javoblar HAR QANDAY tashrifchiga ochiq
    bo'lardi — backend `correctIndex` ni ataylab yashirgani behuda ketardi.
    """
    db = get_database()
    subjects = None
    if db is not None:
        cursor = db["subjects"].find({}, {"_id": 0})
        subjects = await cursor.to_list(length=100)
    if not subjects:
        subjects = SUBJECTS_DB

    questions = []
    for subject in subjects:
        for quiz in subject.get("quizzes", []):
            questions.append({
                "id": quiz["id"],
                "subjectId": subject["id"],
                "subjectName": subject.get("name", subject["id"]),
                "question": quiz["question"],
                "options": quiz["options"],
                "correctIndex": quiz["correctIndex"],
                "explanation": quiz.get("explanation", ""),
            })
    return {"questions": questions}
