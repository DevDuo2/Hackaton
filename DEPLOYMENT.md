# 🌐 VOXY Platformasini Internetga (Deploy) Chiqarish Qo'llanmasi

Ushbu qo'llanma orqali VOXY platformasining Frontend va Backend qismlarini bepul, 100% barqaror va 5 daqiqa ichida internetga chiqarishingiz mumkin.

---

## 🏗️ Arxitektura Xaritasi

* **Frontend (Next.js):** ➔ [Render.com](https://render.com) (yoki [Vercel](https://vercel.com))
* **Backend (FastAPI):** ➔ [Render.com](https://render.com) (Jonli: `https://hackaton-xl22.onrender.com`, Swagger: `/docs`)
* **Ovozli tyutor + Telegram bot + Mini App:** ➔ Render.com bepul Web Service (`voxy-voice`), bot shu jarayon ichida — 4.5-qadam
* **Repozitoriy:** `https://github.com/DevDuo2/Hackaton.git`

> **Repoda ikkita backend bor.** Sayt REST API — `backend/` papkasi (bu qo'llanma
> shu haqida). Telegram Mini App uchun ovozli tyutor — repo ildizidagi `app/`
> papkasi; uni alohida deploy qilish `docs/deployment.md` da yozilgan. Ikkalasining
> ishga tushirish moduli ham `app.main:app` deb ataladi, farqi — **Root Directory**
> da, shuning uchun uni to'g'ri ko'rsatish majburiy.

---

## 1-QADAM: Kodlarni GitHub ga Yuklash (Push)

Terminalda barcha oxirgi o'zgarishlarni GitHub ga yuboramiz:

```powershell
git add .
git commit -m "feat: complete VOXY multi-subject platform with Next.js frontend and FastAPI backend"
git push origin main
```

---

## 2-QADAM: Frontendni Render.com ga Chiqarish (Web Service)

1. [render.com](https://render.com) Dashboardiga kiring.
2. **"New +"** ➔ **"Web Service"** tugmasini bosing.
3. `DevDuo2/Hackaton` repozitoriyasini tanlang.
4. Quyidagi parametrlarni to'ldiring:
   * **Name:** `voxy-frontend` (yoki xohlagan nom)
   * **Region:** Frankfurt (Europe) yoki o'zingizga yaqin
   * **Root Directory:** `my-app` (MUHIM! Monorepo bo'lgani uchun)
   * **Runtime:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm run start`
   * **Instance Type:** `Free`
5. **Environment Variables** bo'limida qo'shing:
   * **Key:** `NEXT_PUBLIC_API_URL`
   * **Value:** `https://hackaton-xl22.onrender.com` (Jonli Render API manzilingiz)
6. **"Deploy Web Service"** tugmasini bosing!

---

## 2.1-VARIANT: Frontendni Vercel'ga Chiqarish (Muqobil)

1. [vercel.com](https://vercel.com) saytiga kiring va **GitHub orqali tizimga kiring**.
2. **"Add New..."** ➔ **"Project"** ➔ `DevDuo2/Hackaton` ni **Import** qiling.
3. **Root Directory:** `my-app` qilib tanlang.
4. **Environment Variables:** `NEXT_PUBLIC_API_URL` = `https://hackaton-xl22.onrender.com`
5. **"Deploy"** tugmasini bosing!

---

## 3-QADAM: Backendni Render.com ga Chiqarish (3 daqiqa)

1. [render.com](https://render.com) saytiga kiring va GitHub orqali kiring.
2. **"New +"** ➔ **"Web Service"** tugmasini bosing.
3. `DevDuo2/Hackaton` repozitoriyasini tanlang.
4. Quyidagi parametrlarni kiriting:
   * **Name:** `voxy-api`
   * **Region:** Frankfurt (Europe) yoki o'zingizga yaqin region
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type:** `Free`
5. **Environment Variables** bo'limini to'ldiring (bularsiz server ishga tushmaydi yoki himoyasiz qoladi):

   | Key | Value | Izoh |
   |---|---|---|
   | `APP_ENV` | `production` | Zaif JWT kaliti bilan ishga tushishni to'xtatadi |
   | `JWT_SECRET` | tasodifiy 48+ belgi | `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
   | `MONGO_URI` | Atlas havolangiz | Repoga **yozilmaydi** |
   | `GEMINI_API_KEY` | AI Studio kaliti | AI Tutor matnli chati uchun |
   | `CORS_ORIGINS` | frontend manzili | Masalan `https://voxy-frontend.onrender.com` |

6. **"Deploy Web Service"** tugmasini bosing!
7. 🎉 **Natija:** Backend serveringiz `https://voxy-api.onrender.com` manzili ostida ishga tushadi, uning Swagger hujjatlari esa `https://voxy-api.onrender.com/docs` manzilida ochiladi!

---

## 4-QADAM: Frontend va Backendni Bog'lash

Vercel loyihangizning **Settings** ➔ **Environment Variables** bo'limiga kiring:
* **Key:** `NEXT_PUBLIC_API_URL`
* **Value:** `https://voxy-api.onrender.com` (Renderdagi backend havolangiz)
* **Save** va **Redeploy** qilsangiz, frontend barcha so'rovlarni to'g'ridan-to'g'ri jonli backendga yuboradi!

---

## 4.5-QADAM: Ovozli tyutor + Telegram bot (BEPUL, doimiy)

Bu servis uchta ishni bajaradi: **Mini App** ni beradi, **Gemini Live** ovozli
suhbatini olib boradi va **Telegram botni** yurgizadi.

Render bepul tarifda alohida «Background Worker» bermaydi, shuning uchun bot
veb-servis jarayonining ichida ishlaydi (`RUN_BOT_IN_WEB=true`).

1. **New +** ➔ **Web Service** ➔ shu repozitoriy.
2. Parametrlar:
   * **Name:** `voxy-voice` (nomni o'zgartirsangiz, `MINI_APP_URL` ni ham o'zgartirasiz!)
   * **Root Directory:** bo'sh qoldiring (repo ildizi)
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:**
     ```
     uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --proxy-headers --no-access-log --timeout-graceful-shutdown 20
     ```
   * **Instance Type:** `Free`
3. **Environment Variables:**

   | Key | Value | Izoh |
   |---|---|---|
   | `APP_ENV` | `production` | |
   | `RUN_BOT_IN_WEB` | `true` | bot shu jarayonda ishlaydi |
   | `MINI_APP_URL` | `https://voxy-voice.onrender.com/miniapp/` | servis nomiga mos bo'lishi SHART |
   | `BACKEND_URL` | `https://voxy-voice.onrender.com` | |
   | `BOT_TOKEN` | BotFather'dan olingan token | **repoga yozilmaydi** |
   | `GEMINI_API_KEY` | AI Studio kaliti | **repoga yozilmaydi** |
   | `FORWARDED_ALLOW_IPS` | `*` | Render proksisi ortida TLS |
   | `PYTHON_VERSION` | `3.12.2` | |

4. **Deploy** bosing. Loglarda shunday qator chiqishi kerak:
   ```
   voxy.bot: Bot jarayon ichida ishlayapti: @<bot_username> (mini app: https://...)
   ```

### ⚠️ Bepul tarifning uxlab qolishi — eng muhim nuqta

Render bepul veb-servis **15 daqiqa so'rovsiz turgach uxlaydi**, ya'ni bot ham
to'xtaydi. Buni oldini olish uchun bepul cron bilan har 10 daqiqada
`https://voxy-voice.onrender.com/api/health` manzilini chaqirtirib qo'yish kerak:

* [cron-job.org](https://cron-job.org) yoki [UptimeRobot](https://uptimerobot.com) — ikkisi ham bepul.
* Interval: 10 daqiqa. URL: `/api/health` (yengil, bazaga tegmaydi).
* Bepul tarif oyiga 750 soat beradi — bitta servis uchun doimiy ishlashga yetadi.

Uxlab qolgan vaqtda kelgan xabarlar yo'qolmaydi: bot uyg'ongach ularga javob
beradi (`drop_pending_updates=False`).

### Bir vaqtda faqat BITTA polling

Telegram bitta botga ikkita `getUpdates` oqimini ruxsat bermaydi (`Conflict` xatosi).
Shuning uchun:

* `--workers 1` — majburiy (tiketlar va bot bitta jarayonda);
* lokalda `python -m app.bot` ishlab turganda, Render'dagi servisni to'xtatib qo'ying (yoki aksincha);
* webhook o'rnatmang — long polling ishlatiladi.

### BotFather sozlamalari

Botga Mini App tugmasi qo'shish uchun:
```
/setmenubutton  ->  botni tanlang  ->  URL: https://voxy-voice.onrender.com/miniapp/
```
`/start` va `/help` buyruqlari ro'yxati bot ishga tushganda avtomatik yoziladi.

---

## 🏆 Hakamlarga Taqdimot Qilishda:
* **Asosiy sayt havolasi:** `https://voxy-hackaton.vercel.app`
* **Jonli API hujjatlari:** `https://voxy-api.onrender.com/docs`
* **Telegram Bot:** `https://t.me/lockbridge_bot`
