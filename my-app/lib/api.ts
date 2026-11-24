/**
 * VOXY Markaziy API Xizmati
 * Frontend so'rovlarini Render.com dagi backendga yoki lokal serverga yuboradi.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `Xatolik: ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
