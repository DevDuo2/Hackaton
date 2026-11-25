import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { MOCK_COURSES, MOCK_LESSONS } from '../../../data/mockData';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return MOCK_COURSES.map((course) => ({
    id: course.id,
  }));
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Ilgari `|| MOCK_COURSES[0]` turardi: noma'lum URL jimgina birinchi kursni
  // ko'rsatardi, ya'ni sahifa manzilga mos kelmaydigan ma'lumot berardi.
  const course = MOCK_COURSES.find((c) => c.id === id);
  if (!course) notFound();

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Back Link */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </Link>

        {/* Top Hero Overview Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue" size="md">
                {course.category}
              </Badge>
              <Badge variant="slate" size="md">
                {course.level}
              </Badge>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs ml-2">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{course.rating}</span>
                <span className="text-[#64748B] font-normal">
                  ({course.studentsCount} students enrolled)
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] tracking-tight">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              {course.description}
            </p>

            {/* Instructor Quick Info */}
            <div className="flex items-center gap-3 pt-2">
              <Image
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-11 h-11 rounded-xl object-cover ring-2 ring-[#2563EB]/20 shrink-0"
                width={44}
                height={44}
              />
              <div>
                <p className="text-xs font-bold text-[#1E293B]">
                  Instructor: {course.instructor.name}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  {course.instructor.role}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Card */}
          <Card className="p-6 flex flex-col justify-between overflow-hidden">
            <div className="space-y-4">
              <div className="relative w-full h-44">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>Total Duration:</span>
                  <strong className="text-[#1E293B]">{course.duration}</strong>
                </div>
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>Total Lessons:</span>
                  <strong className="text-[#1E293B]">{course.lessonsCount} ta mavzu</strong>
                </div>
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>Certificate:</span>
                  <strong className="text-[#64748B]">Hozircha berilmaydi</strong>
                </div>
              </div>

              {/* `course.progress` — mock qiymat, foydalanuvchining haqiqiy
                  progressi emas, shuning uchun ko'rsatilmaydi. */}
            </div>

            <div className="pt-6 space-y-3">
              <Link href="/ai-tutor" className="w-full block">
                <Button variant="primary" size="lg" className="w-full" icon={<PlayCircle className="w-5 h-5" />}>
                  AI murabbiy bilan boshlash
                </Button>
              </Link>
              <Link href="/speaking" className="w-full block">
                <Button variant="secondary" size="md" className="w-full" icon={<Sparkles className="w-4 h-4" />}>
                  Practice with VOXY Speaking AI
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Learning Objectives Checklist */}
        <Card className="p-6">
          <h3 className="font-bold text-base text-[#1E293B] mb-4">
            What You Will Master in This Course
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#1E293B]">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Deep understanding of foundational principles and practical real-world workflows.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Interactive prompt building with immediate AI Tutor feedback.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Hands-on mini projects ready for your personal portfolio.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>Gamified quizzes designed to reinforce long-term memory retention.</span>
            </div>
          </div>
        </Card>

        {/* Course Curriculum & Lessons List */}
        <div>
          {/* «3 of 6 Done» o'chirildi: dars progressi hali kuzatilmaydi,
              shuning uchun uni foydalanuvchining natijasi deb ko'rsatish yolg'on. */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-xl font-bold text-[#1E293B]">Kurs rejasi</h3>
              <p className="text-xs text-[#64748B]">
                {MOCK_LESSONS.length} ta mavzu, {new Set(MOCK_LESSONS.map((l) => l.module)).size} modul
              </p>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              Namunaviy reja — video darslar hali qo&apos;shilmagan
            </span>
          </div>

          <div className="space-y-3">
            {MOCK_LESSONS.map((lesson, idx) => (
              <Card
                key={lesson.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold bg-slate-100 text-[#64748B] shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#1E293B]">{lesson.title}</h4>
                    <span className="text-[11px] text-[#64748B]">
                      {lesson.module} • {lesson.duration}
                    </span>
                  </div>
                </div>

                {/* Ilgari bu yerda ishlamaydigan «Start/Review» tugmasi turardi.
                    Hozir ishlaydigan yo'l — shu fan bo'yicha test va AI murabbiy. */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="slate" size="sm">
                    Tez kunda
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
