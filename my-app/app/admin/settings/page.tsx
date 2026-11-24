'use client';

import React, { useState } from 'react';
import { ShieldCheck, Save, Server, Lock } from 'lucide-react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('VOXY');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Platform Operations & Security
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Global configurations, role policies, and system-level parameters.
          </p>
        </div>

        <Card className="p-6 space-y-5">
          <h3 className="font-bold text-base text-[#1E293B]">Global EdTech Parameters</h3>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
              Brand Display Name
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full max-w-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1E293B]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-[#1E293B]">Public Student Registration</h4>
              <p className="text-[11px] text-[#64748B]">Allow new students to sign up from the landing page</p>
            </div>
            <input
              type="checkbox"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-[#1E293B]">Maintenance Mode</h4>
              <p className="text-[11px] text-[#64748B]">Lock public pages while running database migrations</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded"
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
            >
              Update Security Config
            </Button>
            {saved && (
              <span className="text-xs font-semibold text-emerald-600">
                ✓ Saved successfully
              </span>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
