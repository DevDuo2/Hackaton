'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, Award } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Platform Performance & Learning Analytics
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            System load, lesson completion velocity, and AI interaction metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center justify-between">
              <span>Daily Active Users (DAU)</span>
              <Users className="w-4 h-4 text-[#2563EB]" />
            </h3>
            <p className="text-2xl font-black text-[#1E293B]">2,480</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">+14% vs last week</p>
            <ProgressBar value={78} color="blue" size="sm" className="mt-4" />
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center justify-between">
              <span>AI Tutor Queries Handled</span>
              <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />
            </h3>
            <p className="text-2xl font-black text-[#1E293B]">48,920</p>
            <p className="text-xs text-purple-600 font-semibold mt-1">Avg response time: 0.8s</p>
            <ProgressBar value={92} color="purple" size="sm" className="mt-4" />
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center justify-between">
              <span>Speaking Coach Minutes</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </h3>
            <p className="text-2xl font-black text-[#1E293B]">14,200 min</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Audio bandwidth 100% stable</p>
            <ProgressBar value={65} color="green" size="sm" className="mt-4" />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
