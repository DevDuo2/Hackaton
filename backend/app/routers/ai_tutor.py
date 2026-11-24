import os
import time
import httpx
from fastapi import APIRouter
from app.models.schemas import AIChatRequest, AIChatResponse
from app.core.database import get_database
from app.data.database import SUBJECTS_DB

router = APIRouter(prefix="/api/ai", tags=["AI Personal Tutor"])

@router.post("/chat", response_model=AIChatResponse)
async def ask_ai_tutor(payload: AIChatRequest):
    """
    Haqiqiy Google Gemini API (gemini-3.5-flash-lite) orqali fan bo'yicha maslahat berish.
    """
    db = get_database()
    sub = None
    if db is not None:
        sub = await db["subjects"].find_one({"id": payload.subjectId})
    if not sub:
        sub = next((s for s in SUBJECTS_DB if s["id"] == payload.subjectId), SUBJECTS_DB[0])

    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    ai_text = ""

    # Real Google Gemini API Call
    if gemini_key:
        try:
            system_instruction = (
                f"Sen VOXY ta'lim platformasining professional {sub['name']} o'qituvchisisan. "
                f"Foydalanuvchiga o'zbek tilida, tushunarli, aniq formulalar, qadam-baqadam yechimlar va "
                f"amaliy misollar bilan yordam ber. Javobing chiroyli va qulay formatda bo'lsin."
            )

            prompt = f"Mavzu/Fan: {sub['name']}\nSavol: {payload.question}\n\nIltimos batafsil va aniq tushuntirib ber."

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
        except Exception as e:
            print("Gemini API error (falling back to local):", e)

    # Fallback to local subject knowledge if API is unreachable
    if not ai_text:
        q_lower = payload.question.lower()
        if "tenglama" in q_lower or "diskriminant" in q_lower:
            ai_text = (
                "Kvadrat tenglamani yechish bo'yicha tushuntirish:\n\n"
                "ax² + bx + c = 0 formulasi bo'yicha:\n"
                "1. D = b² - 4ac (Diskriminant topiladi)\n"
                "2. Agar D > 0 bo'lsa, x₁,₂ = (-b ± √D) / 2a\n"
                "Misol: x² - 5x + 6 = 0 bo'lganda D = 25 - 24 = 1. Ildizlar: x₁=3, x₂=2."
            )
        elif "nyuton" in q_lower or "kuch" in q_lower:
            ai_text = (
                "Nyutonning II qonuni:\n\n"
                "Formula: F = m · a\n"
                "Jismga ta'sir qiluvchi kuch uning massasi va olgan tezlanishi ko'paytmasiga teng.\n"
                "Masalan: 4 kg jismni 5 m/s² tezlatish uchun 20 N kuch kerak."
            )
        else:
            ai_text = (
                f"{sub['name']} fani bo'yicha tahlil:\n\n"
                f"'{payload.question}' savoli bo'yicha eng muhim tushuncha — bu mavzuning amaliy formulalari va qoidalarini aniq qo'llashdir.\n"
                "Ushbu mavzuni mustahkamlash uchun VOXY Testlar bo'limida sinov testini yechishni tavsiya qilaman!"
            )

    # Log to MongoDB conversations if connected
    if db is not None:
        await db["ai_conversations"].insert_one({
            "subjectId": payload.subjectId,
            "question": payload.question,
            "response": ai_text,
            "timestamp": time.time()
        })

    return AIChatResponse(
        subjectId=payload.subjectId,
        response=ai_text,
        suggestedTopics=sub.get("sampleQuestions", [])
    )
