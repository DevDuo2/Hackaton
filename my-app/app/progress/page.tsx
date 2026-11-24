'use client';

import React from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  BookCheck,
  Flame,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MOCK_USER, MOCK_COURSES } from '../../data/mockData';

export default function ProgressPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            My Learning Progress & Analytics
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track your study consistency, mastery velocity, and unlocked milestones.
          </p>
        </div>

        {/* High-level metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">Overall Completion</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">64%</span>
              <span className="text-xs text-emerald-600 font-bold">+8% this month</span>
            </div>
            <ProgressBar value={64} color="blue" size="sm" className="mt-3" />
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">Active Streak</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">{MOCK_USER.streakDays} Days</span>
              <span className="text-xs text-amber-500 font-bold">Unbroken</span>
            </div>
            <ProgressBar value={80} color="amber" size="sm" className="mt-3" />
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">Study Time This Week</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">15.1 hrs</span>
              <span className="text-xs text-purple-600 font-bold">Target 12h</span>
            </div>
            <ProgressBar value={100} color="purple" size="sm" className="mt-3" />
          </Card>

          <Card className="p-5">
            <span className="text-xs font-semibold text-[#64748B]">Certificates Earned</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1E293B]">{MOCK_USER.certificatesCount}</span>
              <span className="text-xs text-[#2563EB] font-bold">1 In Progress</span>
            </div>
            <ProgressBar value={75} color="green" size="sm" className="mt-3" />
          </Card>
        </div>

        {/* Weekly & Monthly Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h3 className="font-bold text-base text-[#1E293B] mb-4">
              Daily Study Velocity (Current Week)
            </h3>
            <div className="flex items-end justify-between h-48 pt-6 pb-2 gap-3">
              {MOCK_USER.weeklyActivity.map((item) => {
                const percent = Math.round((item.hours / 3.5) * 100);
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-[#64748B]">{item.hours}h</span>
                    <div className="w-full bg-slate-100 rounded-t-xl h-36 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-[#2563EB] to-[#8B5CF6] rounded-t-xl"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#1E293B]">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 flex flex-col justify-between">
            <h3 className="font-bold text-base text-[#1E293B] mb-2">
              Subject Mastery Breakdown
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1E293B] mb-1">
                  <span>Artificial Intelligence & Prompts</span>
                  <span>85%</span>
                </div>
                <ProgressBar value={85} color="purple" size="md" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1E293B] mb-1">
                  <span>English Speaking & Conversation</span>
                  <span>75%</span>
                </div>
                <ProgressBar value={75} color="blue" size="md" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1E293B] mb-1">
                  <span>Full-Stack Web Development</span>
                  <span>45%</span>
                </div>
                <ProgressBar value={45} color="green" size="md" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#1E293B] mb-1">
                  <span>Machine Learning Mathematics</span>
                  <span>30%</span>
                </div>
                <ProgressBar value={30} color="amber" size="md" />
              </div>
            </div>
          </Card>
        </div>

        {/* Milestone Badges Collection */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">Achievement Badges</h3>
              <p className="text-xs text-[#64748B]">Earn badges by completing challenges and maintaining streaks</p>
            </div>
            <Badge variant="purple" size="md">
              4 of 6 Unlocked
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_USER.badges.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  b.unlocked
                    ? 'bg-white border-slate-200/80 shadow-xs'
                    : 'bg-slate-50 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    b.unlocked
                      ? 'bg-purple-100 text-[#8B5CF6]'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {b.unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
                    {b.title}
                    {b.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
