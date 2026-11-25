'use client';

/**
 * O'zlashtirish sahifasi.
 *
 * Ilgari bu sahifa TO'LIQ to'qima edi: «64% bajarildi», «15.1 soat shu hafta»,
 * «3 sertifikat», haftalik ustunlar va to'rtta «mastery» chizig'i — hammasi
 * MOCK_USER dan va qo'lda yozilgan sonlardan. Natijada u dashboarddagi
 * haqiqiy raqamlarga ham qarama-qarshi chiqardi.
 *
 * Endi hamma ko'rsatkich serverdan keladi. Platformada vaqt hisobi YO'Q,
 * shuning uchun «o'qish soatlari» kabi mavjud bo'lmagan metrika ko'rsatilmaydi:
 * uning o'rnida XP, reyting va fanlar bo'yicha javoblar — ya'ni o'lchanadigan
 * narsalar. Nishonlar ham haqiqiy statistikadan hisoblanadi.
 */

import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  fetchLeaderboard,
  fetchMe,
  type ProgressSummary,
} from '../../lib/api';
import { useSession } from '../../lib/clientStore';

interface LiveProgress {
  totalXP: number;
  streakDays: number;
  progress: ProgressSummary;
  rank: number | null;
  totalStudents: number;
}

interface BadgeRule {
  id: string;
  title: string;
  desc: string;
  earned: (p: LiveProgress) => boolean;
}

/** Nishonlar HAQIQIY statistikadan hisoblanadi — qo'lda `unlocked: true` yo'q. */
const BADGE_RULES: BadgeRule[] = [
  {
    id: 'first-answer',
    title: 'Birinchi qadam',
    desc: 'Birinchi test savoliga javob berdingiz',
    earned: (p) => p.progress.answeredCount >= 1,
  },
  {
    id: 'five-answers',
    title: 'Qizg‘in boshlanish',
    desc: '5 ta savolga javob berdingiz',
    earned: (p) => p.progress.answeredCount >= 5,
  },
  {
    id: 'all-answers',
    title: 'Butun katalog',
    desc: 'Platformadagi barcha savollarga javob berdingiz',
    earned: (p) =>
      p.progress.totalQuestions > 0 &&
      p.progress.answeredCount >= p.progress.totalQuestions,
  },
  {
    id: 'xp-500',
    title: '500 XP',
    desc: '500 ta tajriba ballini yig‘dingiz',
    earned: (p) => p.totalXP >= 500,
  },
  {
    id: 'streak-3',
    title: '3 kunlik seriya',
    desc: 'Uch kun ketma-ket faol bo‘ldingiz',
    earned: (p) => p.streakDays >= 3,
  },
  {
    id: 'top-three',
    title: 'Eng yaxshi uchlik',
    desc: 'Umumiy reytingda 3-o‘rin yoki yuqori',
    earned: (p) => p.rank !== null && p.rank <= 3,
  },
];

