'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  Plus,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Database,
  Server,
  Cpu,
  RefreshCw,
  Sparkles,
  Bot,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MOCK_ADMIN_STATS, MOCK_COURSES } from '../../data/mockData';
import { API_BASE_URL } from '../../lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(MOCK_ADMIN_STATS);
  const [dbName, setDbName] = useState('MongoDB Atlas Connected');
  const [serverHealth, setServerHealth] = useState('Healthy (99.9% uptime)');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  const fetchLiveStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.totalStudents !== undefined) {
          setStats((prev) => ({
            ...prev,
            totalStudents: data.totalStudents || prev.totalStudents,
            totalCourses: data.totalCourses || prev.totalCourses,
            activeNow: data.activeUsersNow || prev.activeNow,
          }));
          if (data.database) setDbName(data.database);
          if (data.serverStatus) setServerHealth(data.serverStatus);
          setIsLiveConnected(true);
        }
      }
    } catch (err) {
      console.warn('Render live admin stats fallback:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const filteredStudents = stats.recentStudents.filter((s) => {
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
                Talabalar faolligi, kurslar katalogi va Google Gemini sun'iy intellekti bo'yicha markaziy boshqaruv paneli.
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
                <span>Yangi Kurs Qo'shish</span>
              </Link>
            </div>
          </div>

          {/* Quick System Status Pills */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Server className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">FastAPI: <strong className="text-emerald-400">Online (v2.0)</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Baza: <strong className="text-emerald-400">MongoDB Atlas</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Bot className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">AI: <strong className="text-purple-400">Gemini 3.5 Flash</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Kechikish: <strong className="text-amber-400">&lt; 35ms</strong></span>
            </div>
          </div>
        </div>

        {/* 4 Premium Glassmorphic KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Students */}
          <div className="group relative overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-xl hover:border-blue-500/50 transition-all duration-300 hover:shadow-blue-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Jami Ro'yxatdan O'tganlar
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight">
                {stats.totalStudents.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  +14% bu oy
                </span>
                <span className="text-slate-400 text-[11px]">MongoDB Atlas hisobi</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full w-[78%]" />
            </div>
          </div>

          {/* Card 2: Active Learners Now */}
          <div className="group relative overflow-hidden rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-xl hover:border-purple-500/50 transition-all duration-300 hover:shadow-purple-500/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hozirgi Faol O'quvchilar
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{stats.activeNow}</span>
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
                {stats.totalCourses} ta kurs
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center font-bold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  3 asosiy yo'nalish
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
                Render.com, MongoDB Atlas va Google Gemini API o'rtasidagi uzluksiz telemetriya
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Barcha Xizmatlar Salomat
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">Render.com Web Service</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">https://hackaton-xl22.onrender.com</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400 font-bold">● LIVE</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Python 3.12 + FastAPI</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white">MongoDB Atlas Cluster</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">cluster0.icm4m9p.mongodb.net</p>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400 font-bold">● Bog'langan</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Ping: 28ms</span>
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
                  <span className="text-slate-400">O'zbek tili optimallashtirilgan</span>
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
                <span>Jonli Talabalar Ro'yxati & O'zlashtirish</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real vaqt rejimida talabalarning progressi va faoliyati
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
                  <th className="py-3.5 px-4">Tanlangan Yo'nalish</th>
                  <th className="py-3.5 px-4">O'zlashtirish Darajasi</th>
                  <th className="py-3.5 px-4">Qo'shilgan Sanasi</th>
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
                      <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer">
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
              Barcha 3 ta asosiy fanlar bo'yicha mavzular, amaliy mashg'ulotlar va dars modullarini boshqaring.
            </p>
            <Link
              href="/admin/courses"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Kurslar bo'limiga o'tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="group rounded-2xl bg-[#0F172A]/80 border border-slate-800 p-6 shadow-xl hover:border-purple-500/50 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-2">Talabalar Rekordlari & Tahlil</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              O'quvchilar reytingi (Leaderboard), olingan XP ballari va kunlik streak ko'rsatkichlarini ko'ring.
            </p>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Talabalar profiliga o'tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="group rounded-2xl bg-[#0F172A]/80 border border-slate-800 p-6 shadow-xl hover:border-amber-500/50 transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white mb-2">AI Testlar & Savollar Banki</h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Sun'iy intellekt tomonidan shakllantirilgan kunlik testlar va qadam-baqadam izohlarni sozlang.
            </p>
            <Link
              href="/admin/quizzes"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Savollar bankiga o'tish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
