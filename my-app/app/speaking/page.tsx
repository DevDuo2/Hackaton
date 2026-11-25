'use client';

import React, { useState } from 'react';
import {
  Send,
  MessageSquare,
  Mic,
  ExternalLink,
  Settings2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useStoredString } from '../../lib/clientStore';

const BOT_USERNAME_KEY = 'voxy_bot_username';
/**
 * Haqiqiy bot: @lockbridge_bot (Telegram getMe tasdiqladi, ko'rinadigan nomi
 * «Voxy»). Ilgari zaxira qiymat `voxy_speaking_bot` edi — bunday bot mavjud
 * emas, shuning uchun NEXT_PUBLIC_TELEGRAM_BOT berilmagan joyda (lokal
 * `npm run dev`) havola bo'sh Telegram sahifasiga olib borardi va botni
 * sahifadagi shakl orqali qo'lda tuzatish kerak bo'lardi.
 */
const DEFAULT_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT?.replace('@', '') || 'lockbridge_bot';

export default function SpeakingPage() {
  // Default NEXT_PUBLIC_TELEGRAM_BOT dan keladi; qo'lda kiritilgani brauzerda saqlanadi.
  // Saqlangan qiymat render vaqtida o'qiladi, tahrir esa vaqtinchalik `draft` da turadi.
  const storedUsername = useStoredString(BOT_USERNAME_KEY);
  const [draft, setDraft] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const botUsername = draft ?? storedUsername ?? DEFAULT_BOT_USERNAME;
  const setBotUsername = (value: string) => setDraft(value);

  const saveBotUsername = () => {
    const cleaned = botUsername.trim().replace('@', '');
    if (!cleaned) return;
    localStorage.setItem(BOT_USERNAME_KEY, cleaned);
    window.dispatchEvent(new Event('storage'));
    setDraft(null);
    setIsCustomizing(false);
  };

  const telegramUrl = `https://t.me/${botUsername.replace('@', '')}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="purple" size="md" className="mb-2">
            Telegram Voice AI Integration
          </Badge>
          <h1 className="text-3xl font-black text-[#1E293B]">
            AI English Speaking via Telegram Bot
          </h1>
          <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
            Ovozli suhbat Telegramdagi VOXY ilovasi (Mini App) ichida, jonli rejimda kechadi — xuddi telefonda gaplashgandek. Botga <code>/start</code> yuboring, ilovani ochib «Suhbatni boshlash» tugmasini bosing.
          </p>
        </div>

        {/* Main Telegram Launch Card */}
        <Card className="p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-b from-white to-blue-50/30 border-blue-100 shadow-xl shadow-blue-500/5">
          {/* Telegram Logo Glow */}
          <div className="w-24 h-24 rounded-3xl bg-[#229ED9] text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#229ED9]/30 ring-8 ring-blue-50 transform hover:scale-105 transition-transform duration-300">
            <Send className="w-12 h-12 -ml-1 mt-0.5" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-xs font-bold text-[#229ED9]">
              <span className="w-2 h-2 rounded-full bg-[#229ED9] animate-ping" />
              <span>Telegram Ovozli Yordamchi Faol</span>
            </div>
            <h2 className="text-2xl font-black text-[#1E293B]">
              VOXY Voice Assistant Bot
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Ovozli AI ustoz shu Telegram bot orqali ochiladi:
              <strong className="text-[#229ED9] ml-1">@{botUsername.replace('@', '')}</strong>
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-[#229ED9] hover:bg-[#1d8cc4] shadow-[#229ED9]/25 text-base px-8 py-4 gap-2.5"
                icon={<Send className="w-5 h-5 -ml-1" />}
              >
                <span>Telegram Botni Ishga Tushirish</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            </a>

            <button
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="text-xs text-[#64748B] hover:text-[#2563EB] flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Bot username&apos;ini o&apos;zgartirish</span>
            </button>
          </div>

          {/* Bot Username Customizer (Hackathon jamoasi uchun qulay) */}
          {isCustomizing && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-white rounded-2xl border border-slate-200 text-left space-y-2 animate-fade-in shadow-sm">
              <label className="block text-xs font-bold text-[#1E293B]">
                Do&apos;stingiz yaratayotgan bot username&apos;i:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="masalan: lockbridge_bot"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#229ED9] text-[#1E293B]"
                />
                <Button size="sm" variant="primary" onClick={saveBotUsername}>
                  Saqlash
                </Button>
              </div>
              <p className="text-[10px] text-[#64748B]">
                Ushbu maydonga bot usernameni yozsangiz, barcha havolalar avtomatik shu botga yo&apos;naltiriladi.
              </p>
            </div>
          )}

          {/* 3 Steps Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left border-t border-slate-100 pt-8">
            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center mb-2">
                1
              </span>
              <h4 className="font-bold text-xs text-[#1E293B]">Telegramga o&apos;ting</h4>
              <p className="text-[11px] text-[#64748B] mt-1">
                Yuqoridagi tugmani bosib, Telegramdagi VOXY botini oching.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-purple-100 text-[#8B5CF6] font-bold text-xs flex items-center justify-center mb-2">
                2
              </span>
              <h4 className="font-bold text-xs text-[#1E293B]">/start bosing</h4>
              <p className="text-[11px] text-[#64748B] mt-1">
                Bot menyusidan <strong>AI Voice Tutor</strong> yoki <strong>English Speaking</strong> rejimini tanlang.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#16A34A] font-bold text-xs flex items-center justify-center mb-2">
                3
              </span>
              <h4 className="font-bold text-xs text-[#1E293B]">Ilovani ochib gapiring</h4>
              <p className="text-[11px] text-[#64748B] mt-1">
                <strong>Open VOXY</strong> ni bosing, «Suhbatni boshlash» tugmasidan keyin mikrofon
                yoqiladi va AI ustoz sizni jonli eshitadi.
              </p>
            </div>
          </div>
        </Card>

        {/* Telegram Capabilities Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#229ED9] flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E293B]">Jonli ovozli suhbat</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Gapingizni bo&apos;lsangiz ustoz to&apos;xtaydi, xatolaringizni muloyim tuzatadi. Suhbat oxirida
                mavzular, yangi so&apos;zlar va tavsiyalar bilan qisqa xulosa chiqadi.
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E293B]">Fan yoki ingliz tili</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Ikki rejim: fan bo&apos;yicha ovozli ustoz (o&apos;zbek, rus yoki ingliz tilida) va
                English Speaking mashqi. 🎧 Naushnik bilan yaxshiroq ishlaydi.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
