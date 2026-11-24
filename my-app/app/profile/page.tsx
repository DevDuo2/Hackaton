'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MOCK_USER, SUBJECTS } from '../../data/mockData';

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState({
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    avatar: MOCK_USER.avatar,
    role: "O'quvchi",
    selectedSubject: 'matematika',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('voxy_auth_user');
      const savedSub = localStorage.getItem('voxy_active_subject');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          setUserProfile((prev) => ({
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
            avatar: parsed.avatar || prev.avatar,
            role: parsed.role === 'admin' ? 'Administrator' : "O'quvchi",
            selectedSubject: savedSub || parsed.selectedSubject || 'matematika',
          }));
        } catch (e) {}
      }
    }
  }, []);

  const currentSub =
    SUBJECTS.find((s) => s.id === userProfile.selectedSubject) || SUBJECTS[0];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <Card className="p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-[#2563EB]/15 shadow-md"
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
                  Yo'nalish: {currentSub.name}
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
              O'rganish Qiziqishlari
            </h3>
            <div className="flex flex-wrap gap-2">
              {MOCK_USER.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-[#1E293B]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-sm text-[#1E293B] mb-3">
              Yutuqlar va Ballar
            </h3>
            <div className="space-y-2 text-xs text-[#64748B]">
              <div className="flex justify-between">
                <span>Tugallangan Mavzular:</span>
                <strong className="text-[#1E293B]">{MOCK_USER.completedLessonsTotal} ta dars</strong>
              </div>
              <div className="flex justify-between">
                <span>Faollik Seriyasi:</span>
                <strong className="text-amber-600">{MOCK_USER.streakDays} kun</strong>
              </div>
              <div className="flex justify-between">
                <span>Jami Yig'ilgan XP:</span>
                <strong className="text-[#2563EB]">{MOCK_USER.totalPoints} XP</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
