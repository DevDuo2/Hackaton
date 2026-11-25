'use client';

/**
 * Tizim sozlamalari.
 *
 * Ilgari bu sahifa yolg'on gapirardi: `handleSave` faqat `setSaved(true)`
 * qilardi, hech qanday so'rov yuborilmasdi va kalitchalar ham hech narsaga
 * ta'sir qilmasdi. Admin yashil «Saqlandi» ni ko'rib, sahifani yangilaganda
 * eski qiymatni topardi.
 *
 * Endi qiymatlar `/api/admin/settings` dan yuklanadi, PUT bilan saqlanadi va
 * «Saqlandi» yozuvi faqat server QAYTA O'QILGAN holatni qaytargandan keyin
 * chiqadi. Kalitchalar backendda haqiqatan kuchga kiradi.
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Save, Server } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Button } from '../../../components/ui/Button';
import {
  ApiError,
  fetchPlatformSettings,
  savePlatformSettings,
  type PlatformSettings,
} from '../../../lib/api';

type Status = 'loading' | 'ready' | 'load-failed';

export default function AdminSettingsPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [form, setForm] = useState<PlatformSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlatformSettings()
      .then(({ settings }) => {
        if (cancelled) return;
        setForm(settings);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('load-failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (changes: Partial<PlatformSettings>) => {
    setForm((prev) => (prev ? { ...prev, ...changes } : prev));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const { settings } = await savePlatformSettings(form);
      // Serverdan qaytgan holat bilan almashtiriladi: ekranda haqiqatda
      // saqlangan qiymat turadi, yuborilgan emas.
      setForm(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Sozlamalarni saqlab bo'lmadi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tizim Sozlamalari &amp; Xavfsizlik Siyosati
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              Root Sozlamalar
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Global konfiguratsiyalar va server parametrlari. O&apos;zgarishlar
            darhol kuchga kiradi.
          </p>
        </div>

        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" />
              <span>Platforma Asosiy Parametrlari</span>
            </h2>
            {saved && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saqlandi
              </span>
            )}
          </div>

          {status === 'loading' && (
            <div
              className="flex items-center gap-2 text-sm text-slate-300 py-6"
              aria-busy="true"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Sozlamalar yuklanmoqda...
            </div>
          )}

          {status === 'load-failed' && (
            <div
              role="alert"
              className="flex items-start gap-2 text-sm text-amber-200 bg-amber-950/30 border border-amber-800/50 rounded-xl px-4 py-3"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Sozlamalarni serverdan yuklab bo&apos;lmadi. Backend ishlab
                turganini tekshirib, sahifani yangilang.
              </span>
            </div>
          )}

          {status === 'ready' && form && (
            <>
              {saveError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-sm text-red-200 bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-3"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="platform-name"
                  className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2"
                >
                  Platforma Nomi (Brand Name)
                </label>
                <input
                  id="platform-name"
                  type="text"
                  value={form.platformName}
                  onChange={(e) => patch({ platformName: e.target.value })}
                  maxLength={120}
                  className="w-full max-w-md px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/40"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="min-w-0">
                  <label
                    htmlFor="allow-registration"
                    className="text-xs font-bold text-white cursor-pointer"
                  >
                    Ommaviy Ro&apos;yxatdan O&apos;tish
                  </label>
                  <p className="text-[11px] text-slate-300 mt-0.5 break-words">
                    O&apos;chirilsa, <code>/api/auth/register</code> yangi
                    akkauntlarni qabul qilmaydi
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="allow-registration"
                    type="checkbox"
                    checked={form.allowRegistration}
                    onChange={(e) => patch({ allowRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <div className="min-w-0">
                  <label
                    htmlFor="maintenance-mode"
                    className="text-xs font-bold text-white cursor-pointer"
                  >
                    Texnik Tanaffus Rejimi
                  </label>
                  <p className="text-[11px] text-slate-300 mt-0.5 break-words">
                    Yoqilsa, talabalar test javobini yubora olmaydi (admin
                    cheklanmaydi)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    id="maintenance-mode"
                    type="checkbox"
                    checked={form.maintenanceMode}
                    onChange={(e) => patch({ maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-amber-600 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-400 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              {form.maintenanceMode && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/30 border border-amber-800/50 rounded-xl px-4 py-3"
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Texnik tanaffus yoqilgan: talabalar uchun test topshirish
                    vaqtincha to&apos;xtatilgan. Demodan oldin o&apos;chirishni
                    unutmang.
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  variant="primary"
                  size="sm"
                  icon={
                    isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )
                  }
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/30 border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saqlanmoqda...' : 'Sozlamalarni Saqlash'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
