'use client';

/**
 * Narxlar sahifasi.
 *
 * Bu yerda uchta bir xil "belgilar ro'yxati" kartasi YO'Q. Rejalar o'rtasidagi
 * yagona haqiqiy farq — kuniga nechta AI savol berish mumkinligi, va bu chegara
 * serverda amal qiladi (`backend/app/core/billing.py`). Shuning uchun asosiy
 * ko'rsatkich — shu sig'imning o'zi: 10 / 200 / cheksiz.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Mic, TriangleAlert } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import {
  ApiError,
  cancelSubscription,
  fetchPlans,
  fetchSubscription,
  subscribeToPlan,
  type Plan,
  type SubscriptionState,
} from '../../lib/api';
import { useSession } from '../../lib/clientStore';

const UNLIMITED_TICKS = 24;

/** Kunlik sig'im — chiziqchalar bilan. Raqam emas, HAJM ko'rinadi. */
function CapacityMeter({ perDay }: { perDay: number }) {
  const unlimited = perDay === 0;
  const filled = unlimited ? UNLIMITED_TICKS : Math.max(1, Math.round((perDay / 200) * UNLIMITED_TICKS));

  return (
    <div>
      <div className="flex items-end gap-[3px] h-9" aria-hidden="true">
        {Array.from({ length: UNLIMITED_TICKS }).map((_, i) => {
          const on = i < filled;
          return (
            <span
              key={i}
              className={`flex-1 rounded-[2px] transition-colors ${
                on ? 'bg-[#E0A42B]' : 'bg-[#2A3A44]'
              }`}
              style={{ height: `${40 + (i % 5) * 12}%` }}
            />
          );
        })}
      </div>
      <p className="mt-2 font-mono text-xs text-[#9FB2BC]">
        {unlimited ? 'cheksiz savol / kun' : `${perDay} savol / kun`}
      </p>
    </div>
  );
}

function formatSom(value: number): string {
  return value === 0 ? '0' : value.toLocaleString('uz-UZ');
}

