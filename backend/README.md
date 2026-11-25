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
│   └── core/
│       ├── config.py        # Env sozlamalari (MONGO_URI, JWT_SECRET, CORS_ORIGINS)
│       ├── database.py      # MongoDB ulanishi + xotira zaxira rejimi
│       ├── security.py      # Parol hashi (pbkdf2) va JWT (HS256) tokenlar
│       └── users.py         # Foydalanuvchilar uchun yagona kirish nuqtasi
├── tests/                   # pytest: auth, himoyalangan endpointlar, CORS
├── requirements.txt         # Kerakli kutubxonalar (FastAPI, Uvicorn, Pydantic)
└── run.py                   # Bitta buyruq bilan serverni ishga tushirish
```

> **Diqqat:** repoda ikkita FastAPI ilovasi bor va ikkalasining moduli ham
> `app.main:app` deb ataladi. Bu — **sayt REST API** si (`backend/` papkasidan
> ishga tushiriladi, lokalda 8001-port). Ildizdagi `app/` esa Telegram Mini App
> uchun **ovozli tyutor** (8000-port).

---

## ⚡ Qanday Ishga Tushiriladi?

1. Kerakli paketlarni o'rnating:
```powershell
pip install -r requirements.txt
```

2. `.env` faylini tayyorlang (`.env.example` dan nusxa olib to'ldiring):
```powershell
copy .env.example .env
```

3. Backend serverni ishga tushiring:
```powershell
python run.py
```

Server ishga tushgach:
* **Server manzili:** `http://localhost:8001`
* **Interaktiv Swagger Hujjatlari (Test qilish uchun):** `http://localhost:8001/docs`
* **Redoc Hujjatlari:** `http://localhost:8001/redoc`

Hakatonda hakamlarga `http://localhost:8001/docs` manzilini ko'rsatsangiz, barcha 7 ta modulni bitta joyda bemalol tekshirib ko'rishlari mumkin!

---

## Autentifikatsiya

Parollar `pbkdf2_sha256` bilan hashlanadi, token esa HS256 JWT (`app/core/security.py`).

1. `POST /api/auth/login` yoki `POST /api/admin/login` javobida `token` keladi.
2. Himoyalangan endpointlarga shu token `Authorization: Bearer <token>` sarlavhasida yuboriladi.
3. Token imzosi va muddati (7 kun) serverda tekshiriladi.

Token talab qiladigan endpointlar: `/api/auth/me`, `/api/ai/chat`,
`/api/quizzes/submit`, `/api/subjects/select`, `/api/telegram/link-account`,
va butun `/api/admin/*` (bunda rol `admin` bo'lishi shart).

Demo akkauntlar: `student@voxy.edu / password123`, `admin / admin123`.

## Testlar

```powershell
python -m pytest
```

Testlar MongoDB'ga ulanmaydi — xotiradagi zaxira rejimda ishlaydi.
