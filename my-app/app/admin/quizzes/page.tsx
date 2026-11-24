'use client';

import React from 'react';
import { Trophy, Plus, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { MOCK_QUIZ_QUESTIONS } from '../../../data/mockData';

export default function AdminQuizzesPage() {
  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
              Quiz & Question Bank Management
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Maintain interactive questions, automated AI explanations, and gamified challenges.
            </p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {MOCK_QUIZ_QUESTIONS.map((q, idx) => (
            <Card key={q.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="blue" size="sm">
                      Question #{idx + 1}
                    </Badge>
                    <span className="text-xs text-emerald-600 font-semibold">Active in Daily Challenge</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#1E293B]">{q.question}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          i === q.correctIndex
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold'
                            : 'bg-slate-50 border-slate-200/70 text-[#64748B]'
                        }`}
                      >
                        <span>{opt}</span>
                        {i === q.correctIndex && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
