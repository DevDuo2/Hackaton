'use client';

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Globe,
  Shield,
  Moon,
  Sun,
  Save,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function SettingsPage() {
  const [name, setName] = useState('Zumradxon Xudoyberganova');
  const [email, setEmail] = useState('zumradxon@voxy.edu');
  const [language, setLanguage] = useState('Uzbek (Lotin)');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B]">
            Platform Settings
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage your personal profile, notification preferences, and learning parameters.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Account Details */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[#1E293B]">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E293B] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2563EB] text-[#1E293B]"
                />
              </div>
            </div>
          </Card>

          {/* Preferences */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[#1E293B]">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#1E293B]">Platform Language</h4>
                  <p className="text-xs text-[#64748B]">Select the default interface language</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="Uzbek (Lotin)">O'zbek (Lotin)</option>
                  <option value="English">English</option>
                  <option value="Russian">Русский</option>
                </select>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-semibold text-[#1E293B]">Daily Study Reminders</h4>
                  <p className="text-xs text-[#64748B]">Receive motivational streak notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-[#2563EB] rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#1E293B]">Theme Mode</h4>
                  <p className="text-xs text-[#64748B]">Default: Light Mode (Dark mode ready for Phase 2)</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-[#64748B] rounded-lg">
                  Light Theme Active
                </span>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
            {saved && (
              <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
                ✓ Preferences updated successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
