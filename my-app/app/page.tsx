'use client';

/**
 * Bosh sahifa.
 *
 * Ilgari bu yerda har qanday AI mahsulotiga mos keladigan shablon turardi:
 * gradientli sarlavha, ikkita tugma va uchta pastel kartochka — ustiga matn
 * inglizcha, qolgan sayt esa o'zbekcha edi.
 *
 * Endi sahifa mahsulotning YAGONA farqidan boshlanadi: VOXY bilan yozishmaysiz,
 * GAPLASHASIZ. Shuning uchun qahramon blok — haqiqiy suhbatning o'zi: to'lqin
 * shakli va almashilgan gaplar. Qolgan hamma narsa ataylab jim: butun sahifada
 * bitta urg'u rangi (za'faron) va bitta kuchli element bor.
 */

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Mic, Check } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { MOCK_COURSES, SUBJECTS } from '../data/mockData';
import { useSession } from '../lib/clientStore';

/** Suhbatning bir gapi. Qahramon blokdagi transkript shundan yig'iladi. */
const TURNS: { who: 'siz' | 'voxy'; text: string; at: string }[] = [
  { who: 'siz', text: 'Diskriminant nega manfiy chiqdi?', at: '00:04' },
  {
    who: 'voxy',
    text: 'Chunki b² dan 4ac ni ayirganda 4ac kattaroq. Keling, b va c ni birga qo‘yib ko‘ramiz.',
    at: '00:06',
  },
  { who: 'siz', text: 'Ha, endi tushundim. Yana bitta misol beringchi.', at: '00:19' },
];

/** Ovoz to'lqini — balandliklar qo'lda tanlangan, tasodifiy emas: har renderda bir xil. */
const WAVE = [
  18, 34, 52, 30, 64, 88, 46, 72, 96, 58, 40, 76, 92, 50, 28, 66, 84, 38, 60, 44,
  80, 32, 54, 70, 42, 90, 36, 62, 48, 74,
];

