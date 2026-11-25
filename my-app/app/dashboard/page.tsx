'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Flame,
  Clock,
  BookCheck,
  Trophy,
  Play,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MOCK_USER, MOCK_COURSES, SUBJECTS } from '../../data/mockData';
import { SUBJECT_KEY, setActiveSubject } from '../../lib/auth';
import { useSession, useStoredString } from '../../lib/clientStore';
import { fetchLeaderboard, fetchMe, fetchSubjects } from '../../lib/api';

interface LiveProgress {
  totalXP: number;
  streakDays: number;
  answeredCount: number;
  rank: number | null;
  totalStudents: number;
  quizCount: number;
}

export default function DashboardPage() {
  // Fan va ism localStorage dan o'qiladi; o'zgarsa hook o'zi qayta render qiladi.
  const activeSubjectId = useStoredString(SUBJECT_KEY) ?? 'matematika';
  const session = useSession();
  const displayName = session?.name ?? MOCK_USER.name;

  // Ko'rsatkichlar serverdan: ilgari bu yerda MOCK_USER raqamlari turardi va
  // yangi ro'yxatdan o'tgan talaba ham «12 kunlik seriya, 2840 XP» ko'rardi.
  const [live, setLive] = useState<LiveProgress | null>(null);
  // null = hali yuklanmoqda, true = so'rov muvaffaqiyatsiz tugadi
  const [liveFailed, setLiveFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMe(), fetchLeaderboard(), fetchSubjects()])
      .then(([me, board, catalogue]) => {
        if (cancelled) return;
        // O'rin ham, umumiy son ham FAQAT talabalar bo'yicha hisoblanadi.
        // Ilgari o'rin butun reyting bo'yicha (admin ham ichida) olinar,
        // son esa adminsiz chiqarilardi — ekranda «#7 / 6 talaba» kabi
        // o'zi o'ziga zid natija paydo bo'lardi.
        const students = board.leaderboard.filter((u) => u.role !== 'admin');
        const index = students.findIndex((u) => u.id === me.user.id);
        setLive({
          totalXP: me.user.totalXP ?? 0,
          streakDays: me.user.streakDays ?? 0,
          answeredCount: me.user.answeredCount ?? 0,
          rank: index >= 0 ? index + 1 : null,
          totalStudents: students.length,
          quizCount: catalogue.subjects.reduce((sum, s) => sum + (s.quizCount ?? 0), 0),
        });
      })
      .catch(() => {
        if (!cancelled) setLiveFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  const quizProgress =
    live && live.quizCount > 0 ? Math.min(1, live.answeredCount / live.quizCount) : 0;

  const dash = (value: number | null | undefined) =>
    live === null || value === null || value === undefined ? '—' : value.toLocaleString('uz-UZ');

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  // Faqat tanlangan fanning kursi. Ilgari `|| c.category === 'Mathematics'`
  // sharti tufayli qaysi fan tanlansa ham matematika kursi ko'rinardi.
  const subjectCourses = MOCK_COURSES.filter((c) => c.subjectId === activeSubjectId);
  const activeCourse = subjectCourses[0] ?? null;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Personalized Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-3">
                <span className="text-base">{currentSubject.iconSymbol}</span>
                <span>Asosiy yo&apos;nalishingiz: {currentSubject.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xush kelibsiz, {displayName}!
              </h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Bugun {currentSubject.name} bo&apos;yicha yangi mavzuni tahlil qilamiz. AI murabbiyingiz savollarga javob berishga va testlarni tekshirishga tayyor!
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
              <span className="text-xs font-semibold text-[#64748B]">Javob berilgan savollar</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <BookCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {dash(live?.answeredCount)}
              </span>
              <span className="text-xs text-[#64748B] font-medium ml-2">
                {live ? `/ ${live.quizCount} savol` : ''}
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Reytingdagi o&apos;rningiz</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {live?.rank ? `#${live.rank}` : '—'}
              </span>
              <span className="text-xs text-[#64748B] font-medium ml-2">
                {live ? `/ ${live.totalStudents} talaba` : ''}
              </span>
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
                {dash(live?.totalXP)}
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
                {dash(live?.streakDays)} Kun
              </span>
              <span className="text-xs text-amber-600 font-semibold ml-2">
                {live && live.streakDays > 1 ? "To'xtovsiz 🔥" : 'Boshlandi'}
              </span>
            </div>
          </Card>
        </div>

        {/* Continue Learning in Chosen Subject */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden flex flex-col justify-between">
            {activeCourse ? (
              <>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                      {currentSubject.name} bo&apos;yicha Davom ettirish
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
                    {/* w-full + h-28: kenglik suzuvchi, balandlik qat'iy —
                        shuning uchun `fill` ishlatiladi (next/image talabi). */}
                    <div className="relative w-full sm:w-44 h-28 shrink-0">
                      <Image
                        src={activeCourse.image}
                        alt={activeCourse.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 176px"
                        className="object-cover rounded-xl"
                      />
                    </div>
                    {/* Dars-darajadagi progress hali kuzatilmaydi — soxta foiz o'rniga
                        katalogdagi haqiqiy raqamlar va haqiqiy test progressi. */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#64748B]">
                        <span>{activeCourse.lessonsCount} mavzu</span>
                        <span className="font-bold text-[#1E293B]">{activeCourse.duration}</span>
                      </div>
                      <ProgressBar value={Math.round(quizProgress * 100)} color="blue" size="md" />
                      <p className="text-xs text-[#64748B]">
                        {live
                          ? `Test progressi: ${live.answeredCount} / ${live.quizCount} savol`
                          : liveFailed
                            ? 'Progressni olib bo‘lmadi'
                            : 'Progress yuklanmoqda…'}
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
              </>
            ) : (
              /* Bo'sh holat: boshqa fanning kursini ko'rsatib qo'yish — yolg'on ma'lumot. */
              <CardContent className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#64748B] flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  {currentSubject.name} bo&apos;yicha kurs hali qo&apos;shilmagan
                </h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Shu fan bo&apos;yicha testlarni yechib, AI murabbiyga savol berib turishingiz mumkin.
                </p>
                <div className="flex justify-center gap-3 pt-1">
                  <Link href="/games">
                    <Button variant="primary" size="sm" icon={<Trophy className="w-3.5 h-3.5" />}>
                      Testni yechish
                    </Button>
                  </Link>
                  <Link href="/courses">
                    <Button variant="outline" size="sm">
                      Barcha kurslar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Progress halqasi: kuzatiladigan yagona ko'rsatkich — test savollari.
              Ilgari bu yerda «bugun 1.5 soatdan 1.1 soat o'qildi, 73%» degan
              o'ylab topilgan raqamlar turardi. */}
          <Card className="flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[#1E293B]">Test progressi</h3>
                <Badge variant={live && live.answeredCount > 0 ? 'green' : 'blue'} size="sm">
                  {live && live.answeredCount > 0 ? 'Faol' : 'Boshlanmagan'}
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
                      strokeDashoffset={326.7 * (1 - quizProgress)}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-[#1E293B]">
                      {live ? `${Math.round(quizProgress * 100)}%` : '—'}
                    </span>
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold">
                      Bajarildi
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#64748B] mt-3">
                  {live
                    ? `${live.answeredCount} / ${live.quizCount} test savoliga javob berdingiz`
                    : liveFailed
                      ? 'Ko‘rsatkichlarni olib bo‘lmadi — server javob bermayapti.'
                      : 'Ko‘rsatkichlar yuklanmoqda…'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Link
                href="/games"
                className="flex items-center justify-between text-xs font-semibold text-[#2563EB] hover:underline"
              >
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" /> {currentSubject.name} testini yechish
                </span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/ai-tutor"
                className="flex items-center justify-between text-xs font-semibold text-[#8B5CF6] hover:underline"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI murabbiyga savol berish
                </span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </Card>
        </div>

        {/* All Available Subjects Carousel/Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#1E293B]">Boshqa Fanlar</h3>
            <span className="text-xs text-[#64748B]">Istalgan fanga bir klikda o&apos;ting</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SUBJECTS.map((sub) => (
              <div
                key={sub.id}
                onClick={() => setActiveSubject(sub.id)}
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
