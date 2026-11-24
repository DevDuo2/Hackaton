'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  BookOpen,
  Trophy,
  BarChart3,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  ArrowRightLeft,
  GraduationCap,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const adminNavigation = [
    { name: 'Overview', href: '/admin', icon: ShieldAlert },
    { name: 'Course Management', href: '/admin/courses', icon: BookOpen },
    { name: 'Student Directory', href: '/admin/students', icon: Users },
    { name: 'Quiz & Challenge Ops', href: '/admin/quizzes', icon: Trophy },
    { name: 'Platform Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Admin Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-[#0F172A] text-slate-300 shrink-0 select-none">
        {/* Brand */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
              V
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                VOXY
              </span>
              <span className="block text-[10px] text-amber-400 uppercase tracking-wider font-extrabold">
                Admin Control
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Credentials Mini Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
            ADM
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              Admin Operator
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Full System Access</span>
            </div>
          </div>
        </div>

        {/* Admin Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
          {adminNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Switch back to Student Dashboard */}
        <div className="p-3 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2.5 text-xs font-bold text-blue-400 bg-blue-950/40 hover:bg-blue-900/50 rounded-xl transition-colors border border-blue-800/50"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>Back to Student Portal</span>
            </div>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Admin Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-slate-300 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
              V
            </div>
            <div>
              <span className="font-bold text-lg text-white">VOXY</span>
              <span className="block text-[10px] text-amber-400 font-bold">Admin Portal</span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {adminNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            <GraduationCap className="w-4 h-4" /> Switch to Student Portal
          </Link>
        </div>
      </div>

      {/* Main Admin Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Header */}
        <header className="h-18 bg-white border-b border-slate-100 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Admin Search */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students, courses, quiz databases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all text-[#1E293B]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live System Health Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-xs font-bold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live: 412 Students Active</span>
            </div>

            {/* Quick Switch Button */}
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold transition-colors border border-blue-200/60"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student View</span>
            </Link>

            <button
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-2 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-amber-400 flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#1E293B] leading-tight">Admin Console</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Superuser</p>
              </div>
            </div>
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
