'use client';

import React from 'react';
import { BarChart3, Users, Clock } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Platforma Ko&apos;rsatkichlari & Chuqur Tahlil
            </h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold align-middle">DEMO MA&apos;LUMOT</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
              Real-time Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Server yuki, darslarni o&apos;zlashtirish tezligi va AI tutor bilan muloqot statistikasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kunlik Faol Foydalanuvchilar (DAU)</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">2,480</p>
            <p className="text-xs text-emerald-400 font-semibold mt-1">+14% o&apos;tgan haftaga nisbatan</p>
            <div className="mt-4 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-[78%]" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Tutor So&apos;rovlari Soni</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">48,920</p>
            <p className="text-xs text-purple-400 font-semibold mt-1">O&apos;rtacha javob tezligi: 0.8s (Gemini Flash)</p>
            <div className="mt-4 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-[92%]" />
            </div>
          </div>

          <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ovozli Mashg&apos;ulotlar Vaqti</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black text-white">14,200 daq</p>
            <p className="text-xs text-emerald-400 font-semibold mt-1">Audio oqimi 100% barqaror</p>
            <div className="mt-4 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[65%]" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
