'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Bot,
  User,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SUBJECTS } from '../../data/mockData';
import { ApiError, askAiTutorApi, fetchAiStatus } from '../../lib/api';
import { SUBJECT_KEY } from '../../lib/auth';
import { useStoredString } from '../../lib/clientStore';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  isError?: boolean;
  /** Javob serverdagi zaxira bilim bazasidan (Gemini ulanmagan). */
  isOffline?: boolean;
}

/** Xabar id lari: Date.now() bir millisekundda ikki xabarga bir xil kalit beradi
 *  (va render paytida chaqirilsa react-hooks/purity qoidasini buzadi). */
function useMessageId() {
  const counter = useRef(0);
  return () => `m${++counter.current}`;
}

function clockLabel(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AITutorPage() {
  const router = useRouter();
  // Fan localStorage dan render vaqtida o'qiladi; sidebar o'zgartirsa hook xabar beradi.
  const activeSubjectId = useStoredString(SUBJECT_KEY) ?? 'matematika';
  // Suhbat QAYSI fanga tegishli ekani bilan birga saqlanadi. Shu tufayli fan
  // almashganda uni effekt ichida tozalash kerak emas (bu `setState` ni
  // effekt ichida chaqirishga olib kelardi): mos kelmasa, shunchaki yangi
  // salomlashuv ko'rsatiladi. Xuddi shu yondashuv /games sahifasida ham.
  const [conversation, setConversation] = useState<
    { subjectId: string; messages: Message[] } | null
  >(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const nextId = useMessageId();

  // AI haqiqatan ulanganmi? Ulanmagan bo'lsa, foydalanuvchi oldindan
  // tayyorlangan matnni «AI javobi» deb o'ylamasligi kerak.
  useEffect(() => {
    let cancelled = false;
    fetchAiStatus()
      .then((status) => !cancelled && setAiConfigured(status.configured))
      .catch(() => !cancelled && setAiConfigured(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  // Salomlashuv render vaqtida hisoblanadi: vaqt tamg'asi yo'q (u mazmunsiz edi),
  // shuning uchun soat funksiyasini render ichida chaqirish kerak emas.
  const greeting: Message = {
    id: 'greeting',
    sender: 'ai',
    text: currentSubject.aiGreeting,
    timestamp: '',
  };
  const messages =
    conversation?.subjectId === activeSubjectId ? conversation.messages : [greeting];
  const setMessages: React.Dispatch<React.SetStateAction<Message[]>> = (value) => {
    const base = messages;
    const next = typeof value === 'function' ? value(base) : value;
    setConversation({ subjectId: activeSubjectId, messages: next });
  };

  // Yangi xabar kelganda pastga suriladi. Ilgari javob ekran tashqarisida
  // paydo bo'lar va foydalanuvchi uni qo'lda qidirishi kerak bo'lardi.
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: nextId(),
      sender: 'user',
      text: text,
      timestamp: clockLabel(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      // First attempt: Call FastAPI backend (Google Gemini 3.5 Flash Lite)
      const reply = await askAiTutorApi(currentSubject.id, text);
      const aiMsg: Message = {
        id: nextId(),
        sender: 'ai',
        text: reply.response,
        timestamp: clockLabel(),
        isOffline: reply.source === 'offline',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // Soxta "AI javobi" ko'rsatmaymiz: backend javob bermasa, buni ochiq aytamiz.
      // Gemini ishlamay qolsa, backendning o'zida zaxira bilim bazasi bor.
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/login');
        return;
      }
      const retryHint = 'Bir necha soniyadan keyin savolni qaytadan yuboring.';
      const reason =
        err instanceof ApiError && err.message
          ? err.message
          : "Server bilan bog'lanib bo'lmadi.";
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          sender: 'ai',
          text: [reason, '', retryHint].join('\n'),
          timestamp: clockLabel(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20">
              {currentSubject.iconSymbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#1E293B]">
                  {currentSubject.name} AI Murabbiyi
                </h1>
                <Badge variant="blue" size="sm">
                  Shaxsiy Fan Ustozi
                </Badge>
              </div>
              <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                24/7 Masalalar va Savollarga Javob Berishga Tayyor
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setConversation(null)}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Yangi Savol
          </Button>
        </div>

        {/* Chat Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Suggested Subject Prompts */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E293B] mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Mavzuga oid savollar
              </h3>
              <div className="space-y-2">
                {currentSubject.sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-2.5 rounded-xl text-[11px] leading-snug bg-slate-50 hover:bg-blue-50 hover:text-[#2563EB] border border-slate-200/60 transition-colors text-[#1E293B]"
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Messages Container */}
          <Card className="lg:col-span-3 flex flex-col h-[600px] overflow-hidden">
            {/* AI ulanmagan bo'lsa buni ochiq aytamiz: javoblar serverdagi
                ma'lumotnomadan keladi va bu «AI javobi» emas. */}
            {aiConfigured === false && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 font-semibold flex items-start gap-2">
                <span aria-hidden="true">⚠️</span>
                <span>
                  AI xizmati serverda sozlanmagan (GEMINI_API_KEY yo&apos;q). Javoblar
                  oldindan tayyorlangan ma&apos;lumotnomadan beriladi — bu sun&apos;iy
                  intellekt javobi emas.
                </span>
              </div>
            )}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#2563EB]'
                        : 'bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6]'
                    }`}
                  >
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-[#2563EB] text-white rounded-tr-none shadow-sm'
                          : msg.isError
                            ? 'bg-amber-50 text-amber-900 rounded-tl-none border border-amber-200'
                            : 'bg-white text-[#1E293B] rounded-tl-none border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div
                      className={`flex items-center gap-2 text-[10px] text-[#64748B] px-1 ${
                        msg.sender === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      {msg.timestamp && <span>{msg.timestamp}</span>}
                      {msg.isOffline && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                          ma&apos;lumotnoma
                        </span>
                      )}
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => copyToClipboard(msg.id, msg.text)}
                          className="hover:text-[#2563EB] transition-colors cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              {/* Avtomatik surish nuqtasi — yangi javob har doim ko'rinadi. */}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder={`${currentSubject.name} bo'yicha savolingizni yozing...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all text-[#1E293B]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputMessage.trim()}
                  icon={<Send className="w-4 h-4" />}
                >
                  Yuborish
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
