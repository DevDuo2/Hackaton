import React from 'react';
import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
                V
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1E293B]">
                VOXY
              </span>
            </div>
            <p className="text-sm text-[#64748B] max-w-sm leading-relaxed">
              Learn smarter. Grow faster. The modern AI-powered learning platform designed for students, developers, and ambitious creators worldwide.
            </p>
            <div className="text-xs text-[#64748B]">
              Official Brand Palette: #2563EB Blue & #8B5CF6 Purple
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-[#64748B]">
              <li>
                <Link href="/courses" className="hover:text-[#2563EB] transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/ai-tutor" className="hover:text-[#8B5CF6] transition-colors">
                  AI Personal Tutor
                </Link>
              </li>
              <li>
                <Link href="/speaking" className="hover:text-[#8B5CF6] transition-colors">
                  English Speaking AI
                </Link>
              </li>
              <li>
                <Link href="/games" className="hover:text-[#2563EB] transition-colors">
                  Interactive Quizzes
                </Link>
              </li>
            </ul>
          </div>

          {/* Dashboard links */}
          <div>
            <h4 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-4">
              Dashboard
            </h4>
            <ul className="space-y-2.5 text-sm text-[#64748B]">
              <li>
                <Link href="/dashboard" className="hover:text-[#2563EB] transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/progress" className="hover:text-[#2563EB] transition-colors">
                  My Progress & Stats
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-[#2563EB] transition-colors">
                  Student Profile
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#2563EB] transition-colors">
                  Admin Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h4 className="text-xs font-semibold text-[#1E293B] uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-[#64748B]">
              <li>
                <Link href="/#about" className="hover:text-[#2563EB] transition-colors">
                  About VOXY
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-[#2563EB] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Privacy Policy (Demo)</span>
              </li>
              <li>
                <span className="text-slate-400">Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© 2026 VOXY EdTech Inc. All rights reserved.</p>
          <p>Crafted with Next.js, TypeScript & Tailwind CSS for Hackathon.</p>
        </div>
      </div>
    </footer>
  );
};
