/**
 * Next route handlerlari FastAPI backendga shunchaki proxy bo'ladi.
 *
 * Ilgari bu yerda `data/users.json` ga `fs.writeFileSync` qiluvchi ikkinchi
 * autentifikatsiya yo'li bor edi: Render'da fayl tizimi vaqtinchalik
 * (ro'yxatdan o'tganlar har deployda yo'qolardi) va parollar ochiq matnda
 * yotardi. Endi yagona manba — backend.
 */

import { BACKEND_URL } from './backendUrl';

export { BACKEND_URL };

type ProxyResult = {
  status: number;
  body: Record<string, unknown>;
};

/**
 * Chaqiruvchining haqiqiy IP sini backendga uzatish uchun sarlavhalar.
 *
 * Buni uzatmasak, backend uchun BUTUN sayt bitta mijozga aylanadi (Next
 * serverining o'zi) va `client_key()` hammani bitta kalitga yig'adi: bir
 * odamning xato urinishlari qolganlarni ham bloklab qo'yardi.
 */
export function forwardedFor(request: Request): Record<string, string> {
  const chain = request.headers.get('x-forwarded-for');
  const direct = request.headers.get('x-real-ip');
  const ip = chain?.split(',')[0]?.trim() || direct?.trim();
  return ip ? { 'x-forwarded-for': ip } : {};
}

/** FastAPI `detail` ni frontend kutadigan `error` ga aylantiradi. */
function normalizeError(data: Record<string, unknown>, status: number): Record<string, unknown> {
  const detail = data?.detail ?? data?.error;

  if (typeof detail === 'string') return { error: detail };

  // Pydantic validatsiya xatosi: detail — [{ loc, msg, type }] ko'rinishida.
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    if (first?.msg) return { error: String(first.msg) };
  }

  return { error: `Serverda xatolik yuz berdi (${status})` };
}

export async function proxyJson(
  path: string,
  init: RequestInit & { headers?: Record<string, string> } = {}
): Promise<ProxyResult> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
      cache: 'no-store',
    });
  } catch (e) {
    console.error(`Backend ga ulanib bo'lmadi [${path}]:`, e);
    return {
      status: 503,
      body: {
        error:
          "Server hozir javob bermayapti. Bir necha soniyadan keyin qaytadan urinib ko'ring.",
      },
    };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return { status: res.status, body: normalizeError(data, res.status) };
  }
  return { status: res.status, body: data };
}
