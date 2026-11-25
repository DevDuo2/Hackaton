'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';

import { saveSession } from '../../../lib/auth';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  GraduationCap,
  KeyRound
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  // Admin paroli ataylab bo'sh: ochiq qolgan brauzerda Enter bosib admin
  // paneliga kirib bo'lmasin. Hakamlar uchun pastdagi «Demo» tugmasi bor.
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || data.detail || 'Admin kirishida xatolik yuz berdi');
        setIsLoading(false);
        return;
      }

      saveSession(data.user, data.token);

      // Redirect directly to Admin Overview Dashboard
      router.push('/admin');
    } catch {
      setErrorMessage('Server bilan bog\'lanishda xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl shadow-blue-900/20 mb-5">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          VOXY Admin Control
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Administratorlar va tizim nazoratchilari uchun maxsus xavfsiz portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0F172A]/90 border border-slate-800/90 rounded-2xl shadow-2xl p-7 sm:p-8 backdrop-blur-md">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Admin Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Admin Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 transition-all font-medium"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Xavfsizlik tekshiruvi...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Paneliga Kirish</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              )}
            </Button>
          </form>

          {/* Quick Credential Helper for Hakaton demo */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={quickFillAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-amber-950/30 hover:bg-amber-900/40 px-3 py-1.5 rounded-lg border border-amber-800/40 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Hakaton Demo: admin / admin123 to&apos;ldirish</span>
            </button>
          </div>
        </div>

        {/* Back to Student Portal Link */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Talabalar kirish portaliga qaytish</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
