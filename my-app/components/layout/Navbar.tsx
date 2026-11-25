'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, BookOpen, Trophy, LayoutDashboard, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSession } from '../../lib/clientStore';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Navbar sessiyani biladi. Ilgari «Dashboard» tugmasi hammaga ko'rinardi:
  // kirmagan odam uni bosib, himoyalangan sahifada bir lahza spinner ko'rar va
  // login ekraniga uloqtirilardi — «bosh sahifa darhol dashboardga o'tib
  // ketyapti» degan tuyg'u aynan shundan edi.
  const session = useSession();
  const isLoggedIn = session !== null;

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            V
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#1E293B] leading-none">
              VOXY
            </span>
            <span className="text-[10px] text-[#64748B] tracking-wider uppercase font-medium">
              AI Learning
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        {/* 768px da logo + 4 havola + 3 tugma sig'masdi (gorizontal scroll).
            To'liq menyu endi lg: dan, undan kichik ekranlarda — drawer. */}
        <nav className="hidden lg:flex items-center gap-1 lg:gap-2">
          <Link
            href="/"
            className="px-3.5 py-2 text-sm font-medium text-[#1E293B] hover:text-[#2563EB] rounded-lg transition-colors"
          >
            Bosh Sahifa
          </Link>
          <Link
            href="/courses"
            className="px-3.5 py-2 text-sm font-medium text-[#64748B] hover:text-[#2563EB] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            Fanlar & Kurslar
          </Link>
          <Link
            href="/ai-tutor"
            className="px-3.5 py-2 text-sm font-medium text-[#8B5CF6] hover:text-[#7C3AED] rounded-lg transition-colors flex items-center gap-1.5 bg-purple-50/60 hover:bg-purple-50"
          >
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            AI Murabbiy
          </Link>
          <Link
            href="/games"
            className="px-3.5 py-2 text-sm font-medium text-[#64748B] hover:text-[#2563EB] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-slate-400" />
            Sinov Testlari
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button variant="primary" size="sm" icon={<LayoutDashboard className="w-4 h-4" />}>
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Kirish
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />}>
                  Ro&apos;yxatdan O&apos;tish
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            Bosh Sahifa
          </Link>
          <Link
            href="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-600 hover:bg-slate-50"
          >
            Fanlar & Kurslar
          </Link>
          <Link
            href="/ai-tutor"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-[#8B5CF6] bg-purple-50"
          >
            ✨ AI Murabbiy
          </Link>
          <Link
            href="/games"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-600 hover:bg-slate-50"
          >
            🏆 Sinov Testlari
          </Link>
          <div className="pt-4 flex flex-col gap-2 border-t border-slate-100">
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Kirish
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Yangi Ro&apos;yxatdan O&apos;tish
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
