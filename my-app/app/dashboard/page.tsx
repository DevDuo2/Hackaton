'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Clock,
  BookCheck,
  Trophy,
  Play,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MOCK_USER, MOCK_COURSES, SUBJECTS } from '../../data/mockData';

export default function DashboardPage() {
  const [activeSubjectId, setActiveSubjectId] = useState('matematika');
  const [displayName, setDisplayName] = useState(MOCK_USER.name);

  useEffect(() => {
    const updateUserData = () => {
      const saved = localStorage.getItem('voxy_active_subject');
      if (saved) setActiveSubjectId(saved);

      const authData = localStorage.getItem('voxy_auth_user');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed.name) setDisplayName(parsed.name);
        } catch (e) {}
      }
    };

    updateUserData();
    window.addEventListener('voxy_subject_changed', updateUserData);
    return () => window.removeEventListener('voxy_subject_changed', updateUserData);
  }, []);

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  const subjectCourses = MOCK_COURSES.filter(
    (c) => c.subjectId === activeSubjectId || c.category === 'Mathematics'
  );
  const activeCourse = subjectCourses[0] || MOCK_COURSES[0];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Personalized Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-3">
                <span className="text-base">{currentSubject.iconSymbol}</span>
                <span>Asosiy yo'nalishingiz: {currentSubject.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xush kelibsiz, {displayName}!
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Bugun {currentSubject.name} bo'yicha yangi mavzuni tahlil qilamiz. AI murabbiyingiz savollarga javob berishga va testlarni tekshirishga tayyor!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/ai-tutor">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white text-[#8B5CF6] hover:bg-slate-50 border-none font-bold shadow-md shadow-purple-900/10"
                  icon={<Sparkles className="w-4 h-4 text-[#8B5CF6]" />}
                >
                  {currentSubject.name} AI Murabbiyi
                </Button>
              </Link>
              <Link href="/games">
                <Button
                  variant="secondary"
                  size="md"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold"
                  icon={<Trophy className="w-4 h-4" />}
                >
                  Fan Testini Yechish
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Tugallangan Darslar</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <BookCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_USER.completedLessonsTotal}
              </span>
              <span className="text-xs text-[#16A34A] font-semibold ml-2">+4 bu hafta</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">O'rganish Vaqti</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">16.8 soat</span>
              <span className="text-xs text-[#16A34A] font-semibold ml-2">Top 5%</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Jami Ballar (XP)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_USER.totalPoints}
              </span>
              <span className="text-xs text-[#64748B] font-medium ml-2">XP</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Faollik Seriyasi</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_USER.streakDays} Kun
              </span>
              <span className="text-xs text-amber-600 font-semibold ml-2">To'xtovsiz 🔥</span>
            </div>
          </Card>
        </div>

        {/* Continue Learning in Chosen Subject */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  {currentSubject.name} bo'yicha Davom ettirish
                </span>
                <h3 className="text-lg font-bold text-[#1E293B] mt-0.5">
                  {activeCourse.title}
                </h3>
              </div>
              <Badge variant="blue" size="sm">
                Faol Kurs
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                <img
                  src={activeCourse.image}
                  alt={activeCourse.title}
                  className="w-full sm:w-44 h-28 object-cover rounded-xl"
                />
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>
                      {activeCourse.completedLessons} / {activeCourse.lessonsCount} mavzu
                    </span>
                    <span className="font-bold text-[#1E293B]">{activeCourse.progress}% O'zlashtirildi</span>
                  </div>
                  <ProgressBar value={activeCourse.progress ?? 40} color="blue" size="md" />
                  <p className="text-xs text-[#64748B]">
                    Navbatdagi mavzu: <strong>Nazariy qonuniyatlar va formulalar</strong>. Tavsiya etilgan vaqt: 20 daqiqa.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748B] font-medium">
                  Murabbiy: {activeCourse.instructor.name}
                </span>
                <Link href={`/courses/${activeCourse.id}`}>
                  <Button variant="primary" size="sm" icon={<Play className="w-3.5 h-3.5 fill-white" />}>
                    Darsni Boshlash
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Daily Goal */}
          <Card className="flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[#1E293B]">Kunlik Maqsad</h3>
                <Badge variant="green" size="sm">
                  Faol
                </Badge>
              </div>

              <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="52" stroke="#F1F5F9" strokeWidth="10" fill="transparent" />
                    <circle
                      cx="64"
                      cy="64"
                      r="52"
                      stroke="#2563EB"
                      strokeWidth="10"
                      strokeDasharray="326.7"
                      strokeDashoffset={326.7 * (1 - 1.1 / 1.5)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-[#1E293B]">73%</span>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                      Bajarildi
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#64748B] mt-3">
                  Bugun <strong>1.5 soat</strong>dan <strong>1.1 soat</strong> o'qildi
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {currentSubject.name} testi
                </span>
                <span className="text-emerald-600 font-semibold">Yechildi</span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#2563EB]" /> AI bilan 1 ta masala
                </span>
                <span className="text-amber-500 font-semibold">Kutilmoqda</span>
              </div>
            </div>
          </Card>
        </div>

        {/* All Available Subjects Carousel/Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1E293B]">Boshqa Fanlar</h3>
            <span className="text-xs text-[#64748B]">Istalgan fanga bir klikda o'ting</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SUBJECTS.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  localStorage.setItem('voxy_active_subject', sub.id);
                  setActiveSubjectId(sub.id);
                  window.dispatchEvent(new Event('voxy_subject_changed'));
                }}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  sub.id === currentSubject.id
                    ? 'border-[#2563EB] bg-blue-50/60 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-2xl block mb-1">{sub.iconSymbol}</span>
                <p className="text-xs font-bold text-[#1E293B] truncate">{sub.name}</p>
                <span className="text-[10px] text-[#64748B]">{sub.topicsCount} mavzu</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
