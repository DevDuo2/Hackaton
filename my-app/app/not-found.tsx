import Link from 'next/link';

/**
 * Mavjud bo'lmagan manzil uchun sahifa. Ilgari noma'lum kurs id si jimgina
 * birinchi kursni ko'rsatardi — foydalanuvchi buni haqiqiy deb o'ylardi.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5">
        <span className="text-2xl font-black text-[#2563EB]">404</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-[#1E293B]">
        Bunday sahifa topilmadi
      </h1>
      <p className="text-sm text-[#64748B] mt-2 max-w-md">
        Havola eskirgan bo&apos;lishi yoki manzilda xato bo&apos;lishi mumkin. Quyidagi
        bo&apos;limlardan birini tanlang.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/courses"
          className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#1E293B] border border-slate-200 text-sm font-semibold transition-colors"
        >
          Kurslar
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-[#64748B] hover:text-[#1E293B] text-sm font-semibold transition-colors"
        >
          Bosh sahifa
        </Link>
      </div>
    </main>
  );
}
