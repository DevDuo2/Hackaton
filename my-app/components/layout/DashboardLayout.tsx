'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Mic,
  Trophy,
  TrendingUp,
  User,
  Settings,
  Menu,
  LogOut,
  Flame,
  Shield,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react';
import { MOCK_USER, SUBJECTS } from '../../data/mockData';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState('matematika');
  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    avatar: MOCK_USER.avatar,
    role: 'student',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSub = localStorage.getItem('voxy_active_subject');
      if (savedSub) setActiveSubjectId(savedSub);

      const authData = localStorage.getItem('voxy_auth_user');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          setCurrentUser((prev) => ({
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
            avatar: parsed.avatar || prev.avatar,
            role: parsed.role || prev.role,
          }));
        } catch (e) {}
      }
    }
  }, []);

  const changeSubject = (subId: string) => {
    setActiveSubjectId(subId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('voxy_active_subject', subId);
      window.dispatchEvent(new Event('voxy_subject_changed'));
    }
    setShowSubjectMenu(false);
  };

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  const studentNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mavzular & Kurslar', href: '/courses', icon: BookOpen },
    {
      name: 'AI Murabbiy',
      href: '/ai-tutor',
      icon: Sparkles,
      highlight: true,
      badge: 'AI',
    },
    {
      name: 'Ovozli Muloqot',
      href: '/speaking',
      icon: Mic,
      highlight: true,
      badge: 'Telegram',
    },
    { name: 'Testlar & Quiz', href: '/games', icon: Trophy },
    { name: 'Natijalarim', href: '/progress', icon: TrendingUp },
    { name: 'Profil', href: '/profile', icon: User },
    { name: 'Sozlamalar', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Student Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-white border-r border-slate-100 shrink-0 select-none">
        {/* Brand */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              V
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1E293B]">
                VOXY
              </span>
              <span className="block text-[10px] text-[#2563EB] uppercase tracking-wider font-bold">
                Student Portal
              </span>
            </div>
          </Link>
        </div>

        {/* User Mini Profile Card */}
        <div className="p-3 mx-3 my-2 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100/60 flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1E293B] truncate">
              {currentUser.name}
            </p>
            <div className="flex items-center gap-1 text-[11px] text-[#2563EB] font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
              <span>12 kunlik seriya</span>
            </div>
          </div>
        </div>

        {/* Active Subject Selector Card */}
        <div className="relative p-2 mx-3 mb-2">
          <div
            onClick={() => setShowSubjectMenu(!showSubjectMenu)}
            className="p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-[#2563EB] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                Fan:
              </span>
              <ChevronDown className="w-3 h-3 text-[#2563EB]" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg">{currentSubject.iconSymbol}</span>
              <span className="text-xs font-bold text-[#1E293B] truncate">
                {currentSubject.name}
              </span>
            </div>
          </div>

          {/* Subject Dropdown Menu */}
          {showSubjectMenu && (
            <div className="absolute top-full left-2 right-2 z-50 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 space-y-1 max-h-72 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-[#64748B] uppercase">
                Fanni almashtirish:
              </div>
              {SUBJECTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => changeSubject(s.id)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                    s.id === currentSubject.id
                      ? 'text-[#2563EB] bg-blue-50/60'
                      : 'text-[#1E293B]'
                  }`}
                >
                  <span className="text-base">{s.iconSymbol}</span>
                  <span className="truncate">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-1">
          {studentNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? item.highlight
                      ? 'bg-[#8B5CF6] text-white shadow-md shadow-purple-500/25'
                      : 'bg-[#2563EB] text-white shadow-md shadow-blue-500/25'
                    : item.highlight
                    ? 'text-[#8B5CF6] hover:bg-purple-50'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-[#8B5CF6]'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-100 text-[#8B5CF6]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Role Switcher & Sign Out */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            href="/admin"
            className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 hover:text-[#2563EB] hover:bg-blue-50 rounded-xl transition-colors border border-dashed border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Admin Hub</span>
            </div>
            <ArrowRightLeft className="w-3 h-3 text-slate-400" />
          </Link>

          <Link
            href="/login"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('voxy_auth_user');
                localStorage.removeItem('voxy_auth_token');
              }
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Chiqish</span>
          </Link>
        </div>
      </aside>

      {/* Main Student Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Student Top Header */}
        <header className="h-18 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active Subject Pill Button for Quick Switch */}
            <div
              onClick={() => setShowSubjectMenu(!showSubjectMenu)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 cursor-pointer hover:bg-blue-100/60 transition-colors"
            >
              <span className="text-base">{currentSubject.iconSymbol}</span>
              <span className="text-xs font-bold text-[#2563EB]">
                {currentSubject.name}
              </span>
              <span className="text-[10px] text-[#64748B] bg-white px-2 py-0.5 rounded-md font-semibold border border-blue-100 hidden sm:inline">
                O'zgartirish
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/ai-tutor"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-[#8B5CF6] hover:bg-purple-100 text-xs font-semibold transition-colors border border-purple-200/60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Murabbiy</span>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#2563EB]/15"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-[#1E293B] leading-tight">
                  {currentUser.name.split(' ')[0]}
                </p>
                <p className="text-[11px] text-[#64748B] leading-tight">
                  {currentSubject.name} o'quvchisi
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
