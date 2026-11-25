'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Star, BookOpen, Clock } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MOCK_COURSES } from '../../data/mockData';

export default function CoursesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtrlar MA'LUMOTDAN olinadi, qo'lda yozilmaydi. Ilgari ro'yxatda 'AI',
  // 'Design' va 'Business' bor edi — birorta kursda bunday kategoriya yo'q,
  // ya'ni uchta chipni bosganda natija har doim bo'sh chiqardi. 'Science' esa
  // (uch kurs!) ro'yxatda yo'q edi va butun kategoriya qo'lga ilinmasdi.
  const categories = [
    'All',
    ...Array.from(new Set(MOCK_COURSES.map((c) => c.category))).sort(),
  ];

  const levels = [
    'All',
    ...Array.from(new Set(MOCK_COURSES.map((c) => c.level))).sort(),
  ];

  const filteredCourses = MOCK_COURSES.filter((course) => {
    const matchesCategory =
      selectedCategory === 'All' || course.category === selectedCategory;
    const matchesLevel =
      selectedLevel === 'All' || course.level === selectedLevel;
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Course Catalog
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Explore interactive curriculum designed to build in-demand AI, speaking, and engineering skills.
            </p>
          </div>
          <div className="text-xs text-[#64748B] bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 self-start md:self-auto">
            Showing <strong className="text-[#1E293B]">{filteredCourses.length}</strong> available courses
          </div>
        </div>

        {/* Filters and Search Bar */}
        <Card className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses by title, keywords or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all text-[#1E293B]"
              />
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-xs font-semibold text-[#64748B] shrink-0">
                Difficulty:
              </span>
              {levels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    selectedLevel === lvl
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'bg-slate-100 text-[#64748B] hover:bg-slate-200/70'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-[#64748B] shrink-0">
              Categories:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-slate-50 text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden flex flex-col justify-between group"
              >
                <div>
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

                  <div className="p-6">
                    <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span>{course.rating}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {course.duration}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-[#1E293B] group-hover:text-[#2563EB] transition-colors mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed mb-4">
                      {course.description}
                    </p>

                    {/* Progress if enrolled */}
                    {course.progress !== undefined && course.progress > 0 && (
                      <div className="mb-4 pt-3 border-t border-slate-100">
                        <ProgressBar
                          value={course.progress}
                          color="blue"
                          size="sm"
                          showLabel
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
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
                    <Button size="sm" variant={course.progress ? 'primary' : 'outline'}>
                      {course.progress ? 'Resume' : 'View Course'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1E293B]">No courses found</h3>
            <p className="text-xs text-[#64748B] mt-1 mb-4">
              Try adjusting your category filter or search keywords.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedLevel('All');
                setSearchTerm('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
