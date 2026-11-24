'use client';

import React from 'react';
import { Users, Search, Filter, ShieldCheck, Mail } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MOCK_ADMIN_STATS } from '../../../data/mockData';

export default function AdminStudentsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Student Directory & Learning Analytics
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Inspect student progression, streak metrics, and platform engagement.
            </p>
          </div>
          <Button variant="outline" size="sm" icon={<Mail className="w-4 h-4" />}>
            Broadcast Announcement
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name, email, or course..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="text-xs text-[#64748B]">
              Total: <strong>14,820</strong> enrolled learners
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Student Profile</th>
                  <th className="py-3 px-4">Primary Path</th>
                  <th className="py-3 px-4">Progress Velocity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_ADMIN_STATS.recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-[#1E293B]">
                      <p>{s.name}</p>
                      <p className="text-[10px] text-[#64748B] font-normal">{s.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{s.course}</td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <ProgressBar value={s.progress} color="blue" size="sm" showLabel />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="green" size="sm">
                        Active Learner
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        View Records
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
