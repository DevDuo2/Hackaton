# 🌐 VOXY Platformasini Internetga (Deploy) Chiqarish Qo'llanmasi

Ushbu qo'llanma orqali VOXY platformasining Frontend va Backend qismlarini bepul, 100% barqaror va 5 daqiqa ichida internetga chiqarishingiz mumkin.

---

## 🏗️ Arxitektura Xaritasi

* **Frontend (Next.js):** ➔ [Render.com](https://render.com) (yoki [Vercel](https://vercel.com))
* **Backend (FastAPI):** ➔ [Render.com](https://render.com) (Jonli: `https://hackaton-xl22.onrender.com`, Swagger: `/docs`)
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
