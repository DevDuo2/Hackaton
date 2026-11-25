'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Mail, RefreshCw, Search, Users } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';

import { Button } from '../../../components/ui/Button';

import { ApiError, fetchAdminStudents, type AdminStudent } from '../../../lib/api';

export default function AdminStudentsPage() {
  // Shapkadagi qidiruv `?q=` bilan shu sahifaga olib keladi — boshlang'ich
  // qiymat sifatida o'qiladi, aks holda qidiruv natijasi yo'qolib ketardi.
  // `useSearchParams` ataylab ishlatilmaydi: u statik prerender uchun
  // <Suspense> talab qiladi va butun sahifa buildda yiqilardi. Qiymat faqat
  // brauzerda kerak, shuning uchun lazy initializer bilan o'qiladi.
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') ?? '';
  });
  // Ro'yxat haqiqiy /api/admin/students dan keladi. Ilgari bu sahifa mock
  // talabalarni ko'rsatib, yonida «MongoDB Atlas Sinxron» deb yozardi.
  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchAdminStudents()
      .then((data) => {
        if (cancelled) return;
        setStudents(data.students);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setStudents([]);
        setError(
          err instanceof ApiError ? err.message : "Talabalar ro'yxatini olib bo'lmadi."
        );
      })
      .finally(() => {
        if (!cancelled) setIsRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const reload = () => {
    setIsRefreshing(true);
    setReloadToken((n) => n + 1);
  };

  const isLoading = students === null;
  const query = search.toLowerCase().trim();
  const filtered = (students ?? []).filter(
    (s) =>
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Talabalar Bazasini Boshqarish
              </h1>
              {/* Belgi haqiqiy holatni ko'rsatadi, qotib qolgan yozuv emas. */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  error
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}
              >
                {isLoading ? 'Yuklanmoqda…' : error ? 'Aloqa yo‘q' : 'Serverdan jonli'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Ro&apos;yxatdan o&apos;tgan foydalanuvchilar, to&apos;plangan XP va javob berilgan
              test savollari soni.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={isRefreshing}
              icon={
                isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )
              }
              className="bg-slate-900 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800"
            >
              Yangilash
            </Button>
          </div>
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
              Jami ro&apos;yxatda:{' '}
              <strong className="text-white">
                {isLoading ? '…' : (students ?? []).length}
              </strong>{' '}
              ta foydalanuvchi
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-xs font-semibold">Talabalar yuklanmoqda…</p>
            </div>
          ) : error ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={reload}
                className="bg-slate-900 border-slate-700 text-slate-200"
              >
                Qayta urinish
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {query
                  ? `«${search}» bo'yicha hech kim topilmadi`
                  : 'Hali ro‘yxatdan o‘tgan foydalanuvchi yo‘q'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Foydalanuvchi</th>
                    <th className="py-3.5 px-4">Rol</th>
                    <th className="py-3.5 px-4">Tanlangan fan</th>
                    <th className="py-3.5 px-4">Javob bergan savollar</th>
                    <th className="py-3.5 px-4 text-right">XP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0F172A]/40">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                            {s.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal truncate">
                              {s.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            s.role === 'admin'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {s.role === 'admin' ? 'Administrator' : "O'quvchi"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {s.selectedSubject ?? '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {s.answeredCount ?? 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        {(s.totalXP ?? 0).toLocaleString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            Xabarnoma yuborish funksiyasi hali ulanmagan.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
