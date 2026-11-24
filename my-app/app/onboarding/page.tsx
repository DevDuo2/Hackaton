'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SUBJECTS, Subject } from '../../data/mockData';

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('matematika');
  const [level, setLevel] = useState<string>('O\'rta (Litsey / Kollej darajasi)');

  const handleFinishOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxy_active_subject', selectedSubjectId);
      localStorage.setItem('voxy_user_level', level);
    }
    router.push('/dashboard');
  };

  const selectedSubject =
    SUBJECTS.find((s) => s.id === selectedSubjectId) || SUBJECTS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-[#2563EB]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Qadam: O'zingizga mos fanni tanlang</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight">
            Xush kelibsiz! Qaysi fanni o'rganamiz?
          </h1>

          <p className="text-sm text-[#64748B] max-w-xl mx-auto">
            VOXY faqat bitta yo'nalish emas — barcha asosiy fanlarni qamrab oladi. Fanni tanlang, biz siz uchun shaxsiy AI murabbiy va testlarni aynan shu fanga moslashtiramiz.
          </p>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUBJECTS.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#2563EB] bg-white shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/10'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{sub.iconSymbol}</span>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-[#1E293B] mb-1">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>{sub.topicsCount} ta mavzu</span>
                  <span className="font-semibold text-[#1E293B]">{sub.studentsCount} o'quvchi</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Selection & Final Action */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                Bilim darajangiz:
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Boshlang'ich (Maktab darajasi)">
                  Boshlang'ich (Maktab darajasi)
                </option>
                <option value="O'rta (Litsey / Kollej darajasi)">
                  O'rta (Litsey / Kollej darajasi)
                </option>
                <option value="Chuqurlashtirilgan (Universitet / Olimpiada)">
                  Chuqurlashtirilgan (Universitet / Olimpiada)
                </option>
              </select>
            </div>

            <div className="w-full sm:w-auto text-right">
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinishOnboarding}
                className="w-full sm:w-auto px-8"
              >
                <span>Tanlangan {selectedSubject.name} bo'yicha Boshlash</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
