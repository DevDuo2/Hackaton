'use client';

import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  MessageSquare,
  Mic,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Smartphone,
  Flame,
  ArrowRight,
  Settings2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function SpeakingPage() {
  // Team can replace this username with their exact bot username
  const [botUsername, setBotUsername] = useState('voxy_speaking_bot');
  const [isCustomizing, setIsCustomizing] = useState(false);

  const telegramUrl = `https://t.me/${botUsername.replace('@', '')}?start=voice_lesson`;

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
            Ovozli muloqot va jonli savol-javoblar to'g'ridan-to'g'ri Telegram botimiz orqali amalga oshiriladi. Botga kiring, <code>/start</code> bosing va ovozli xabarlar bilan mashq qilishni boshlang!
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
              Hamma savollaringizga real-vaqtda audio va matnli javob beruvchi rasmiy Telegram bot:
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
              <span>Bot username'ini o'zgartirish</span>
            </button>
          </div>

          {/* Bot Username Customizer (Hackathon jamoasi uchun qulay) */}
          {isCustomizing && (
            <div className="max-w-md mx-auto mb-8 p-4 bg-white rounded-2xl border border-slate-200 text-left space-y-2 animate-fade-in shadow-sm">
              <label className="block text-xs font-bold text-[#1E293B]">
                Do'stingiz yaratayotgan bot username'i:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="masalan: voxy_speaking_bot"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#229ED9] text-[#1E293B]"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsCustomizing(false)}
                >
                  Saqlash
                </Button>
              </div>
              <p className="text-[10px] text-[#64748B]">
                Ushbu maydonga bot usernameni yozsangiz, barcha havolalar avtomatik shu botga yo'naltiriladi.
              </p>
            </div>
          )}

          {/* 3 Steps Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left border-t border-slate-100 pt-8">
            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center mb-2">
                1
              </span>
              <h4 className="font-bold text-xs text-[#1E293B]">Telegramga o'ting</h4>
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
                Bot bilan suhbatni boshlash uchun <strong>/start</strong> buyrug'ini yuboring.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-xs">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#16A34A] font-bold text-xs flex items-center justify-center mb-2">
                3
              </span>
              <h4 className="font-bold text-xs text-[#1E293B]">Ovozli gapiring</h4>
              <p className="text-[11px] text-[#64748B] mt-1">
                Ovozli xabar (voice message) yuboring — bot darhol tahlil qilib javob qaytaradi!
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
              <h3 className="font-bold text-sm text-[#1E293B]">Ovozli Xabarlar Tahlili</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Talaffuz, intonatsiya va so'z boyligini real-vaqtda tekshirib, xatolarni tushuntirib beradi.
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E293B]">24/7 Suhbatdoshi</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Istalgan mavzuda (ish suhbati, kundalik mavzular, texnik savollar) savol bering va o'rganing.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
