import logging
import os
import time
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.models.schemas import AIChatRequest, AIChatResponse
from app.core.database import get_database
from app.core.ratelimit import ai_limiter
from app.core.billing import plan_for, record_ai_message, remaining_ai_messages
from app.core.security import get_current_user
from app.core.users import find_user_by_id
from app.data.database import SUBJECTS_DB

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Personal Tutor"])

DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"


def _gemini_key() -> str:
    return os.getenv("GEMINI_API_KEY", "").strip()


def _gemini_model() -> str:
    return os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL).strip() or DEFAULT_GEMINI_MODEL


@router.get("/status")
async def ai_status():
    """Frontend AI haqiqatan ulanganini bilishi uchun. Kalitning o'zi qaytarilmaydi."""
    configured = bool(_gemini_key())
    return {
        "configured": configured,
        "model": _gemini_model() if configured else None,
        "fallback": "offline_knowledge_base",
    }

@router.post("/chat", response_model=AIChatResponse)
async def ask_ai_tutor(
    payload: AIChatRequest,
    request: Request,
    claims: dict = Depends(get_current_user),
):
    """Google Gemini API orqali fan bo'yicha maslahat.

    Avtorizatsiya talab qiladi: aks holda har qanday odam Gemini kvotasini
    anonim ravishda sarflab yuborishi mumkin.
    """
    # Har bir so'rov pullik Gemini chaqiruvi — foydalanuvchi bo'yicha cheklanadi.
    ai_limiter.check(claims["sub"])

    from_gemini = False
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Savol bo'sh bo'lmasligi kerak.")

    # Obuna chekloviga SERVERDA qaraladi. UI dagi tekshiruv himoya emas:
    # kimdir to'g'ridan-to'g'ri /api/ai/chat ga murojaat qilsa, kunlik limit
    # baribir ishlashi kerak — aks holda reja shunchaki bezak bo'lib qoladi.
    user = await find_user_by_id(claims["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessiya endi yaroqsiz. Iltimos, qaytadan kiring.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    plan = plan_for(user)
    left = remaining_ai_messages(user)
    if left is not None and left <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Bugungi {plan['aiMessagesPerDay']} ta savol limiti tugadi. "
                "Ertaga yangilanadi yoki Pro rejaga o'ting."
            ),
        )

    db = get_database()
    sub = None
    if db is not None:
        sub = await db["subjects"].find_one({"id": payload.subjectId})
    if not sub:
        sub = next((s for s in SUBJECTS_DB if s["id"] == payload.subjectId), None)
    if not sub:
        # Ilgari bu yerda SUBJECTS_DB[0] ga qaytar edi: talaba "Kimyo" tanlasa ham AI
        # matematika o'qituvchisi bo'lib javob berardi.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bunday fan topilmadi.",
        )

    gemini_key = _gemini_key()
    gemini_model = _gemini_model()
    ai_text = ""

    # Real Google Gemini API Call
    if gemini_key:
        try:
            system_instruction = (
                f"Sen VOXY ta'lim platformasining professional {sub['name']} o'qituvchisisan. "
                f"Foydalanuvchiga o'zbek tilida, tushunarli, aniq formulalar, qadam-baqadam yechimlar va "
                f"amaliy misollar bilan yordam ber. Javobing chiroyli va qulay formatda bo'lsin."
            )

            prompt = f"Mavzu/Fan: {sub['name']}\nSavol: {question}\n\nIltimos batafsil va aniq tushuntirib ber."

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_key}"
            
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    url,
                    json={
                        "system_instruction": {
                            "parts": [{"text": system_instruction}]
                        },
                        "contents": [
                            {"parts": [{"text": prompt}]}
                        ]
                    }
                )

                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and len(candidates) > 0:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            ai_text = parts[0].get("text", "")
                            from_gemini = bool(ai_text)
                else:
                    logger.warning(
                        "Gemini javob bermadi (status=%s), lokal bilimga o'tilmoqda.",
                        res.status_code,
                    )
        except Exception:
            logger.warning("Gemini API xatosi, lokal bilimga o'tilmoqda.", exc_info=True)

    # Fallback to local subject knowledge if API is unreachable.
    # Kalit so'zlar fanga bog'langan: aks holda Kimyo savoliga kvadrat tenglama
    # haqidagi javob qaytib qolardi.
    if not ai_text:
        q_lower = question.lower()
        if payload.subjectId == "matematika" and ("tenglama" in q_lower or "diskriminant" in q_lower):
            ai_text = (
                "Kvadrat tenglamani yechish bo'yicha tushuntirish:\n\n"
                "ax² + bx + c = 0 formulasi bo'yicha:\n"
                "1. D = b² - 4ac (Diskriminant topiladi)\n"
                "2. Agar D > 0 bo'lsa, x₁,₂ = (-b ± √D) / 2a\n"
                "Misol: x² - 5x + 6 = 0 bo'lganda D = 25 - 24 = 1. Ildizlar: x₁=3, x₂=2."
            )
        elif payload.subjectId == "fizika" and ("nyuton" in q_lower or "kuch" in q_lower):
            ai_text = (
                "Nyutonning II qonuni:\n\n"
                "Formula: F = m · a\n"
                "Jismga ta'sir qiluvchi kuch uning massasi va olgan tezlanishi ko'paytmasiga teng.\n"
                "Masalan: 4 kg jismni 5 m/s² tezlatish uchun 20 N kuch kerak."
            )
        else:
            ai_text = (
                f"{sub['name']} fani bo'yicha tahlil:\n\n"
                f"'{question}' savoli bo'yicha eng muhim tushuncha — bu mavzuning amaliy formulalari va qoidalarini aniq qo'llashdir.\n"
                "Ushbu mavzuni mustahkamlash uchun VOXY Testlar bo'limida sinov testini yechishni tavsiya qilaman!"
            )

    # Log to MongoDB conversations if connected.
    # Yozib bo'lmasa ham javob BERILADI: suhbat jurnali yordamchi narsa, javob esa
    # asosiy mahsulot. Ilgari bu `await` himoyasiz edi — Atlas qo'lga tushsa yoki
    # yozishga ruxsat bo'lmasa, Gemini allaqachon qaytargan to'g'ri javob
    # tashlanib, foydalanuvchi 500 olardi.
    if db is not None:
        try:
            await db["ai_conversations"].insert_one({
                "userId": claims["sub"],
                "subjectId": payload.subjectId,
                "question": question,
                "response": ai_text,
                "timestamp": time.time()
            })
        except Exception as e:
            logger.warning("AI suhbatini jurnalga yozib bo'lmadi: %s", e)

    # Hisob javob TAYYOR bo'lgandan keyin oshiriladi: xato yuz bersa,
    # foydalanuvchining kunlik limiti behuda sarflanmaydi.
    await record_ai_message(user)

    return AIChatResponse(
        subjectId=payload.subjectId,
        response=ai_text,
        suggestedTopics=sub.get("sampleQuestions", []),
        source="gemini" if from_gemini else "offline",
        messagesLeftToday=remaining_ai_messages(user),
    )
