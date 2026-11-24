# 🌐 VOXY Platformasini Internetga (Deploy) Chiqarish Qo'llanmasi

Ushbu qo'llanma orqali VOXY platformasining Frontend va Backend qismlarini bepul, 100% barqaror va 5 daqiqa ichida internetga chiqarishingiz mumkin.

---

## 🏗️ Arxitektura Xaritasi

* **Frontend (Next.js):** ➔ [Vercel](https://vercel.com) (Bepul, eng tezkor CDN, avtomatik HTTPS)
* **Backend (FastAPI):** ➔ [Render.com](https://render.com) yoki [Railway.app](https://railway.app) (Python 3, avtomatik Swagger `/docs`, bepul Web Service)
* **Repozitoriy:** `https://github.com/DevDuo2/Hackaton.git`

---

## 1-QADAM: Kodlarni GitHub ga Yuklash (Push)

Terminalda barcha oxirgi o'zgarishlarni GitHub ga yuboramiz:

```powershell
git add .
git commit -m "feat: complete VOXY multi-subject platform with Next.js frontend and FastAPI backend"
git push origin main
```

---

## 2-QADAM: Frontendni Vercel'ga Chiqarish (2 daqiqa)

1. [vercel.com](https://vercel.com) saytiga kiring va **GitHub orqali tizimga kiring** (Log in with GitHub).
2. **"Add New..."** ➔ **"Project"** tugmasini bosing.
3. `DevDuo2/Hackaton` repozitoriyasini topib, **"Import"** tugmasini bosing.
4. **MUHIM SOZLAMA (Monorepo):**
   * **Root Directory** bo'limida **"Edit"** ni bosing va `my-app` papkasini tanlang!
   * Framework Preset: **Next.js** avtomatik tanlanadi.
5. **"Deploy"** tugmasini bosing!
6. 🎉 **1 daqiqada tayyor:** Saytingiz `https://voxy-hackaton.vercel.app` kabi jonli havola orqali butun dunyoga ochiladi!

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
5. **"Deploy Web Service"** tugmasini bosing!
6. 🎉 **Natija:** Backend serveringiz `https://voxy-api.onrender.com` manzili ostida ishga tushadi, uning Swagger hujjatlari esa `https://voxy-api.onrender.com/docs` manzilida ochiladi!

---

## 4-QADAM: Frontend va Backendni Bog'lash

Vercel loyihangizning **Settings** ➔ **Environment Variables** bo'limiga kiring:
* **Key:** `NEXT_PUBLIC_API_URL`
* **Value:** `https://voxy-api.onrender.com` (Renderdagi backend havolangiz)
* **Save** va **Redeploy** qilsangiz, frontend barcha so'rovlarni to'g'ridan-to'g'ri jonli backendga yuboradi!

---

## 🏆 Hakamlarga Taqdimot Qilishda:
* **Asosiy sayt havolasi:** `https://voxy-hackaton.vercel.app`
* **Jonli API hujjatlari:** `https://voxy-api.onrender.com/docs`
* **Telegram Bot:** `https://t.me/voxy_speaking_bot`
