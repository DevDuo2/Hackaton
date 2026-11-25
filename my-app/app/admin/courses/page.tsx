'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';

import { Button } from '../../../components/ui/Button';
import { MOCK_COURSES } from '../../../data/mockData';

export default function AdminCoursesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = MOCK_COURSES.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kurslar Katalogi & O&apos;quv Rejasi
              </h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold align-middle">DEMO MA&apos;LUMOT</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                {MOCK_COURSES.length} ta Faol Kurs
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Platforma darslari, modullar, o&apos;qituvchilar va yuklangan o&apos;quv materiallarini boshqaring.
            </p>
          </div>
          {/* Kurs yaratish backendda hali yo'q. Tugma ataylab o'chirilgan va
              sababi aytilgan: ishlayotgandek ko'rinib, bosilganda hech narsa
              qilmaslik — eng yomon variant. */}
          <Button
            variant="primary"
            size="sm"
            disabled
            title="Kurs yaratish demo doirasiga kirmaydi: backendda bunday endpoint yo'q"
            icon={<Plus className="w-4 h-4" />}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Yangi Kurs Yaratish
          </Button>
        </div>

        {/* Courses Table Container */}
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kurs nomi yoki yo'nalish bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              {['All', ...Array.from(new Set(MOCK_COURSES.map((c) => c.category))).sort()].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Kurs Nomi & Modullar</th>
                  <th className="py-3.5 px-4">Kategoriya</th>
                  <th className="py-3.5 px-4">Darajasi</th>
                  <th className="py-3.5 px-4">O&apos;quvchilar Soni</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#0F172A]/40">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <Image src={c.image} alt={c.title} className="w-10 h-10 rounded-xl object-cover border border-slate-800" 
                        width={40}
                        height={40}
                      />
                      <div>
                        <p className="text-white font-bold">{c.title}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{c.duration} • {c.lessonsCount} ta dars</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/50 text-[11px] font-semibold">
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                        {c.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{c.studentsCount.toLocaleString()} ta</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Chiqarilgan (Live)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        disabled
                        title="Kursni tahrirlash demo doirasiga kirmaydi"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-semibold text-xs opacity-50 cursor-not-allowed"
                      >
                        Tahrirlash
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-slate-400">
                      {/* Ilgari filtr hech narsa topmaganda jadvalda faqat
                          sarlavhalar qolar va sahifa buzilgandek ko'rinardi. */}
                      <p className="text-sm font-semibold text-slate-300">
                        Hech narsa topilmadi
                      </p>
                      <p className="text-xs mt-1">
                        Qidiruv so&apos;zini yoki kategoriyani o&apos;zgartirib
                        ko&apos;ring.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