export default function ProgressPage() {
  const session = useSession();
  const [live, setLive] = useState<LiveProgress | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMe(), fetchLeaderboard()])
      .then(([me, board]) => {
        if (cancelled) return;
        const index = board.leaderboard.findIndex((u) => u.id === me.user.id);
        setLive({
          totalXP: me.user.totalXP ?? 0,
          streakDays: me.user.streakDays ?? 0,
          progress:
            me.progress ?? { answeredCount: 0, totalQuestions: 0, bySubject: [] },
          rank: index >= 0 ? index + 1 : null,
          totalStudents: board.leaderboard.length,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  const completion =
    live && live.progress.totalQuestions > 0
      ? Math.round((live.progress.answeredCount / live.progress.totalQuestions) * 100)
      : 0;

  const earnedBadges = live ? BADGE_RULES.filter((b) => b.earned(live)) : [];

  // Yuklanmaguncha va xatoda «—»: soxta nol ko'rsatilmaydi.
  const show = (value: number | null | undefined, suffix = '') =>
    live === null || value === null || value === undefined
      ? '—'
      : `${value.toLocaleString('uz-UZ')}${suffix}`;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Mening o&apos;zlashtirishim
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Javob berilgan savollar, yig&apos;ilgan XP va fanlar bo&apos;yicha
            natijalaringiz.
          </p>
        </div>

        {failed && (
          <div
            role="alert"
            className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
          >
            Ko&apos;rsatkichlarni serverdan yuklab bo&apos;lmadi. Internet
            aloqasini tekshirib, sahifani yangilang.
          </div>
        )}

        {/* Haqiqiy ko'rsatkichlar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">
              Umumiy bajarilish
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">
                {live === null ? '—' : `${completion}%`}
              </span>
              <span className="text-xs text-[#64748B] font-bold">
                {show(live?.progress.answeredCount)} / {show(live?.progress.totalQuestions)}
              </span>
            </div>
            <ProgressBar value={completion} color="blue" size="sm" className="mt-3" />
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">
              Faollik seriyasi
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">
                {show(live?.streakDays)} kun
              </span>
            </div>
            <ProgressBar
              value={live ? Math.min(100, live.streakDays * 10) : 0}
              color="amber"
              size="sm"
              className="mt-3"
            />
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">
              Yig&apos;ilgan XP
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">
                {show(live?.totalXP)}
              </span>
              <span className="text-xs text-[#2563EB] font-bold">XP</span>
            </div>
            <ProgressBar
              value={live ? Math.min(100, (live.totalXP / 1000) * 100) : 0}
              color="purple"
              size="sm"
              className="mt-3"
            />
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">
              Umumiy reyting
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">
                {live === null || live.rank === null ? '—' : `#${live.rank}`}
              </span>
              <span className="text-xs text-[#64748B] font-bold">
                / {show(live?.totalStudents)} talaba
              </span>
            </div>
            <ProgressBar
              value={
                live && live.rank !== null && live.totalStudents > 0
                  ? Math.round(
                      ((live.totalStudents - live.rank + 1) / live.totalStudents) * 100
                    )
                  : 0
              }
              color="green"
              size="sm"
              className="mt-3"
            />
          </Card>
        </div>

        {/* Fanlar bo'yicha haqiqiy o'zlashtirish */}
        <Card className="p-6">
          <h2 className="font-bold text-base text-[#1E293B] mb-1">
            Fanlar bo&apos;yicha o&apos;zlashtirish
          </h2>
          <p className="text-xs text-[#64748B] mb-5">
            Har bir fandagi savollarning qanchasiga javob berganingiz.
          </p>

          {live === null && !failed && (
            <div className="space-y-4" aria-busy="true" aria-label="Yuklanmoqda">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 w-32 bg-slate-100 rounded mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {live !== null && live.progress.bySubject.length === 0 && (
            <p className="text-sm text-[#64748B]">
              Hozircha fanlar katalogi bo&apos;sh.
            </p>
          )}

          {live !== null && live.progress.bySubject.length > 0 && (
            <div className="space-y-4">
              {live.progress.bySubject.map((subject) => {
                const percent =
                  subject.total > 0
                    ? Math.round((subject.answered / subject.total) * 100)
                    : 0;
                return (
                  <div key={subject.subjectId}>
                    <div className="flex justify-between text-xs font-semibold text-[#1E293B] mb-1 gap-2">
                      <span className="truncate">
                        {subject.iconSymbol} {subject.name}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {subject.answered}/{subject.total} · {percent}%
                      </span>
                    </div>
                    <ProgressBar
                      value={percent}
                      color={percent === 100 ? 'green' : 'blue'}
                      size="md"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Nishonlar — haqiqiy statistikadan hisoblanadi */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Nishonlar</h2>
              <p className="text-xs text-[#64748B]">
                Savollarga javob berib, XP yig&apos;ib va seriyani uzmasdan
                ochiladi
              </p>
            </div>
            <Badge variant="purple" size="md">
              {live === null
                ? '—'
                : `${earnedBadges.length} / ${BADGE_RULES.length} ochilgan`}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BADGE_RULES.map((badge) => {
              const unlocked = live !== null && badge.earned(live);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                    unlocked
                      ? 'bg-white border-slate-200/80 shadow-xs'
                      : 'bg-slate-50 border-dashed border-slate-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unlocked
                        ? 'bg-purple-100 text-[#8B5CF6]'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {unlocked ? (
                      <Award className="w-5 h-5" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                      <span className="truncate">{badge.title}</span>
                      {unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug break-words">
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
