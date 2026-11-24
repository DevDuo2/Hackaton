# 🚀 VOXY Backend API (Python & FastAPI)

VOXY platformasi uchun to'liq mustaqil, tezkor va interaktiv hujjatlarga ega **FastAPI** backend xizmati.

---

## 📁 Loyiha Strukturasi

```
backend/
├── app/
│   ├── main.py              # FastAPI dasturi, CORS va barcha routerlar ulanishi
│   ├── models/
│   │   └── schemas.py       # Pydantic orqali request/response modellar
│   ├── routers/
│   │   ├── auth.py          # /api/auth (Login, Register, Me)
│   │   ├── subjects.py      # /api/subjects (Fanlar katalogi, tanlash)
│   │   ├── courses.py       # /api/courses (Mavzular, o'quv dasturi)
│   │   ├── ai_tutor.py      # /api/ai (Fanga moslashtirilgan AI prompt tahlili)
│   │   ├── quizzes.py       # /api/quizzes (Kunlik testlar, XP, Leaderboard)
│   │   ├── telegram.py      # /api/telegram (Telegram Webhook va Ovozli Gateway)
│   │   └── admin.py         # /api/admin (Statistika, monitoring)
│   └── data/
│       └── database.py      # Fanlar, testlar va foydalanuvchilar ma'lumotlar bazasi
├── requirements.txt         # Kerakli kutubxonalar (FastAPI, Uvicorn, Pydantic)
└── run.py                   # Bitta buyruq bilan serverni ishga tushirish
```

---

## ⚡ Qanday Ishga Tushiriladi?

1. Kerakli paketlarni o'rnating:
```powershell
pip install -r requirements.txt
```

2. Backend serverni ishga tushiring:
```powershell
python run.py
```

Server ishga tushgach:
* **Server manzili:** `http://localhost:8000`
* **Interaktiv Swagger Hujjatlari (Test qilish uchun):** `http://localhost:8000/docs`
* **Redoc Hujjatlari:** `http://localhost:8000/redoc`

Hakatonda hakamlarga `http://localhost:8000/docs` manzilini ko'rsatsangiz, barcha 7 ta modulni bitta joyda bemalol tekshirib ko'rishlari mumkin!
