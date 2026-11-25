'use client';

import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Mic,
  Trophy,
  TrendingUp,
  Star,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MOCK_COURSES } from '../data/mockData';
import { useSession } from '../lib/clientStore';

export default function HomePage() {
  const popularCourses = MOCK_COURSES.slice(0, 3);

  // CTA lar sessiyaga qarab yo'naltiriladi. Ilgari hammasi `/dashboard` va
  // `/ai-tutor` ga olib borardi — himoyalangan sahifalarga. Kirmagan mehmon
  // «Start Learning Now» ni bosganda bir lahza dashboard ko'rinib, keyin
  // login ekraniga uloqtirilardi.
  const session = useSession();
  const isLoggedIn = session !== null;
  const primaryHref = isLoggedIn ? '/dashboard' : '/register';
  const primaryLabel = isLoggedIn ? "Dashboardga o'tish" : 'Bepul boshlash';
  const tutorHref = isLoggedIn ? '/ai-tutor' : '/login';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Soft Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-200/30 via-purple-200/30 to-blue-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-xs font-semibold text-[#2563EB] mb-6 shadow-xs animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-[#2563EB] animate-pulse" />
            <span>Next-Gen EdTech Experience</span>
            <span className="text-slate-300">|</span>
            <span className="text-purple-600 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 inline" /> VOXY 2.0
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#1E293B] tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6">
            Learn Smarter.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#8B5CF6]">
              Grow Faster
            </span>{' '}
            with AI.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed mb-10">
            Master languages, programming, and sciences with personalized 24/7 AI tutoring, real-time voice speaking coach, and gamified mastery quizzes.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href={primaryHref} className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto">
                <span>{primaryLabel}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link href={tutorHref} className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" icon={<Sparkles className="w-5 h-5" />}>
                {isLoggedIn ? 'AI Murabbiyni sinash' : 'Kirish'}
              </Button>
            </Link>
          </div>

          {/* Hero Banner / Interactive Showcase Card */}
          <div className="relative max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-white/90 to-slate-100/70 shadow-2xl border border-slate-200/80 backdrop-blur-md">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Feature Mini 1 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100/60">
                  <div className="p-3 bg-[#2563EB] text-white rounded-xl shadow-md shadow-blue-500/20">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm">Adaptive AI Tutor</h3>
                    <p className="text-xs text-[#64748B] mt-1">Instant explanations, step-by-step problem breakdown 24/7.</p>
                  </div>
                </div>

                {/* Feature Mini 2 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100/60">
                  <div className="p-3 bg-[#8B5CF6] text-white rounded-xl shadow-md shadow-purple-500/20">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm">Speaking Coach</h3>
                    <p className="text-xs text-[#64748B] mt-1">Real-time pronunciation and conversational fluency practice.</p>
                  </div>
                </div>

                {/* Feature Mini 3 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/60">
                  <div className="p-3 bg-[#16A34A] text-white rounded-xl shadow-md shadow-emerald-500/20">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm">Gamified Learning</h3>
                    <p className="text-xs text-[#64748B] mt-1">Interactive quizzes, streak challenges, and global badges.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="blue" size="md" className="mb-3">
              Core Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">
              Designed For High-Performance Learning
            </h2>
            <p className="text-[#64748B] text-base mt-4">
              Everything you need to master complex subjects quickly, confidently, and with continuous motivation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card className="p-8 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-3">Structured Curriculum</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Curated modular lessons covering Full-Stack Web Development, Machine Learning, English Communication, and Business Strategy.
              </p>
              <Link href="/courses" className="text-sm font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1">
                Explore catalog <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>

            {/* Card 2 */}
            <Card className="p-8 hover:-translate-y-1 transition-all duration-300 border-purple-100 shadow-purple-500/5">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-3">AI Personal Mentor</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Never get stuck. Ask questions at any moment and receive clear analogies, customized code snippets, and practice drills.
              </p>
              <Link href="/ai-tutor" className="text-sm font-semibold text-[#8B5CF6] hover:underline inline-flex items-center gap-1">
                Meet the AI Tutor <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>

            {/* Card 3 */}
            <Card className="p-8 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-3">Progress Tracking</h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                Visualize weekly hours, study velocity, streak consistency, and milestone achievements with clear analytical dashboards.
              </p>
              <Link href="/progress" className="text-sm font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1">
                View analytics <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Courses Showcase */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="green" size="md" className="mb-2">
                Hand-Picked Courses
              </Badge>
              <h2 className="text-3xl font-extrabold text-[#1E293B]">Popular on VOXY</h2>
              <p className="text-[#64748B] text-sm mt-2">Start with top-rated learning paths built by industry pioneers.</p>
            </div>
            <Link href="/courses" className="mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                View All Courses ({MOCK_COURSES.length})
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden flex flex-col group">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="blue" size="sm">
                      {course.category}
                    </Badge>
                    <Badge variant="slate" size="sm">
                      {course.level}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold mb-2">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{course.rating}</span>
                    <span className="text-slate-400 font-normal">({course.studentsCount} students)</span>
                  </div>

                  <h3 className="font-bold text-[#1E293B] text-base group-hover:text-[#2563EB] transition-colors line-clamp-1 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-[#64748B] line-clamp-2 mb-6 flex-1">
                    {course.description}
                  </p>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={course.instructor.avatar}
                        alt={course.instructor.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        width={28}
                        height={28}
                      />
                      <span className="text-xs text-[#64748B] font-medium truncate max-w-[120px]">
                        {course.instructor.name}
                      </span>
                    </div>

                    <Link href={`/courses/${course.id}`}>
                      <Button size="sm" variant="outline">
                        View Course
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — footerdagi "About VOXY" havolasi shu yerga olib keladi. */}
      <section id="about" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="purple" size="md" className="mb-2">
              Simple 3-Step Process
            </Badge>
            <h2 className="text-3xl font-extrabold text-[#1E293B]">How VOXY Accelerates Your Skills</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#2563EB] font-black text-xl flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-[#1E293B] mb-2">Choose Your Topic</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Select from AI, English fluency, programming, or design tracks based on your career goals.
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#8B5CF6] font-black text-xl flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-[#1E293B] mb-2">Engage With AI Coach</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Practice through dynamic chat simulations and audio speech evaluations tailored to your pace.
              </p>
            </div>

            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#16A34A] font-black text-xl flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-[#1E293B] mb-2">Earn Mastery Badges</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Validate your knowledge through interactive quizzes, maintain your streak, and earn shareable certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-16 bg-[#2563EB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold">15,000+</p>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold">98.4%</p>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold">1.2M+</p>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">AI Interactions</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold">500+</p>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">Curated Lessons</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-[#1E293B]">Loved by Modern Learners</h2>
            <p className="text-sm text-[#64748B] mt-2">See what students say about accelerating their skills with VOXY.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[#1E293B] italic mb-6">
                &quot;The AI Speaking feature helped me overcome my fear of speaking English during technical job interviews. Truly transformative!&quot;
              </p>
              <div className="flex items-center gap-3">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Zumradxon"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Zumradxon X.</p>
                  <p className="text-[11px] text-[#64748B]">Frontend & AI Enthusiast</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[#1E293B] italic mb-6">
                &quot;VOXY breaks down complex prompt engineering and machine learning principles better than expensive bootcamps.&quot;
              </p>
              <div className="flex items-center gap-3">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Bekzod"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Bekzod T.</p>
                  <p className="text-[11px] text-[#64748B]">Software Engineer</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[#1E293B] italic mb-6">
                &quot;Cleanest UI I have seen in EdTech. The color balance, quick interactive quizzes, and streak metrics make daily practice effortless.&quot;
              </p>
              <div className="flex items-center gap-3">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Malika"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-xs font-bold text-[#1E293B]">Malika S.</p>
                  <p className="text-[11px] text-[#64748B]">Product Designer</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] rounded-3xl p-8 sm:p-14 text-white text-center shadow-xl shadow-blue-500/15">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready to Upgrade Your Learning Potential?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto mb-8">
              Join thousands of learners elevating their skills daily with VOXY AI. Start free today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href={primaryHref}>
                <Button size="lg" className="bg-white text-[#2563EB] hover:bg-slate-100 shadow-none font-bold">
                  {primaryLabel}
                </Button>
              </Link>
              <Link href={tutorHref}>
                <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 shadow-none">
                  {isLoggedIn ? 'AI Murabbiyni sinash' : 'Kirish'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
