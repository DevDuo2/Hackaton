/**
 * localStorage dagi holatni render vaqtida xavfsiz o'qish uchun hooklar.
 *
 * Ilgari har bir sahifa `useEffect` ichida localStorage o'qib `setState` qilardi —
 * bu qo'shimcha render zanjirini keltirib chiqaradi (react-hooks/set-state-in-effect).
 * `useSyncExternalStore` — React ning tashqi o'zgaruvchan holat uchun rasmiy yo'li:
 * server renderda `getServerSnapshot` ishlaydi, brauzerda esa haqiqiy qiymat.
 */
'use client';

import { useSyncExternalStore } from 'react';

import {
  PROFILE_UPDATED_EVENT,
  SUBJECT_CHANGED_EVENT,
  TOKEN_KEY,
  USER_KEY,
  type UserSession,
} from './auth';

const WATCHED_EVENTS = ['storage', PROFILE_UPDATED_EVENT, SUBJECT_CHANGED_EVENT];

function subscribe(onStoreChange: () => void): () => void {
  WATCHED_EVENTS.forEach((event) => window.addEventListener(event, onStoreChange));
  return () => WATCHED_EVENTS.forEach((event) => window.removeEventListener(event, onStoreChange));
}

/** Satr qiymat — primitiv, shuning uchun qo'shimcha keshlash kerak emas. */
export function useStoredString(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null
  );
}

// useSyncExternalStore har renderda bir xil havolani talab qiladi, aks holda
// cheksiz render bo'ladi — shuning uchun JSON faqat matn o'zgarganda qayta o'qiladi.
let cachedRaw: string | null = null;
let cachedSession: UserSession | null = null;

function sessionSnapshot(): UserSession | null {
  const raw = localStorage.getItem(USER_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

export function useSession(): UserSession | null {
  return useSyncExternalStore(subscribe, sessionSnapshot, () => null);
}

export function useAuthToken(): string | null {
  return useStoredString(TOKEN_KEY);
}
