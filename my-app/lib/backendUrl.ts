/**
 * Backend manzili — YAGONA manba.
 *
 * Ilgari bu literal ikki joyda takrorlangan edi (lib/api.ts va lib/proxy.ts) va
 * ikkisi ham `https://hackaton-xl22.onrender.com` ga ishora qilardi. U eski,
 * 2.0.0 versiyali deploy: unda admin endpointlari himoyasiz, `/api/auth/me`
 * tokensiz ham admin akkauntini qaytaradi, parollar esa ochiq matnda yotadi.
 * my-app da `.env` fayli bo'lmaganligi uchun `npm run dev` ham shu serverga
 * ulanardi — ya'ni muammo faqat deployda emas, lokalda ham bor edi.
 *
 * Endi sukut bo'yicha — lokal backend (backend/.env.example: PORT=8001).
 * Deployda NEXT_PUBLIC_API_URL ko'rsatilishi SHART.
 */

/** backend/.env.example dagi PORT=8001 bilan bir xil. */
const LOCAL_BACKEND = 'http://localhost:8001';

function resolveBackendUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;

  if (process.env.NODE_ENV === 'production') {
    // Jimgina boshqa serverga ulanib ketgandan ko'ra, muammoni darhol
    // ko'rsatish yaxshiroq: aynan shu jimlik tufayli sayt haftalar davomida
    // eski backendga ulanib yurgan va buni hech kim sezmagan.
    console.error(
      '[VOXY] NEXT_PUBLIC_API_URL sozlanmagan! Frontend backendni topa olmaydi. ' +
        'Render dashboardida (yoki .env.local da) backend manzilini ko\'rsating. ' +
        `Hozir zaxira sifatida ${LOCAL_BACKEND} ishlatiladi.`
    );
  }

  return LOCAL_BACKEND;
}

export const BACKEND_URL = resolveBackendUrl();
