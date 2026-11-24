'use client';

import React, { useState } from 'react';
import { Users, Search, Filter, ShieldCheck, Mail, ArrowUpRight, Award, Flame, BookOpen } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { MOCK_ADMIN_STATS } from '../../../data/mockData';

export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_ADMIN_STATS.recentStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Talabalar Bazasini Boshqarish
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold">
                MongoDB Atlas Sinxron
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Platforma foydalanuvchilari faolligi, darslar o'zlashtirish progressi va umumiy reytingi.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Mail className="w-4 h-4" />}
            className="bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800"
          >
            Umumiy Xabarnoma Yuborish
          </Button>
        </div>

        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Talabani ismi yoki pochtasi bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 font-medium"
              />
            </div>
            <div className="text-xs text-slate-400">
              Jami ro'yxatda: <strong className="text-white">14,820</strong> ta o'quvchi
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Talaba Profili</th>
                  <th className="py-3.5 px-4">Asosiy Yo'nalish</th>
                  <th className="py-3.5 px-4">O'zlashtirish Progressi</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#0F172A]/40">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{s.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{s.course}</td>
                    <td className="py-3.5 px-4 min-w-[150px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Progress</span>
                          <span className="font-bold text-emerald-400">{s.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Faol
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer">
                        Profilni Ko'rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