export default function HomePage() {
  const session = useSession();
  const isLoggedIn = session !== null;
  const primaryHref = isLoggedIn ? '/dashboard' : '/register';
  const primaryLabel = isLoggedIn ? "Dashboardga o'tish" : 'Bepul boshlash';

  const popularCourses = MOCK_COURSES.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F2F3F0] flex flex-col">
      <Navbar />

      {/* ——— Qahramon: suhbatning o'zi ——— */}
      <section className="bg-[#0F2027] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#E0A42B]">
                Ovozli AI murabbiy
              </p>

              <h1 className="font-display text-[2.6rem] leading-[0.95] sm:text-6xl lg:text-7xl font-extrabold mt-5">
                Yozmang.
                <br />
                <span className="text-[#E0A42B]">Gapiring.</span>
              </h1>

              <p className="text-[#9FB2BC] text-base sm:text-lg leading-relaxed mt-6 max-w-lg">
                VOXY — Telegram ichida jonli ovozda javob beradigan murabbiy.
                Savolingizni ovoz bilan aytasiz, u sizni eshitadi va xuddi
                telefonda gaplashgandek tushuntiradi.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-9">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E0A42B] text-[#0F2027] font-bold px-6 py-3.5 hover:bg-[#EFB748] transition-colors"
                >
                  {primaryLabel}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl border border-[#2F4652] text-white font-semibold px-6 py-3.5 hover:bg-white/5 transition-colors"
                >
                  Narxlarni ko&apos;rish
                </Link>
              </div>

              <p className="font-mono text-[11px] text-[#6F8792] mt-5">
                Bepul rejada kuniga 10 ta savol · karta talab qilinmaydi
              </p>
            </div>

            {/* Transkript — sahifaning yagona kuchli elementi */}
            <div className="rounded-2xl border border-[#233640] bg-[#13262F] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#233640]">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#7FD4D0]">
                  <Mic className="w-3.5 h-3.5" />
                  Suhbat yozuvi
                </span>
                <span className="font-mono text-[11px] text-[#6F8792]">
                  Matematika · 00:24
                </span>
              </div>

              {/* Ovoz to'lqini */}
              <div
                className="flex items-center gap-[3px] h-14 mt-5"
                role="img"
                aria-label="Ovozli suhbatning to'lqin shakli"
              >
                {WAVE.map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full bg-[#E0A42B]/80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <ol className="mt-6 space-y-4">
                {TURNS.map((turn, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider pt-1 w-11 shrink-0 ${
                        turn.who === 'voxy' ? 'text-[#7FD4D0]' : 'text-[#6F8792]'
                      }`}
                    >
                      {turn.who}
                    </span>
                    <p
                      className={`text-sm leading-relaxed ${
                        turn.who === 'voxy' ? 'text-white' : 'text-[#B7C6CD]'
                      }`}
                    >
                      {turn.text}
                    </p>
                    <span className="font-mono text-[10px] text-[#556B76] pt-1 ml-auto shrink-0">
                      {turn.at}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Nima qila olasiz ——— */}
      <section id="about" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F2027] max-w-xl">
            Uch xil ish, bitta hisob.
          </h2>

          <div className="grid sm:grid-cols-3 gap-px bg-[#D9DDD7] mt-10 rounded-2xl overflow-hidden border border-[#D9DDD7]">
            {[
              {
                title: 'Ovozli suhbat',
                body: 'Telegram ichida jonli gaplashasiz. Suhbat oxirida qisqa xulosa keladi.',
              },
              {
                title: 'AI murabbiy',
                body: 'Yozma savollarga fan bo‘yicha javob: formulalar va qadam-baqadam yechim.',
              },
              {
                title: 'Testlar va reyting',
                body: 'Yetti fan bo‘yicha savollar. To‘g‘ri javob XP beradi, XP reytingga chiqaradi.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#F2F3F0] p-6 sm:p-7">
                <h3 className="font-display text-lg font-bold text-[#0F2027]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#556B76] leading-relaxed mt-2">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Fanlar: haqiqiy katalog ——— */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F2027]">
              Yetti fan
            </h2>
            <Link
              href="/courses"
              className="text-sm font-semibold text-[#0F2027] underline underline-offset-4 hover:text-[#17827E]"
            >
              Kurslar katalogi
            </Link>
          </div>

          <ul className="flex flex-wrap gap-2 mt-7">
            {SUBJECTS.map((subject) => (
              <li
                key={subject.id}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D9DDD7] bg-white px-3.5 py-2 text-sm font-semibold text-[#0F2027]"
              >
                <span aria-hidden="true">{subject.iconSymbol}</span>
                {subject.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ——— Mashhur kurslar ——— */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0F2027]">
            Ommabop kurslar
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {popularCourses.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl border border-[#D9DDD7] bg-white overflow-hidden flex flex-col"
              >
                <Image
                  src={course.image}
                  alt=""
                  width={480}
                  height={240}
                  className="w-full h-36 object-cover"
                />
                <div className="p-5 flex flex-col flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#17827E]">
                    {course.category}
                  </p>
                  <h3 className="font-display text-base font-bold text-[#0F2027] mt-1.5">
                    {course.title}
                  </h3>
                  <p className="font-mono text-[11px] text-[#7A8A92] mt-auto pt-4">
                    {course.lessonsCount} dars · {course.level}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Yakuniy chaqiruv ——— */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#0F2027] text-white p-8 sm:p-12">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold max-w-lg leading-tight">
              Birinchi savolingizni bugun bering.
            </h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-[#9FB2BC]">
              {['Karta talab qilinmaydi', 'Kuniga 10 ta bepul savol', 'Istalgan vaqtda bekor qilinadi'].map(
                (point) => (
                  <li key={point} className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#E0A42B]" />
                    {point}
                  </li>
                )
              )}
            </ul>
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E0A42B] text-[#0F2027] font-bold px-6 py-3.5 mt-8 hover:bg-[#EFB748] transition-colors"
            >
              {primaryLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
