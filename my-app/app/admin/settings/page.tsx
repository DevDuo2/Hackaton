'use client';

import React, { useState } from 'react';
import { ShieldCheck, Save, Server, Lock, CheckCircle2, Globe, Database, Key } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('VOXY AI Learning Platform');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tizim Sozlamalari & Xavfsizlik Siyosati
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              Root Sozlamalar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global konfiguratsiyalar, RBAC xavfsizlik qoidalari va server parametrlari.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <span>Platforma Asosiy Parametrlari</span>
            </h3>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saqlandi
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Platforma Nomi (Brand Name)
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full max-w-md px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-white">Ommaviy Ro'yxatdan O'tish (Open Registration)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Yangi talabalarga bosh sahifadan erkin ro'yxatdan o'tishga ruxsat berish</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-white">Texnik Tanaffus Rejimi (Maintenance Mode)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Baza yangilanganda yoki texnik ishlarda talabalar kirishini vaqtincha cheklash</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button
              type="button"
              onClick={handleSave}
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 border-0"
            >
              Sozlamalarni Saqlash
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
