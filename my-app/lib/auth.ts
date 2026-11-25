/**
 * Brauzer tarafidagi sessiya: token va profil localStorage da saqlanadi.
 * Haqiqiy tekshiruv backendda (JWT imzosi) — bu fayl faqat UI uchun holat.
 */

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  selectedSubject?: string;
  avatar: string;
  username?: string;
  totalXP?: number;
  streakDays?: number;
  answeredCount?: number;
}

export const USER_KEY = 'voxy_auth_user';
export const TOKEN_KEY = 'voxy_auth_token';

/** Sessiya o'zgarganda layout va sahifalar o'zini yangilashi uchun signal. */
export const PROFILE_UPDATED_EVENT = 'voxy_profile_updated';
/** Tanlangan fan o'zgarganda. */
export const SUBJECT_CHANGED_EVENT = 'voxy_subject_changed';
export const SUBJECT_KEY = 'voxy_active_subject';

export function saveSession(user: UserSession, token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function getSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    // Buzilgan yozuv — sessiyani tozalaymiz, aks holda har safar xato beradi.
    clearSession();
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getSession() && getToken());
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

/** Tanlangan fanni saqlaydi va kuzatuvchilarni xabardor qiladi. */
export function setActiveSubject(subjectId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SUBJECT_KEY, subjectId);
  window.dispatchEvent(new Event(SUBJECT_CHANGED_EVENT));
}
