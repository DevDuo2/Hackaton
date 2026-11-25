'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  Activity,
  Plus,
  Search,
  Database,
  Server,
  Cpu,
  RefreshCw,
  Sparkles,
  Bot,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';




import { MOCK_ADMIN_STATS } from '../../data/mockData';
import { API_BASE_URL, fetchAdminStats, type AdminStats } from '../../lib/api';

export default function AdminOverviewPage() {
  // Jonli ko'rsatkichlar: null = hali ma'lum emas. Ilgari bu yerda
  // MOCK_ADMIN_STATS turardi va so'rov muvaffaqiyatsiz bo'lsa ham ekranda
  // «14 820 talaba, 412 online» ishonchli ko'rinib qolardi.
  const [liveStats, setLiveStats] = useState<AdminStats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  // Pastdagi jadval ataylab namunaviy — u «DEMO» deb belgilangan.
  const demoStudents = MOCK_ADMIN_STATS.recentStudents;
  // Boshlang'ich qiymat "ulangan" deb yozilmaydi: holat API javobidan keladi.
  const [dbName, setDbName] = useState('Tekshirilmoqda...');
  const [serverHealth, setServerHealth] = useState('Tekshirilmoqda...');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  /** Serverdan kelgan ko'rsatkichlarni holatga yozadi. */
  const applyStats = (data: AdminStats, elapsedMs: number) => {
    setLatencyMs(Math.round(elapsedMs));
    setLiveStats(data);
    setStatsFailed(false);
    if (data.database) setDbName(data.database);
    if (data.serverStatus) setServerHealth(data.serverStatus);
    setIsLiveConnected(true);
  };

  const markStatsUnavailable = (err: unknown) => {
    // Jonli ma'lumot kelmadi: ko'rsatkichlar «—» bo'lib qoladi va holat
    // maydonlari ham «Tekshirilmoqda...» da qotib qolmaydi.
    setIsLiveConnected(false);
    setStatsFailed(true);
    setLatencyMs(null);
    setDbName("Ma'lumot yo'q");
    setServerHealth("Javob bermayapti");
    console.warn('Admin statistikasi olinmadi:', err);
  };

  /** Tugma orqali qo'lda yangilash — spinner bilan. */
  const fetchLiveStats = async () => {
    setIsRefreshing(true);
    const startedAt = performance.now();
    try {
      // /api/admin/stats endi admin tokenini talab qiladi (apiRequest o'zi qo'shadi).
      applyStats(await fetchAdminStats(), performance.now() - startedAt);
    } catch (err) {
      markStatsUnavailable(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Birinchi yuklash: holat faqat promise callback ichida o'zgaradi.
  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    fetchAdminStats()
      .then((data) => {
        if (!cancelled) applyStats(data, performance.now() - startedAt);
      })
      .catch((err) => {
        if (!cancelled) markStatsUnavailable(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Backend bilan aloqa borligi va bazaning haqiqatan ulanganligi — ikki xil holat.
  const isDbConnected = /atlas/i.test(dbName);

  /** Noma'lum ko'rsatkich «—» bo'lib chiqadi — soxta son emas. */
  const kpi = (value: number | undefined) =>
    liveStats === null || value === undefined ? '—' : value.toLocaleString('uz-UZ');

  const filteredStudents = demoStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.course.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesSubject = filterSubject === 'All' || s.course.toLowerCase().includes(filterSubject.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        {/* Jonli ko'rsatkichlar kelmaganda buni YASHIRMAYMIZ: ilgari xato faqat
            console.warn ga tushar, ekranda esa mock raqamlar qolib ketardi. */}
        {statsFailed && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl bg-amber-950/30 border border-amber-800/50 px-4 py-3 text-sm text-amber-200"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Jonli ko&apos;rsatkichlarni backenddan olib bo&apos;lmadi, shuning
              uchun raqamlar &laquo;—&raquo; bo&apos;lib turadi. Backend ishlab
              turganini tekshirib, &laquo;Yangilash&raquo; tugmasini bosing.
            </span>
          </div>
        )}

        {/* Executive Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  VOXY Executive Console
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {isLiveConnected ? 'Render.com LIVE' : 'Bulutli Tizim Faol'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Platforma Nazorati va Telemetriyasi
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Talabalar faolligi, kurslar katalogi va Google Gemini sun&apos;iy intellekti bo&apos;yicha markaziy boshqaruv paneli.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchLiveStats}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-md hover:scale-102 active:scale-98 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Jonli Yangilash</span>
              </button>

              <Link
                href="/admin/courses"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 hover:scale-102 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Kurs Qo&apos;shish</span>
              </Link>
            </div>
          </div>

          {/* Quick System Status Pills */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Server className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">
                FastAPI:{' '}
                <strong className={isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isLiveConnected ? 'Online' : 'Javob bermayapti'}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                Baza:{' '}
                <strong className={isDbConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {dbName}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Bot className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">AI: <strong className="text-purple-400">Gemini 3.5 Flash</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              {/* O'ylab topilgan raqam emas — oxirgi so'rovning haqiqiy vaqti. */}
              <span className="truncate">
                Kechikish:{' '}
                <strong className="text-amber-400">
                  {latencyMs === null ? '—' : `${latencyMs} ms`}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Premium Glassmorphic KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Students */}
          <div className="group relative overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Jami Ro&apos;yxatdan O&apos;tganlar
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">
                {kpi(liveStats?.totalStudents)}
              </div>
              {/* «+14% bu oy» o'chirildi: o'sish dinamikasi hech qayerda saqlanmaydi. */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">{dbName}</span>
              </div>
            </div>

          </div>

          {/* Card 2: Active Learners Now */}
          <div className="group relative overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hozirgi Faol O&apos;quvchilar
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{kpi(liveStats?.activeUsersNow)}</span>
                <span className="text-sm font-semibold text-purple-400">online</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center font-bold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-800/40">
                  Konkurent oqim
                </span>
                <span className="text-slate-400 text-[11px]">Server yuki: Normal</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-[64%]" />
            </div>
          </div>

          {/* Card 3: Published Courses */}
          <div className="group relative overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-xl hover:border-emerald-500/50 transition-all duration-300 hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Faol Kurslar & Fanlar
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">
                {kpi(liveStats?.totalCourses)} ta kurs
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  3 asosiy yo&apos;nalish
                </span>
                <span className="text-slate-400 text-[11px]">32 ta dars moduli</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-[88%]" />
            </div>
          </div>

          {/* Card 4: AI Resolution Rate */}
          <div className="group relative overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-xl hover:border-amber-500/50 transition-all duration-300 hover:shadow-amber-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                AI Tutor Aniq Yechimlari
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">
                98.6%
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center font-bold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
                  Yuqori qoniqish
                </span>
                <span className="text-slate-400 text-[11px]">Gemini 3.5 javobi</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-[98%]" />
            </div>
          </div>
        </div>

        {/* Live System Architecture & Cloud Telemetry */}
        <div className="rounded-2xl bg-[#0F172A]/80 border border-slate-800 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span>Infratuzilma va Bulutli Xizmatlar Holati</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Render.com, MongoDB Atlas va Google Gemini API o&apos;rtasidagi uzluksiz telemetriya
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Holat API javobiga qarab ko'rsatiladi — doimiy "salomat" yozuvi emas. */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold ${
                  isLiveConnected
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isLiveConnected ? 'Backend bilan aloqa bor' : 'Backenddan javob yo’q'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">Backend API</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{API_BASE_URL}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className={`font-bold ${isLiveConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isLiveConnected ? '● Javob beryapti' : '○ Javob bermayapti'}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Python + FastAPI</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">Ma’lumotlar bazasi</p>
                {/* Klaster manzili ataylab ko'rsatilmaydi: bu infratuzilma tafsiloti. */}
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{dbName}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className={`font-bold ${isDbConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isDbConnected ? '● Bog‘langan' : '○ Xotira rejimi'}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{serverHealth}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">Google Gemini LLM Engine</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">gemini-3.5-flash-lite (Asinxron)</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="text-purple-400 font-bold">● Faol</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">O&apos;zbek tili optimallashtirilgan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Student Enrollments Table */}
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Talabalar namunasi</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  DEMO
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Bu jadval namunaviy ma&apos;lumot. Haqiqiy ro&apos;yxat:{' '}
                <Link href="/admin/students" className="text-blue-400 hover:underline font-semibold">
                  Student Directory
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                {['All', 'Matematika', 'Fizika', 'Dasturlash'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setFilterSubject(sub)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      filterSubject === sub
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Talabani qidirish..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8.5 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 w-48 sm:w-56"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Talaba Profili</th>
                  <th className="py-3.5 px-4">Tanlangan Yo&apos;nalish</th>
                  <th className="py-3.5 px-4">O&apos;zlashtirish Darajasi</th>
                  <th className="py-3.5 px-4">Qo&apos;shilgan Sanasi</th>
                  <th className="py-3.5 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#0F172A]/40">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id || idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        s.course.includes('Matematika')
                          ? 'bg-blue-950/60 text-blue-400 border border-blue-800/50'
                          : s.course.includes('Fizika')
                          ? 'bg-purple-950/60 text-purple-400 border border-purple-800/50'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                      }`}>
                        {s.course}
                      </span>
                    </td>
                    <td className="py-4 px-4 min-w-[160px]">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Progress</span>
                          <span className="font-bold text-emerald-400">{s.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-medium">{s.joined}</td>
                    <td className="py-4 px-4 text-right">
                      {/* Jadval «DEMO» deb belgilangan, bu qatorlar haqiqiy
                          talabalar emas — shuning uchun tugma o'chirilgan va
                          sababi aytilgan. Haqiqiy ro'yxat: /admin/students. */}
                      <button
                        type="button"
                        disabled
                        title="Namunaviy qator: haqiqiy profil uchun Student Directory bo'limiga o'ting"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-semibold text-xs opacity-50 cursor-not-allowed"
                      >
                        Batafsil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations Hub (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group rounded-2xl bg-[#0F172A]/80 border border-slate-800 p-6 shadow-xl hover:border-blue-500/50 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-2">Kurslar Katalogi Boshqaruvi</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Barcha 3 ta asosiy fanlar bo&apos;yicha mavzular, amaliy mashg&apos;ulotlar va dars modullarini boshqaring.
            </p>
            <Link
              href="/admin/courses"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Kurslar bo&apos;limiga o&apos;tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="group rounded-2xl bg-[#0F172A]/80 border border-slate-800 p-6 shadow-xl hover:border-purple-500/50 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-2">Talabalar Rekordlari & Tahlil</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              O&apos;quvchilar reytingi (Leaderboard), olingan XP ballari va kunlik streak ko&apos;rsatkichlarini ko&apos;ring.
            </p>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Talabalar profiliga o&apos;tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="group rounded-2xl bg-[#0F172A]/80 border border-slate-800 p-6 shadow-xl hover:border-amber-500/50 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-2">AI Testlar & Savollar Banki</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Sun&apos;iy intellekt tomonidan shakllantirilgan kunlik testlar va qadam-baqadam izohlarni sozlang.
            </p>
            <Link
              href="/admin/quizzes"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Savollar bankiga o&apos;tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
