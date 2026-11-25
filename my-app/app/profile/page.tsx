'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import {
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MOCK_USER, SUBJECTS } from '../../data/mockData';
import { SUBJECT_KEY } from '../../lib/auth';
import { useSession, useStoredString } from '../../lib/clientStore';
import { fetchMe } from '../../lib/api';

interface LiveStats {
  totalXP: number;
  streakDays: number;
  answeredCount: number;
}

export default function ProfilePage() {
  // Profil sessiyadan render vaqtida o'qiladi — effekt ham, state ham kerak emas.
  const session = useSession();
  const savedSubject = useStoredString(SUBJECT_KEY);

  // Yutuqlar SERVERDAN olinadi. Ilgari bu kartada MOCK_USER raqamlari turardi:
  // hozir ro'yxatdan o'tgan talaba ham «42 dars, 12 kunlik seriya, 2840 XP»
  // ko'rardi — ya'ni sahifa boshqa odamning natijasini o'ziniki deb ko'rsatardi.
  const [live, setLive] = useState<LiveStats | null>(null);
  const [liveFailed, setLiveFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (cancelled) return;
        setLive({
          totalXP: me.user.totalXP ?? 0,
          streakDays: me.user.streakDays ?? 0,
          answeredCount: me.user.answeredCount ?? 0,
        });
      })
      .catch(() => {
        if (!cancelled) setLiveFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  const userProfile = {
    name: session?.name ?? MOCK_USER.name,
    email: session?.email ?? MOCK_USER.email,
    avatar: session?.avatar ?? MOCK_USER.avatar,
    role: session?.role === 'admin' ? 'Administrator' : "O'quvchi",
    selectedSubject: savedSubject ?? session?.selectedSubject ?? 'matematika',
  };

  const currentSub =
    SUBJECTS.find((s) => s.id === userProfile.selectedSubject) || SUBJECTS[0];

  /** Yuklanmaguncha «—», xato bo'lsa ham «—»: soxta nol ko'rsatilmaydi. */
  const stat = (value: number | undefined) =>
    live === null || value === undefined ? '—' : value.toLocaleString('uz-UZ');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <Card className="p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <Image
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-[#2563EB]/15 shadow-md"
              width={96}
              height={96}
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-black text-[#1E293B]">
                    {userProfile.name}
                  </h1>
                  <p className="text-xs text-[#64748B] flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {userProfile.email}
                  </p>
                </div>
                <Link href="/settings">
                  <Button variant="outline" size="sm" icon={<SettingsIcon className="w-4 h-4" />}>
                    Sozlamalar
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <Badge variant="blue" size="md">
                  {userProfile.role}
                </Badge>
                <Badge variant="purple" size="md">
                  Yo&apos;nalish: {currentSub.name}
                </Badge>
                <Badge variant="green" size="md">
                  Faol Profil
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Interests & Enrolled Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-sm text-[#1E293B] mb-3">
              Tanlangan Yo&apos;nalish
            </h3>
            {/* Haqiqiy tanlov — localStorage/sessiyadagi selectedSubject. Ilgari
                bu yerda MOCK_USER.interests ro'yxati turardi va hamma talabada
                bir xil to'rtta «qiziqish» ko'rinardi. */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-xs font-semibold text-[#1E293B]">
                {currentSub.iconSymbol} {currentSub.name}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-[#64748B]">
                {currentSub.topicsCount} mavzu
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-3 leading-relaxed">
              {currentSub.description}
            </p>
            <Link
              href="/settings"
              className="inline-block mt-3 text-xs font-semibold text-[#2563EB] rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] hover:underline"
            >
              Yo&apos;nalishni o&apos;zgartirish
            </Link>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-sm text-[#1E293B] mb-3">
              Yutuqlar va Ballar
            </h3>
            {liveFailed && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                Ko&apos;rsatkichlarni yuklab bo&apos;lmadi. Sahifani yangilab
                ko&apos;ring.
              </p>
            )}
            <div className="space-y-2 text-xs text-[#64748B]">
              <div className="flex justify-between">
                <span>Javob berilgan savollar:</span>
                <strong className="text-[#1E293B]">
                  {stat(live?.answeredCount)} ta
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Faollik Seriyasi:</span>
                <strong className="text-amber-600">
                  {stat(live?.streakDays)} kun
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Jami Yig&apos;ilgan XP:</span>
                <strong className="text-[#2563EB]">
                  {stat(live?.totalXP)} XP
                </strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
