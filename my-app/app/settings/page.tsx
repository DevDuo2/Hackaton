'use client';

import React, { useEffect, useState } from 'react';
import {
  Save,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';
import {
  ApiError,
  fetchMe,
  fetchSubscription,
  updateProfileApi,
  type SubscriptionState,
} from '../../lib/api';
import { getSession, getToken, saveSession, type UserSession } from '../../lib/auth';
import { useSession } from '../../lib/clientStore';

interface ProfileFields {
  name: string;
  language: string;
  notifications: boolean;
}

export default function SettingsPage() {
  // Obuna holati: UI uni ko'rsatadi, boshqaruv esa /pricing da.
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  // Uch qatlam: sessiya (darhol) -> serverdan kelgan profil -> foydalanuvchi tahriri.
  // Shu tartib tufayli effekt ichida setState qilish kerak emas.
  const session = useSession();
  const [loaded, setLoaded] = useState<(ProfileFields & { email: string }) | null>(null);
  const [draft, setDraft] = useState<Partial<ProfileFields>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const name = draft.name ?? loaded?.name ?? session?.name ?? '';
  const email = loaded?.email ?? session?.email ?? '';
  const language = draft.language ?? loaded?.language ?? 'uz';
  const notifications = draft.notifications ?? loaded?.notifications ?? true;
  const isLoading = loaded === null && session === null;

  const setName = (value: string) => setDraft((prev) => ({ ...prev, name: value }));
  const setLanguage = (value: string) => setDraft((prev) => ({ ...prev, language: value }));
  const setNotifications = (value: boolean) =>
    setDraft((prev) => ({ ...prev, notifications: value }));

  useEffect(() => {
    let cancelled = false;
    fetchSubscription()
      .then(({ subscription: state }) => !cancelled && setSubscription(state))
      .catch(() => {
        /* Obuna holati ko'rinmasa ham sozlamalar ishlashda davom etadi. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then((data) => {
        if (cancelled) return;
        const user = data.user as typeof data.user & {
          language?: string;
          notifications?: boolean;
        };
        setLoaded({
          name: user.name,
          email: user.email,
          language: user.language ?? 'uz',
          notifications: user.notifications ?? true,
        });
      })
      .catch(() => {
        // Profil kelmasa sessiyadagi ma'lumot bilan ishlashda davom etamiz.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Ism bo‘sh bo‘lmasligi kerak.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    setSaved(false);
    try {
      const res = await updateProfileApi({ name: name.trim(), language, notifications });
      // Sidebar va profil sahifasi sessiyadan o'qiydi — uni ham yangilaymiz.
      const session = getSession();
      const token = getToken();
      if (session && token) {
        saveSession({ ...session, ...(res.user as Partial<UserSession>) } as UserSession, token);
      }
      setDraft({}); // endi haqiqiy manba — serverdagi profil
      setLoaded((prev) =>
        prev ? { ...prev, name: name.trim(), language, notifications } : prev
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Saqlab bo‘lmadi. Qaytadan urinib ko‘ring.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Sozlamalar
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Profil ma&apos;lumotlari, bildirishnomalar va obuna rejangiz.
          </p>
        </div>

        {/* Obuna — joriy reja va bugungi limit. Boshqarish narxlar sahifasida. */}
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-[#1E293B]">Obuna rejasi</h2>
              {subscription === null ? (
                <p className="text-xs text-[#64748B] mt-1">Yuklanmoqda...</p>
              ) : (
                <>
                  <p className="text-lg font-black text-[#1E293B] mt-1">
                    {subscription.planName}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {subscription.aiMessagesLeftToday === null
                      ? 'Cheksiz AI savollar'
                      : `Bugun yana ${subscription.aiMessagesLeftToday} ta AI savol`}
                    {subscription.expiresAt
                      ? ` · amal qiladi ${subscription.expiresAt.slice(0, 10)}`
                      : ''}
                  </p>
                </>
              )}
            </div>
            <Link
              href="/pricing"
              className="rounded-xl bg-[#0F2027] text-white text-xs font-bold px-4 py-2.5 hover:bg-[#1A3340] transition-colors shrink-0"
            >
              Rejalarni ko&apos;rish
            </Link>
          </div>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Account Details */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[#1E293B]">Hisob ma&apos;lumotlari</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Ism
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Email manzil
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  aria-describedby="email-note"
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-[#64748B] cursor-not-allowed"
                />
                <p id="email-note" className="text-[11px] text-[#64748B] mt-1">
                  Email hisobni aniqlovchi maydon — uni o&apos;zgartirish uchun qo&apos;llab-quvvatlashga murojaat qiling.
                </p>
              </div>
            </div>
          </Card>

          {/* Afzalliklar */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[#1E293B]">Afzalliklar</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#1E293B]">Interfeys tili</h4>
                  <p className="text-xs text-[#64748B]">Sayt qaysi tilda ko&apos;rinishini tanlang</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="uz">O&apos;zbek (Lotin)</option>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                </select>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#1E293B]">Kunlik eslatmalar</h4>
                  <p className="text-xs text-[#64748B]">Faollik seriyasini uzmaslik uchun eslatma olish</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#1E293B]">Ko&apos;rinish</h4>
                  <p className="text-xs text-[#64748B]">Hozircha faqat yorug&apos; ko&apos;rinish</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-[#64748B] rounded-lg">
                  Yorug&apos; ko&apos;rinish
                </span>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || isLoading}
              icon={
                isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              }
            >
              {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
            {saved && (
              <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
                ✓ Profil serverda saqlandi
              </span>
            )}
            {errorMessage && (
              <span className="text-xs font-semibold text-rose-600">{errorMessage}</span>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
