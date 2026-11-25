import type { Metadata } from "next";
import { Archivo, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

/**
 * Uch rolli tipografika.
 *
 * Ilgari Geist ulangan edi, lekin `globals.css` dagi `body` Arial ga
 * qaytarardi — ya'ni butun sayt tizim shriftida chiqardi va shuning uchun
 * «hech kim bezamagandek» ko'rinardi.
 *
 * - Archivo — sarlavhalar uchun: kengaytirilgan, qat'iy grotesk.
 * - Inter Tight — matn uchun: zich, o'zbek diakritikasi (oʻ, gʻ) to'liq.
 * - JetBrains Mono — raqamlar uchun: XP, narx, vaqt. Jadvalda raqamlar
 *   bir xil kenglikda turadi.
 */
const display = Archivo({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const body = Inter_Tight({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VOXY — ovozli AI murabbiy",
  description:
    "Telegram ichida AI murabbiy bilan jonli ovozda gaplashing, fanlar bo'yicha test yeching va natijangizni kuzating.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    // Sayt o'zbek tilida: `lang="en"` da skrinriderlar matnni ingliz
    // qoidalari bilan o'qib, tanib bo'lmaydigan talaffuz beradi.
    <html
      lang="uz"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      {/* Google Analytics. O'lchov identifikatori env orqali beriladi: uni
          kodga yozib qo'yish — har bir fork va har bir nusxa bitta hisobga
          ma'lumot yuborishi degani. Qiymat bo'lmasa skript umuman
          ulanmaydi, shuning uchun lokal ishlash statistikani ifloslantirmaydi. */}
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
