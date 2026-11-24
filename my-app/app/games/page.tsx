'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { SUBJECTS } from '../../data/mockData';

export default function GamesPage() {
  const [activeSubjectId, setActiveSubjectId] = useState('matematika');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voxy_active_subject') : null;
    if (saved) setActiveSubjectId(saved);
  }, []);

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  const questions = currentSubject.quizzes && currentSubject.quizzes.length > 0
    ? currentSubject.quizzes
    : SUBJECTS[0].quizzes;

  const currentQ = questions[currentQuestionIndex] || questions[0];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setIsAnswerSubmitted(true);
    if (selectedAnswer === currentQ.correctIndex) {
      setScore((prev) => prev + 100);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
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
              {currentSubject.name} bo'yicha bilimlaringizni sinang, ballar to'plang va reytingda ko'tariling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 text-xs font-bold">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>12 Kunlik Seriya</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200/60 text-[#8B5CF6] text-xs font-bold">
              <Zap className="w-4 h-4 fill-[#8B5CF6]" />
              <span>2,840 XP</span>
            </div>
          </div>
        </div>

        {/* Quiz Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6 sm:p-8 flex flex-col justify-between min-h-[480px]">
            {!quizFinished ? (
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
                      <span>45 soniya</span>
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
                      const isCorrect = idx === currentQ.correctIndex;

                      let btnStyle =
                        'bg-white border-slate-200 text-[#1E293B] hover:border-[#2563EB] hover:bg-blue-50/20';

                      if (isSelected) {
                        btnStyle = 'border-[#2563EB] bg-blue-50/50 text-[#2563EB] ring-2 ring-blue-500/20';
                      }

                      if (isAnswerSubmitted) {
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

                          {isAnswerSubmitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                          )}
                          {isAnswerSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswerSubmitted && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-[#1E293B] space-y-1 animate-fade-in">
                      <span className="font-bold text-[#2563EB]">AI Tushuntirishi:</span>
                      <p>{currentQ.explanation}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-6">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Yig'ilgan ball: <strong className="text-[#2563EB]">{score} XP</strong>
                  </span>

                  {!isAnswerSubmitted ? (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={selectedAnswer === null}
                      onClick={handleSubmitAnswer}
                    >
                      Javobni Tasdiqlash
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
                    Siz <strong>{score}</strong> ball to'pladingiz!
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl max-w-sm mx-auto border border-emerald-100 text-xs text-[#16A34A] font-semibold">
                  🎉 +{score} XP ball profilingizga qo'shildi!
                </div>

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
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Sardor Rahimiy', points: '3,450 XP', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80' },
                  { rank: 2, name: 'Dilorom Malikova', points: '3,120 XP', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80' },
                  { rank: 3, name: 'Azizbek Saidov', points: '2,980 XP', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80' },
                  { rank: 4, name: 'Zumradxon (Siz)', points: '2,840 XP', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80', isUser: true },
                ].map((u) => (
                  <div
                    key={u.rank}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
                      u.isUser
                        ? 'bg-blue-50/70 border-blue-200 text-[#2563EB]'
                        : 'border-slate-100 text-[#1E293B]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-[#64748B]">#{u.rank}</span>
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <span>{u.name}</span>
                    </div>
                    <span>{u.points}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
