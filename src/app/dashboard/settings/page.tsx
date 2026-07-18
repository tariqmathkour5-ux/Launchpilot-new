'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Settings, User, Mail, Globe, Bell, Shield, CreditCard,
  Save, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';

interface UserSettings {
  language: string;
  timezone: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
  publicProfile: boolean;
  weeklyToolDigest: boolean;
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Riyadh', label: 'Riyadh (Asia/Riyadh)' },
  { value: 'America/New_York', label: 'New York (America/New_York)' },
  { value: 'Europe/London', label: 'London (Europe/London)' },
  { value: 'Europe/Berlin', label: 'Berlin (Europe/Berlin)' },
];

export default function SettingsPage() {
  const { data: session } = useSession();
const [settings, setSettings] = useState<UserSettings>({
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    marketingEmails: false,
    publicProfile: false,
    weeklyToolDigest: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Load settings from database
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // Use defaults if no settings exist
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update settings');
        setIsSaving(false);
        return;
      }

      setSuccess('Settings updated successfully');
    } catch {
      setError('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Dashboard Settings</h1>
              <p className="text-sm text-secondary-500">Configure your preferences and account settings</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-600 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* User Profile Summary */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4" /> Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="text"
                      value={session?.user?.name || ''}
                      className="input pl-10 bg-secondary-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-secondary-400 mt-1">
                    <Link href="/dashboard/profile" className="text-primary-600 hover:underline">
                      Edit in Profile
                    </Link>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="email"
                      value={session?.user?.email || ''}
                      className="input pl-10 bg-secondary-50 cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-secondary-400 mt-1">
                    <Link href="/dashboard/profile" className="text-primary-600 hover:underline">
                      Manage in Profile
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Regional Settings */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4" /> Regional Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="input"
                  >
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="input"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

{/* Notification Settings */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" /> Notification Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Email Notifications</p>
                    <p className="text-xs text-secondary-500">Receive important updates via email</p>
                  </div>
                  <label className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Weekly Tool Digest</p>
                    <p className="text-xs text-secondary-500">Get a weekly summary of new AI tools</p>
                  </div>
                  <label className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <input
                      type="checkbox"
                      checked={settings.weeklyToolDigest}
                      onChange={(e) => setSettings({ ...settings, weeklyToolDigest: e.target.checked })}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.weeklyToolDigest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Marketing Emails</p>
                    <p className="text-xs text-secondary-500">Receive news and promotional offers</p>
                  </div>
                  <label className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <input
                      type="checkbox"
                      checked={settings.marketingEmails}
                      onChange={(e) => setSettings({ ...settings, marketingEmails: e.target.checked })}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.marketingEmails ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" /> Privacy Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Public Profile</p>
                    <p className="text-xs text-secondary-500">Make your profile visible to others</p>
                  </div>
                  <label className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                    <input
                      type="checkbox"
                      checked={settings.publicProfile}
                      onChange={(e) => setSettings({ ...settings, publicProfile: e.target.checked })}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        settings.publicProfile ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* IBAN Information */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Information
              </h2>
              <div>
                <p className="text-sm text-secondary-500 mb-3">
                  IBAN is used for payouts and refunds. Update it in your profile settings.
                </p>
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <User className="h-4 w-4" />
                  <span>Go to Profile to update IBAN</span>
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}