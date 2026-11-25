'use client';

/**
 * Savollar banki (admin).
 *
 * Ilgari bu sahifa `data/mockData.ts` dagi MOCK_QUIZ_QUESTIONS dan o'qir edi.
 * U fayl brauzer bundliga tushadi, demak to'g'ri javoblar HAR QANDAY
 * tashrifchiga ochiq bo'lardi — backend `correctIndex` ni /api/quizzes/daily
 * javobidan ataylab olib tashlagani behuda ketardi.
 *
 * Endi ma'lumot `/api/admin/quizzes` dan keladi: endpoint admin tokenini
 * talab qiladi va javoblar faqat administrator brauzeriga yetib boradi.
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Plus, Sparkles } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';
import {
  ApiError,
  fetchAdminQuizzes,
  type AdminQuizQuestion,
} from '../../../lib/api';

export default function AdminQuizzesPage() {
  const [questions, setQuestions] = useState<AdminQuizQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminQuizzes()
      .then(({ questions: loaded }) => {
        if (!cancelled) setQuestions(loaded);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Savollar bankini yuklab bo'lmadi."
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                AI Savollar &amp; Testlar Banki
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                {questions === null ? 'Yuklanmoqda...' : `${questions.length} ta savol`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Talabalar yechadigan haqiqiy savollar. Javoblar faqat shu sahifada
              ko&apos;rinadi — ochiq API ularni yubormaydi.
            </p>
          </div>

          {/* Savol qo'shish backendda hali yo'q. Tugma ataylab o'chirilgan va
              sababi aytilgan: ishlayotgandek ko'rinib, bosilganda hech narsa
              qilmaslik — eng yomon variant. */}
          <Button
            variant="primary"
            size="sm"
            disabled
            title="Savol qo'shish demo doirasiga kirmaydi: backendda bunday endpoint yo'q"
            icon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
          >
            Yangi Savol Qo&apos;shish
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl bg-amber-950/30 border border-amber-800/50 px-4 py-3 text-sm text-amber-200"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {questions === null && !error && (
          <div
            className="flex items-center gap-2 text-sm text-slate-300 py-10 justify-center"
            aria-busy="true"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Savollar banki yuklanmoqda...
          </div>
        )}

        {questions !== null && questions.length === 0 && (
          <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-10 text-center">
            <p className="text-sm font-semibold text-slate-200">
              Savollar banki bo&apos;sh
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Baza seed qilinmagan bo&apos;lishi mumkin — backendni qaytadan
              ishga tushirib ko&apos;ring.
            </p>
          </div>
        )}

        {questions !== null && questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-md"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 border border-blue-800/50 text-xs font-bold">
                      Savol #{idx + 1}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 text-xs font-semibold">
                      {q.subjectName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      id: {q.id}
                    </span>
                  </div>

                  <h2 className="text-sm sm:text-base font-bold text-white break-words">
                    {q.question}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          i === q.correctIndex
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200 font-bold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="break-words min-w-0">{opt}</span>
                        {i === q.correctIndex && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <div className="min-w-0 break-words">
                        <strong className="text-slate-200">Izoh:</strong>{' '}
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
