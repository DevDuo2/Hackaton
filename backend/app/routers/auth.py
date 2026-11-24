from fastapi import APIRouter, HTTPException, status
from app.models.schemas import LoginRequest, RegisterRequest
from app.core.database import get_database
from app.data.database import USERS_DB
import time

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=dict)
async def login(payload: LoginRequest):
    email = payload.email.lower().strip()
    db = get_database()

    user = None
    if db is not None:
        user = await db["users"].find_one({"email": email})
    else:
        user = next((u for u in USERS_DB if u["email"].lower() == email), None)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday foydalanuvchi topilmadi. Iltimos ro'yxatdan o'ting."
        )

    if user["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kiritilgan parol noto'g'ri."
        )

    token = f"voxy_jwt_{user['id']}_{int(time.time())}"
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "selectedSubject": user.get("selectedSubject", "matematika"),
            "avatar": user.get("avatar", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200")
        }
    }

@router.post("/register", response_model=dict)
async def register(payload: RegisterRequest):
    email = payload.email.lower().strip()
    db = get_database()

    existing = None
    if db is not None:
        existing = await db["users"].find_one({"email": email})
    else:
        existing = next((u for u in USERS_DB if u["email"].lower() == email), None)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ushbu email manzili allaqachon ro'yxatdan o'tgan."
        )

    new_id = f"u_{int(time.time())}"
    new_user = {
        "id": new_id,
        "name": payload.name.strip(),
        "email": email,
        "password": payload.password,
        "role": "admin" if "admin" in email else "student",
        "selectedSubject": "matematika",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        "totalXP": 0,
        "streakDays": 1,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    if db is not None:
        await db["users"].insert_one(new_user)
    else:
        USERS_DB.append(new_user)

    token = f"voxy_jwt_{new_id}_{int(time.time())}"
    return {
        "success": True,
        "token": token,
        "user": {
            "id": new_user["id"],
            "name": new_user["name"],
            "email": new_user["email"],
            "role": new_user["role"],
            "selectedSubject": new_user["selectedSubject"],
            "avatar": new_user["avatar"]
        }
    }

@router.get("/me")
async def get_current_user():
    db = get_database()
    if db is not None:
        user = await db["users"].find_one({}, {"_id": 0})
        if user:
            return {"authenticated": True, "user": user}
    return {"authenticated": True, "user": USERS_DB[0]}
