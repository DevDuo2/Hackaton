"""Request/response modellari.

Chegaralar (uzunlik, diapazon) ataylab sxemada: shu tufayli har bir routerda qo'lda
tekshirish kerak emas va FastAPI o'zi 422 qaytaradi.
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field

MAX_NAME_LENGTH = 64
MAX_PASSWORD_LENGTH = 128
MAX_QUESTION_LENGTH = 2000
MAX_OPTION_INDEX = 9  # bitta savolda 10 tadan ortiq variant bo'lmaydi


class LoginRequest(BaseModel):
    # Bu yerda EmailStr emas: admin qisqa "admin" logini bilan ham kiradi.
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=MAX_NAME_LENGTH)
    email: EmailStr = Field(max_length=254)
    # min_length ataylab yo'q: router tushunarli o'zbekcha xabar qaytaradi.
    password: str = Field(max_length=MAX_PASSWORD_LENGTH)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    selectedSubject: Optional[str] = "matematika"
    avatar: str


class AuthResponse(BaseModel):
    """Login/register javobi. Token faqat yuqori darajada — `user` ichida emas."""

    success: bool
    token: str
    user: dict
    message: str


class SelectSubjectRequest(BaseModel):
    subjectId: str = Field(min_length=1, max_length=32)
    level: Optional[str] = Field(default="O'rta", max_length=64)


class AIChatRequest(BaseModel):
    subjectId: str = Field(min_length=1, max_length=32)
    # Gemini so'rovi pullik: savol uzunligi cheklanadi.
    question: str = Field(min_length=1, max_length=MAX_QUESTION_LENGTH)
    history: Optional[List[dict]] = Field(default_factory=list, max_length=20)


class AIChatResponse(BaseModel):
    subjectId: str
    response: str
    suggestedTopics: List[str]
    # "gemini" — haqiqiy model javobi; "offline" — serverdagi zaxira bilim bazasi.
    # Foydalanuvchi oldindan yozilgan matnni AI javobi deb o'ylamasligi uchun kerak.
    source: Literal["gemini", "offline"] = "offline"


class QuizAnswerSubmit(BaseModel):
    subjectId: str = Field(min_length=1, max_length=32)
    questionId: int = Field(ge=1)
    selectedOption: int = Field(ge=0, le=MAX_OPTION_INDEX)


class TelegramLinkRequest(BaseModel):
    telegramUsername: str = Field(min_length=1, max_length=32)


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=MAX_PASSWORD_LENGTH)


class UpdateProfileRequest(BaseModel):
    """Profilning foydalanuvchi o'zgartira oladigan maydonlari. Email va rol bu yerda yo'q:
    email — shaxsni aniqlovchi maydon, rolni esa foydalanuvchi o'ziga bera olmasligi kerak."""

    name: Optional[str] = Field(default=None, max_length=MAX_NAME_LENGTH)
    language: Optional[str] = Field(default=None, max_length=32)
    notifications: Optional[bool] = None
    selectedSubject: Optional[str] = Field(default=None, max_length=32)


class PlatformSettingsRequest(BaseModel):
    """Admin panelidan keladigan platforma sozlamalari.

    Hamma maydon Optional: sahifa faqat o'zgargan qiymatlarni yuborishi mumkin.
    """

    platformName: Optional[str] = Field(default=None, min_length=1, max_length=120)
    allowRegistration: Optional[bool] = None
    maintenanceMode: Optional[bool] = None
