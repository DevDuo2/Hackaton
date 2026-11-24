'use client';

import React from 'react';
import { Plus, Search, Filter, BookOpen, Edit, Trash2 } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { MOCK_COURSES } from '../../../data/mockData';

export default function AdminCoursesPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Course Operations Management
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Create, update, and manage published curriculum and lesson modules.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Create New Course
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses by title or instructor..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>
                Filter
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Enrolled Students</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_COURSES.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-bold text-[#1E293B] flex items-center gap-3">
                      <img src={c.image} alt={c.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p>{c.title}</p>
                        <p className="text-[10px] text-[#64748B] font-normal">{c.duration} • {c.lessonsCount} lessons</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{c.category}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="slate" size="sm">
                        {c.level}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1E293B]">{c.studentsCount.toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="green" size="sm">
                        Published
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Button variant="ghost" size="sm" icon={<Edit className="w-3.5 h-3.5" />}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
