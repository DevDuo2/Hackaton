'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SUBJECTS } from '../../data/mockData';
import {
  ApiError,
  fetchDailyQuiz,
  fetchLeaderboard,
  fetchMe,
  submitQuizAnswer,
  type LeaderboardEntry,
  type QuizQuestion,
  type QuizResult,
} from '../../lib/api';
import { SUBJECT_KEY, getSession } from '../../lib/auth';
import { useStoredString } from '../../lib/clientStore';

/** Yuklangan test — qaysi fanga tegishli ekani bilan birga saqlanadi. */
interface LoadedQuiz {
  subjectId: string;
  questions: QuizQuestion[];
}

export default function GamesPage() {
  const activeSubjectId = useStoredString(SUBJECT_KEY) ?? 'matematika';
  const [loaded, setLoaded] = useState<LoadedQuiz | null>(null);
  const [loadError, setLoadError] = useState<{ subjectId: string; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // Javob serverda tekshiriladi: to'g'ri variant va izoh shu javobdan keladi.
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [profile, setProfile] = useState<{ totalXP?: number; streakDays?: number }>({});
  // false = /api/auth/me javob bermadi, demak ko'rsatkichlar noma'lum.
  const [profileKnown, setProfileKnown] = useState(false);
  const [leaders, setLeaders] = useState<LeaderboardEntry[] | null>(null);

  // Holatlar hisoblab olinadi: shu tufayli effekt ichida sinxron setState yo'q.
  const questions = loaded?.subjectId === activeSubjectId ? loaded.questions : [];
  const errorForSubject =
    loadError?.subjectId === activeSubjectId ? loadError.message : null;
  const isLoading = loaded?.subjectId !== activeSubjectId && !errorForSubject;

  /** Noma'lum ko'rsatkich «—» bo'lib chiqadi, soxta nol emas. */
  const statOrDash = (value: number | undefined) =>
    !profileKnown || value === undefined ? '—' : value.toLocaleString('uz-UZ');

  // Savollar backenddan olinadi — XP ham shu savol id lari bo'yicha hisoblanadi.
  useEffect(() => {
    let cancelled = false;
    fetchDailyQuiz(activeSubjectId)
      .then((data) => {
        if (cancelled) return;
        setLoaded({ subjectId: activeSubjectId, questions: data.quizzes });
        // Muvaffaqiyatli yuklanganda eski xato TOZALANADI. Aks holda: fan A
        // bir marta xato bergan bo'lsa, keyin unga qaytib kelganda so'rov
        // o'tib ketsa ham `loadError` o'sha fan uchun saqlanib turardi va
        // yuklangan savollar ustini xato ekrani bosib qolardi.
        setLoadError(null);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setResult(null);
        setScore(0);
        setQuizFinished(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError({
          subjectId: activeSubjectId,
          message: err instanceof ApiError ? err.message : "Savollarni yuklab bo'lmadi.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [activeSubjectId, retryCount]);

  const refreshProgress = () => {
    fetchMe()
      .then((data) => {
        setProfile(data.user);
        setProfileKnown(true);
      })
      // Xato bo'lsa ko'rsatkich NOMA'LUM bo'lib qoladi. Ilgari bu yerda
      // `setProfile({})` turardi va `?? 0` tufayli sarlavhada ishonchli
      // «0 Kunlik Seriya · 0 XP» chiqardi — ya'ni yuklanmagan ma'lumot
      // nol natija bo'lib ko'rinardi.
      .catch(() => setProfileKnown(false));
    fetchLeaderboard()
      .then((data) => setLeaders(data.leaderboard))
      .catch(() => setLeaders([]));
  };

  useEffect(() => {
    refreshProgress();
  }, []);

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (result) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !currentQ || isChecking) return;
    setIsChecking(true);
    setCheckError(null);
    try {
      const checked = await submitQuizAnswer(activeSubjectId, currentQ.id, selectedAnswer);
      setResult(checked);
      setScore((prev) => prev + checked.earnedXP);
      // Jami XP serverda hisoblanadi — sarlavhadagi ko'rsatkichni darhol yangilaymiz.
      setProfile((prev) => ({ ...prev, totalXP: checked.totalXP }));
    } catch (err) {
      setCheckError(
        err instanceof ApiError ? err.message : "Javobni tekshirib bo'lmadi."
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setResult(null);
    } else {
      setQuizFinished(true);
      refreshProgress(); // XP serverda o'zgardi — ko'rsatkichlarni qaytadan olamiz
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setResult(null);
    setCheckError(null);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentSubject.iconSymbol}</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                {currentSubject.name} Sinov Testlari
              </h1>
              <Badge variant="blue" size="sm">
                Daraja Testi
              </Badge>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              {currentSubject.name} bo&apos;yicha bilimlaringizni sinang, ballar to&apos;plang va reytingda ko&apos;tariling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Ko'rsatkichlar profildan olinadi, qotib qolgan son emas. */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 text-xs font-bold">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{statOrDash(profile.streakDays)} Kunlik Seriya</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#8B5CF6] text-xs font-bold">
              <Zap className="w-4 h-4 fill-[#8B5CF6]" />
              <span>{statOrDash(profile.totalXP)} XP</span>
            </div>
          </div>
        </div>

        {/* Quiz Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6 sm:p-8 flex flex-col justify-between min-h-[480px]">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
                <p className="text-sm font-semibold text-[#64748B]">Savollar yuklanmoqda...</p>
              </div>
            ) : errorForSubject ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <XCircle className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-[#1E293B]">{errorForSubject}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoadError(null);
                    setRetryCount((c) => c + 1);
                  }}
                >
                  Qayta urinish
                </Button>
              </div>
            ) : questions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-[#64748B] flex items-center justify-center">
                  <Sparkles className="w-7 h-7" />
                </div>
                <p className="text-sm font-semibold text-[#1E293B]">
                  {currentSubject.name} bo&apos;yicha test savollari hali qo&apos;shilmagan.
                </p>
              </div>
            ) : !quizFinished && currentQ ? (
              <>
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                        {currentSubject.name} Savol-Javob
                      </span>
                      <p className="text-xs text-[#64748B]">
                        Savol {currentQuestionIndex + 1} / {questions.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1E293B] bg-slate-100 px-3 py-1 rounded-lg">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Vaqt cheklanmagan</span>
                    </div>
                  </div>

                  <ProgressBar
                    value={currentQuestionIndex + 1}
                    max={questions.length}
                    color="blue"
                    size="sm"
                    className="mb-6"
                  />

                  <h3 className="text-lg sm:text-xl font-bold text-[#1E293B] mb-6 leading-snug">
                    {currentQ.question}
                  </h3>

                  <div className="space-y-3">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === result?.correctIndex;

                      let btnStyle =
                        'bg-white border-slate-200 text-[#1E293B] hover:border-[#2563EB] hover:bg-blue-50/20';

                      if (isSelected) {
                        btnStyle = 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] ring-2 ring-blue-500/20';
                      }

                      if (result) {
                        if (isCorrect) {
                          btnStyle = 'border-[#16A34A] bg-emerald-50 text-[#16A34A] ring-2 ring-emerald-500/20';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-600';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 text-[#64748B] flex items-center justify-center font-bold text-xs shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {result && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                          )}
                          {result && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {result && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-[#1E293B] space-y-1 animate-fade-in">
                      <span className="font-bold text-[#2563EB]">Izoh:</span>
                      <p>{result.explanation}</p>
                      {result.alreadyAnswered && (
                        <p className="pt-1 text-[#64748B] font-semibold">{result.message}</p>
                      )}
                    </div>
                  )}

                  {checkError && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
                      {checkError}
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Yig&apos;ilgan ball: <strong className="text-[#2563EB]">{score} XP</strong>
                  </span>

                  {!result ? (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={selectedAnswer === null || isChecking}
                      onClick={handleSubmitAnswer}
                    >
                      {isChecking ? 'Tekshirilmoqda...' : 'Javobni Tasdiqlash'}
                    </Button>
                  ) : (
                    <Button variant="primary" size="md" onClick={handleNext}>
                      {currentQuestionIndex + 1 < questions.length
                        ? 'Keyingi Savol'
                        : 'Natijani Ko\'rish'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Trophy className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1E293B]">
                    Ajoyib! {currentSubject.name} testi yakunlandi!
                  </h3>
                  <p className="text-sm text-[#64748B] mt-1">
                    Siz <strong>{score}</strong> ball to&apos;pladingiz!
                  </p>
                </div>

                {/* XP server tomonida hisoblanadi; har bir savol uchun bir marta. */}
                {score > 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl max-w-sm mx-auto border border-emerald-100 text-xs text-[#16A34A] font-semibold">
                    +{score} XP profilingizga yozildi · Jami:{' '}
                    {statOrDash(profile.totalXP)} XP
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl max-w-sm mx-auto border border-slate-200 text-xs text-[#64748B] font-semibold">
                    Bu savollarga avval javob bergansiz — XP qayta qo&apos;shilmadi. Jami:{' '}
                    {statOrDash(profile.totalXP)} XP
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <Button variant="primary" onClick={handleRestart} icon={<RotateCcw className="w-4 h-4" />}>
                    Qayta Yechish
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Leaderboard */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-[#1E293B] mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Haftalik Peshqadamlar
              </h3>
              {leaders === null ? (
                <div className="flex items-center gap-2 text-xs text-[#64748B] py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                  <span>Reyting yuklanmoqda...</span>
                </div>
              ) : leaders.length === 0 ? (
                <p className="text-xs text-[#64748B] py-4">
                  Reytingni hozir olib bo&apos;lmadi. Keyinroq yangilanadi.
                </p>
              ) : (
                <div className="space-y-3">
                  {leaders.slice(0, 5).map((u, idx) => {
                    const isUser = u.id === getSession()?.id;
                    return (
                      <div
                        key={u.id ?? idx}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
                          isUser
                            ? 'bg-blue-50/70 border-blue-200 text-[#2563EB]'
                            : 'border-slate-100 text-[#1E293B]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-center text-[#64748B]">#{idx + 1}</span>
                          {u.avatar && (
                            <Image
                              src={u.avatar}
                              alt={u.name}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                              width={28}
                              height={28}
                            />
                          )}
                          <span className="truncate">
                            {u.name}
                            {isUser ? ' (Siz)' : ''}
                          </span>
                        </div>
                        <span className="shrink-0">
                          {(u.totalXP ?? 0).toLocaleString('uz-UZ')} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
