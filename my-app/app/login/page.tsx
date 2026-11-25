'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { saveSession } from '../../lib/auth';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('student@voxy.edu');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Kirishda xatolik yuz berdi');
        setIsLoading(false);
        return;
      }

      // Token javobning yuqori darajasida keladi (`data.token`), `data.user` ichida emas.
      saveSession(data.user, data.token);

      // Role-based routing
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        const savedSubject = typeof window !== 'undefined' ? localStorage.getItem('voxy_active_subject') : null;
        if (savedSubject) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    } catch {
      setErrorMessage('Server bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (type: 'student' | 'admin') => {
    setErrorMessage('');
    if (type === 'student') {
      setEmail('student@voxy.edu');
      setPassword('password123');
    } else {
      setEmail('admin@voxy.edu');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="text-2xl font-black tracking-tight text-[#1E293B]">VOXY</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#1E293B]">Tizimga Kirish</h2>
        <p className="mt-2 text-sm text-[#64748B]">
          Shaxsiy ta&apos;lim profilingizga kiring
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="p-8">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                Elektron pochta (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@voxy.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all text-[#1E293B]"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  Parol
                </label>
                <a href="#" className="text-xs text-[#2563EB] hover:underline">
                  Parolni unutdingizmi?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all text-[#1E293B]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              )}
            </Button>
          </form>

          {/* One-click Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials('student')}
                icon={<UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />}
                className="w-full text-xs"
              >
                Talaba Profili (Demo kirish)
              </Button>

              <Link
                href="/admin/login"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Administratorlar Boshqaruv Portali (/admin/login)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-[#64748B] mt-6">
          Profilingiz yo&apos;qmi?{' '}
          <Link href="/register" className="font-semibold text-[#2563EB] hover:underline">
            Yangi akkaunt ochish
          </Link>
        </p>
      </div>
    </div>
  );
}