export default function PricingPage() {
  const session = useSession();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [current, setCurrent] = useState<SubscriptionState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlans()
      .then(({ plans: loaded }) => !cancelled && setPlans(loaded))
      .catch((err) =>
        !cancelled &&
        setLoadError(
          err instanceof ApiError ? err.message : "Rejalarni yuklab bo'lmadi."
        )
      );
    return () => {
      cancelled = true;
    };
  }, []);

  // Obuna holati faqat kirgan foydalanuvchi uchun so'raladi. `setCurrent(null)`
  // effekt ichida chaqirilmaydi (react-hooks/set-state-in-effect): sessiya
  // yo'qligi quyida `session &&` bilan hisobga olinadi.
  const sessionId = session?.id ?? null;
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetchSubscription()
      .then(({ subscription }) => !cancelled && setCurrent(subscription))
      .catch(() => {
        /* Sessiya eskirgan bo'lishi mumkin — narxlar baribir ko'rinadi. */
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Chiqib ketilsa, eski obuna ma'lumoti ekranda qolmaydi.
  const currentForSession = sessionId ? current : null;

  const choose = async (planId: string) => {
    if (busyPlan) return;
    setBusyPlan(planId);
    setActionError(null);
    setNotice(null);
    try {
      const result =
        planId === 'bepul' ? await cancelSubscription() : await subscribeToPlan(planId);
      setCurrent(result.subscription);
      setNotice(result.message);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Rejani yoqib bo'lmadi."
      );
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F3F0] flex flex-col">
      <Navbar />

      {/* Sarlavha — quyuq sirli zamin, keng Archivo */}
      <header className="bg-[#0F2027] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E0A42B]">
            Rejalar
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[0.95] mt-4 max-w-3xl">
            Kuniga nechta savol
            <br />
            berishingiz mumkin.
          </h1>
          <p className="text-[#9FB2BC] mt-5 max-w-xl leading-relaxed">
            Rejalar orasidagi yagona farq shu. AI murabbiyning har bir javobi
            pullik, shuning uchun chegara serverda amal qiladi — uni brauzerdan
            aylanib o&apos;tib bo&apos;lmaydi.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* To'lov tizimi ulanmagani YASHIRILMAYDI. */}
        <div className="flex items-start gap-2.5 rounded-xl border border-[#E0A42B]/40 bg-[#E0A42B]/10 px-4 py-3 text-sm text-[#5C4410] mb-8">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>Demo rejim:</strong> to&apos;lov tizimi (Click / Payme) hali
            ulanmagan. Rejani tanlasangiz, u darhol yoqiladi va hech qanday pul
            yechilmaydi.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 mb-6"
          >
            {notice}
          </div>
        )}
        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 mb-6"
          >
            {actionError}
          </div>
        )}
        {loadError && (
          <div
            role="alert"
            className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {loadError}
          </div>
        )}

        {plans === null && !loadError && (
          <div className="flex items-center gap-2 text-sm text-[#5A6B74] py-16 justify-center" aria-busy="true">
            <Loader2 className="w-4 h-4 animate-spin" />
            Rejalar yuklanmoqda...
          </div>
        )}

        {plans !== null && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = currentForSession?.plan === plan.id;
              const isBusy = busyPlan === plan.id;
              return (
                <section
                  key={plan.id}
                  aria-label={plan.name}
                  className="flex flex-col rounded-2xl bg-[#13262F] text-white p-6 border transition-colors"
                  style={{ borderColor: isCurrent ? '#E0A42B' : '#233640' }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl font-bold">{plan.name}</h2>
                    {isCurrent && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F2027] bg-[#E0A42B] px-2 py-0.5 rounded">
                        Joriy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9FB2BC] mt-1 min-h-[2.5rem]">
                    {plan.tagline}
                  </p>

                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-bold tracking-tight">
                      {formatSom(plan.priceUzs)}
                    </span>
                    <span className="text-xs text-[#9FB2BC]">
                      so&apos;m / {plan.period}
                    </span>
                  </p>

                  <div className="mt-6">
                    <CapacityMeter perDay={plan.aiMessagesPerDay} />
                  </div>

                  <ul className="mt-6 space-y-2 text-sm flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#E0A42B] mt-0.5 shrink-0" />
                        <span className="text-[#D4DEE3]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.voiceEnabled && (
                    <p className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-[#7FD4D0]">
                      <Mic className="w-3.5 h-3.5" />
                      Ovozli suhbat yoqilgan
                    </p>
                  )}

                  <div className="mt-6">
                    {!session ? (
                      <Link
                        href="/register"
                        className="block w-full text-center rounded-xl bg-[#E0A42B] text-[#0F2027] font-bold text-sm py-2.5 hover:bg-[#EFB748] transition-colors"
                      >
                        Ro&apos;yxatdan o&apos;tish
                      </Link>
                    ) : isCurrent ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl border border-[#2F4652] text-[#9FB2BC] font-semibold text-sm py-2.5 cursor-not-allowed"
                      >
                        Joriy reja
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => choose(plan.id)}
                        disabled={isBusy}
                        className="w-full rounded-xl bg-[#E0A42B] text-[#0F2027] font-bold text-sm py-2.5 hover:bg-[#EFB748] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                        {plan.id === 'bepul' ? 'Bepulga qaytish' : `${plan.name} ni yoqish`}
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {currentForSession && (
          <p className="font-mono text-xs text-[#5A6B74] mt-8">
            Joriy reja: {currentForSession.planName}
            {currentForSession.aiMessagesLeftToday !== null && (
              <> · bugun qolgan savollar: {currentForSession.aiMessagesLeftToday}</>
            )}
            {currentForSession.expiresAt && (
              <> · amal qiladi: {currentForSession.expiresAt.slice(0, 10)}</>
            )}
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
