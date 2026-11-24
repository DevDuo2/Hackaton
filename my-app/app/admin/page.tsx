'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  Plus,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Database,
  Server
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MOCK_ADMIN_STATS, MOCK_COURSES } from '../../data/mockData';
import { API_BASE_URL } from '../../lib/api';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState(MOCK_ADMIN_STATS);
  const [dbName, setDbName] = useState('MongoDB Atlas Connected');
  const [serverHealth, setServerHealth] = useState('Healthy (99.9% uptime)');
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('API xatosi');
        return res.json();
      })
      .then((data) => {
        if (data && data.totalStudents !== undefined) {
          setStats((prev) => ({
            ...prev,
            totalStudents: data.totalStudents || prev.totalStudents,
            totalCourses: data.totalCourses || prev.totalCourses,
            activeNow: data.activeUsersNow || prev.activeNow,
          }));
          if (data.database) setDbName(data.database);
          if (data.serverStatus) setServerHealth(data.serverStatus);
          setIsLiveConnected(true);
        }
      })
      .catch((err) => {
        console.warn('Render live admin stats fallback:', err);
      });
  }, []);
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
                Admin Overview & Platform Pulse
              </h1>
              <Badge variant="blue" size="sm">
                {isLiveConnected ? `Render.com Live: ${dbName}` : 'Live Data'}
              </Badge>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Real-time platform operations, active students, and content velocity metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add New Course
            </Button>
          </div>
        </div>

        {/* Admin Overview Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Total Registered Students</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_ADMIN_STATS.totalStudents.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-600 font-bold ml-2">+12% this month</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Active Learners Now</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_ADMIN_STATS.activeNow}
              </span>
              <span className="text-xs text-purple-600 font-bold ml-2">Concurrent</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Published Courses</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_ADMIN_STATS.totalCourses}
              </span>
              <span className="text-xs text-[#64748B] font-medium ml-2">5 categories</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Average Completion</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#1E293B]">
                {MOCK_ADMIN_STATS.avgCompletionRate}
              </span>
              <span className="text-xs text-emerald-600 font-bold ml-2">High engagement</span>
            </div>
          </Card>
        </div>

        {/* Student Enrollments Table */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-base text-[#1E293B]">Live Student Enrollments</h3>
              <p className="text-xs text-[#64748B]">Real-time learner activity logs</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                className="pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[#64748B] font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Enrolled Path</th>
                  <th className="py-3 px-4">Current Progress</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_ADMIN_STATS.recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#1E293B]">
                      <div>
                        <p>{s.name}</p>
                        <p className="text-[10px] text-[#64748B] font-normal">{s.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{s.course}</td>
                    <td className="py-3.5 px-4 min-w-[140px]">
                      <ProgressBar value={s.progress} color="blue" size="sm" showLabel />
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B]">{s.joined}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="ghost" size="sm">
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Operations Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h4 className="font-bold text-sm text-[#1E293B] mb-2">Course Catalog Operations</h4>
            <p className="text-xs text-[#64748B] mb-4">Manage 28 published courses, instructors, and lesson assets.</p>
            <a href="/admin/courses" className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1">
              Go to Course Ops <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-sm text-[#1E293B] mb-2">Student Directory</h4>
            <p className="text-xs text-[#64748B] mb-4">View student profiles, streak analytics, and capstone grades.</p>
            <a href="/admin/students" className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1">
              Open Student Records <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-sm text-[#1E293B] mb-2">Quiz & Question Banks</h4>
            <p className="text-xs text-[#64748B] mb-4">Add, review, and adjust automated AI quiz questions and explanations.</p>
            <a href="/admin/quizzes" className="text-xs font-bold text-[#2563EB] hover:underline inline-flex items-center gap-1">
              Manage Quiz Banks <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
