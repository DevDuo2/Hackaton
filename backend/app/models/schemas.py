from pydantic import BaseModel, EmailStr
from typing import List, Optional

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    selectedSubject: Optional[str] = "matematika"
    avatar: str
    token: str

class SelectSubjectRequest(BaseModel):
    userId: str
    subjectId: str
    level: Optional[str] = "O'rta"

class AIChatRequest(BaseModel):
    subjectId: str
    question: str
    history: Optional[List[dict]] = []

class AIChatResponse(BaseModel):
    subjectId: str
    response: str
    suggestedTopics: List[str]

class QuizAnswerSubmit(BaseModel):
    userId: str
    subjectId: str
    questionId: int
    selectedOption: int

class TelegramLinkRequest(BaseModel):
    userId: str
    telegramUsername: str

class AdminLoginRequest(BaseModel):
    username: str
    password: str

