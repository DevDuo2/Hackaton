'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SUBJECTS } from '../../data/mockData';
import { askAiTutorApi } from '../../lib/api';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AITutorPage() {
  const [activeSubjectId, setActiveSubjectId] = useState('matematika');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentSubject =
    SUBJECTS.find((s) => s.id === activeSubjectId) || SUBJECTS[0];

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('voxy_active_subject') : null;
    const initialId = saved || 'matematika';
    setActiveSubjectId(initialId);

    const sub = SUBJECTS.find((s) => s.id === initialId) || SUBJECTS[0];
    setMessages([
      {
        id: '1',
        sender: 'ai',
        text: sub.aiGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      // First attempt: Call FastAPI backend (Google Gemini 3.5 Flash Lite)
      const aiReply = await askAiTutorApi(currentSubject.id, text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Backend unavailable, using instant educational fallback', err);
      // Fallback if backend is waking up or offline
      let aiResponseText = `Ajoyib savol! ${currentSubject.name} bo'yicha tushuntirish:\n\n1. **Asosiy qoida:** ${text} bo'yicha eng muhim tushuncha bu uning qonuniyatlari va amaliy qo'llanilishidir.\n2. **Qadam-baqadam yechim:** Masalani tahlil qilishda dastlab berilgan kattaliklar aniqlanadi, so'ngra mos formula yoki algoritm tatbiq etiladi.\n3. **Tavsiya:** Ushbu mavzuni mustahkamlash uchun VOXY Testlar bo'limida bir nechta amaliy test ishlab ko'ring!`;

      if (text.toLowerCase().includes('tenglama') || text.toLowerCase().includes('diskriminant')) {
        aiResponseText = `**Kvadrat tenglamani diskriminant orqali yechish:**\n\nUmumiy ko'rinishi: ax² + bx + c = 0\n\n1. **Diskriminant formulasi:** D = b² - 4ac\n2. **Natijani tekshirish:**\n   - Agar D > 0 bo'lsa, 2 ta haqiqiy ildiz bor: x₁,₂ = (-b ± √D) / 2a\n   - Agar D = 0 bo'lsa, 1 ta ildiz bor: x = -b / 2a\n   - Agar D < 0 bo'lsa, haqiqiy ildizlar mavjud emas.\n\nMisol: x² - 5x + 6 = 0 da a=1, b=-5, c=6. D = 25 - 24 = 1. x₁ = (5+1)/2 = 3, x₂ = (5-1)/2 = 2.`;
      } else if (text.toLowerCase().includes('nyuton') || text.toLowerCase().includes('kuch')) {
        aiResponseText = `**Nyutonning II Qonuni:**\n\nFormula: **F = m · a**\n\nJismga ta'sir qiluvchi barcha kuchlarning teng ta'sir etuvchisi jism massasi bilan uning olgan tezlanishi ko'paytmasiga teng.\n\n- Masalan: 4 kg massali aravachani 5 m/s² tezlanish bilan harakatlantirish uchun unga F = 4 · 5 = 20 N kuch qo'yish kerak bo'ladi.`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
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
            onClick={() =>
              setMessages([
                {
                  id: '1',
                  sender: 'ai',
                  text: currentSubject.aiGreeting,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ])
            }
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
                    "{q}"
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Messages Container */}
          <Card className="lg:col-span-3 flex flex-col h-[600px] overflow-hidden">
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
                      <span>{msg.timestamp}</span>
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
