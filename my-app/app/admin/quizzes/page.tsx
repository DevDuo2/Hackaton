'use client';

import React from 'react';
import { Trophy, Plus, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';
import { MOCK_QUIZ_QUESTIONS } from '../../../data/mockData';

export default function AdminQuizzesPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                AI Savollar & Testlar Banki
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                Kunlik Sinovlar Faol
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Sun'iy intellekt tomonidan tahlil qilinadigan interaktiv testlar, tushuntirishlar va ball tizimi.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 border-0"
          >
            Yangi Savol Qo'shish
          </Button>
        </div>

        <div className="space-y-4">
          {MOCK_QUIZ_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/50 text-xs font-bold">
                      Savol #{idx + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-800/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Kunlik Musobaqada Faol
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">{q.question}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                          i === q.correctIndex
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300 font-bold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {i === q.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-300">AI Izohi:</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
                <button className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer self-start">
                  Tahrirlash
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
