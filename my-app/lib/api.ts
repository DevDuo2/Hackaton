/**
 * VOXY Markaziy API Xizmati
 * Frontend so'rovlarini Render.com dagi backendga yoki lokal serverga yuboradi.
 */
import { clearSession, getToken } from './auth';
import { BACKEND_URL } from './backendUrl';

export const API_BASE_URL = BACKEND_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(
      "Server bilan bog'lanib bo'lmadi. Internet aloqasini tekshirib, qaytadan urinib ko'ring.",
      0
    );
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    // Token eskirgan yoki yaroqsiz — sessiyani tozalaymiz, chaqiruvchi login'ga yuboradi.
    if (res.status === 401) clearSession();
    throw new ApiError(
      errData.detail || errData.error || `Xatolik: ${res.status}`,
      res.status
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface AIChatResponse {
  subjectId: string;
  response: string;
  suggestedTopics: string[];
  /** "gemini" — haqiqiy model javobi, "offline" — serverdagi zaxira bilim bazasi. */
  source: 'gemini' | 'offline';
}

export function askAiTutorApi(
  subjectId: string,
  question: string
): Promise<AIChatResponse> {
  return apiRequest<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ subjectId, question }),
  });
}

export interface AIStatus {
  configured: boolean;
  model: string | null;
  fallback: string;
}

/** AI haqiqatan ulanganmi — foydalanuvchiga ochiq aytish uchun. */
export function fetchAiStatus(): Promise<AIStatus> {
  return apiRequest<AIStatus>('/api/ai/status');
}

export interface AdminStats {
  totalStudents: number;
  totalSubjects: number;
  totalCourses: number;
  activeUsersNow: number;
  database: string;
  serverStatus: string;
}

export function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>('/api/admin/stats');
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface DailyQuiz {
  subjectId: string;
  subject: string;
  quizzes: QuizQuestion[];
}

/** Savollar backenddan keladi; to'g'ri javob javobda yuborilmaydi. */
export function fetchDailyQuiz(subjectId: string): Promise<DailyQuiz> {
  return apiRequest<DailyQuiz>(`/api/quizzes/daily?subjectId=${encodeURIComponent(subjectId)}`);
}

export interface QuizResult {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
  earnedXP: number;
  /** Bu savolga avval javob berilgan — XP qayta qo'shilmaydi. */
  alreadyAnswered: boolean;
  /** Serverdagi yangi jami XP. */
  totalXP: number;
  message: string;
}

/** Javobni serverda tekshiradi va XP ni profilga yozadi (token orqali). */
export function submitQuizAnswer(
  subjectId: string,
  questionId: number,
  selectedOption: number
): Promise<QuizResult> {
  return apiRequest<QuizResult>('/api/quizzes/submit', {
    method: 'POST',
    body: JSON.stringify({ subjectId, questionId, selectedOption }),
  });
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  totalXP?: number;
  answeredCount?: number;
  /** Admin akkauntini talabalar sonidan chiqarib tashlash uchun kerak. */
  role?: 'student' | 'admin';
}

export function fetchLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest<{ leaderboard: LeaderboardEntry[] }>('/api/quizzes/leaderboard');
}

export interface ProfileUpdate {
  name?: string;
  language?: string;
  notifications?: boolean;
  selectedSubject?: string;
}

export function updateProfileApi(changes: ProfileUpdate) {
  return apiRequest<{ success: boolean; user: Record<string, unknown>; message: string }>(
    '/api/auth/me',
    { method: 'PATCH', body: JSON.stringify(changes) }
  );
}

export interface SubjectProgress {
  subjectId: string;
  name: string;
  iconSymbol?: string;
  color?: string;
  answered: number;
  total: number;
}

/** Fanlar bo'yicha haqiqiy o'zlashtirish — faqat o'z profilida qaytariladi. */
export interface ProgressSummary {
  answeredCount: number;
  totalQuestions: number;
  bySubject: SubjectProgress[];
}

export interface MeResponse {
  authenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    selectedSubject?: string;
    avatar: string;
    totalXP?: number;
    streakDays?: number;
    /** Javob berilgan test savollari soni. */
    answeredCount?: number;
  };
  progress?: ProgressSummary;
}

export function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/api/auth/me');
}

export interface SubjectCatalogueEntry {
  id: string;
  name: string;
  iconSymbol?: string;
  color?: string;
  description?: string;
  topicsCount?: number;
  studentsCount?: number;
  sampleQuestions?: string[];
  /** Fan bo'yicha mavjud test savollari soni (javoblar yuborilmaydi). */
  quizCount: number;
}

export function fetchSubjects(): Promise<{ subjects: SubjectCatalogueEntry[] }> {
  return apiRequest<{ subjects: SubjectCatalogueEntry[] }>('/api/subjects/');
}

export interface AdminStudent {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  selectedSubject?: string;
  avatar?: string;
  totalXP?: number;
  streakDays?: number;
  answeredCount?: number;
}

/** Admin tokeni talab qiladi; backend rolni qaytadan tekshiradi. */
export function fetchAdminStudents(): Promise<{ students: AdminStudent[] }> {
  return apiRequest<{ students: AdminStudent[] }>('/api/admin/students');
}

export interface PlatformSettings {
  platformName: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
}

/** Admin tokeni talab qiladi; backend rolni qaytadan tekshiradi. */
export function fetchPlatformSettings(): Promise<{ settings: PlatformSettings }> {
  return apiRequest<{ settings: PlatformSettings }>('/api/admin/settings');
}

/**
 * Sozlamalarni saqlaydi va bazadan QAYTA O'QILGAN holatni qaytaradi.
 * Shuning uchun UI «Saqlandi» deb ko'rsatsa, u haqiqatan saqlangan bo'ladi.
 */
export function savePlatformSettings(
  changes: Partial<PlatformSettings>
): Promise<{ success: boolean; settings: PlatformSettings; message: string }> {
  return apiRequest('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(changes),
  });
}

export interface HealthStatus {
  status?: string;
  database?: string;
}

/**
 * Backend haqiqatan javob beryaptimi. Admin paneldagi holat belgisi shu
 * so'rovga tayanadi: ilgari u «Live Telemetry: 100% Operational» deb qotib
 * yozilgan edi va backend o'lgan bo'lsa ham yashil turardi.
 */
export function fetchHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/api/health');
}

export interface AdminQuizQuestion {
  id: number;
  subjectId: string;
  subjectName: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * To'liq savollar banki — javoblari bilan. Admin tokeni talab qiladi.
 * Ilgari bu sahifa `data/mockData.ts` dan o'qir edi va to'g'ri javoblar
 * brauzer bundli orqali har qanday tashrifchiga ochiq bo'lardi.
 */
export function fetchAdminQuizzes(): Promise<{ questions: AdminQuizQuestion[] }> {
  return apiRequest<{ questions: AdminQuizQuestion[] }>('/api/admin/quizzes');
}
