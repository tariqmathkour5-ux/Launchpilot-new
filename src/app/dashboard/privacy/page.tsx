'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, Search, MousePointer, Share2, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PrivacySettings {
  personalization_enabled: boolean;
  track_views: boolean;
  track_searches: boolean;
  track_clicks: boolean;
  share_collections: boolean;
}

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try {
      const res = await fetch('/api/personalization/privacy');
      if (res.ok) setSettings(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: keyof PrivacySettings, value: boolean) {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    try {
      await fetch('/api/personalization/privacy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function deleteData(target: string) {
    setDeleting(true);
    try {
      await fetch(`/api/personalization/privacy?target=${target}`, { method: 'DELETE' });
      setShowDeleteConfirm(null);
    } catch { /* ignore */ } finally {
      setDeleting(false);
    }
  }

  if (loading) {
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

  if (!settings) return null;

  const toggles: { key: keyof PrivacySettings; icon: React.ElementType; title: string; description: string }[] = [
    { key: 'personalization_enabled', icon: Shield, title: 'Personalized Recommendations', description: 'Show personalized tool recommendations based on your activity' },
    { key: 'track_views', icon: Eye, title: 'Track Page Views', description: 'Remember which tools and pages you visit to improve suggestions' },
    { key: 'track_searches', icon: Search, title: 'Track Searches', description: 'Use your search history to personalize search results' },
    { key: 'track_clicks', icon: MousePointer, title: 'Track Clicks', description: 'Track affiliate link clicks and recommendation interactions' },
    { key: 'share_collections', icon: Share2, title: 'Public Collections', description: 'Allow others to discover your public collections' },
  ];

  const deleteOptions = [
    { target: 'interests', title: 'Interest Profile', description: 'All learned preferences and category weights' },
    { target: 'history', title: 'Browsing History', description: 'All recently viewed items' },
    { target: 'favorites', title: 'Favorites & Folders', description: 'All saved favorites and folders' },
    { target: 'collections', title: 'Collections', description: 'All created collections and their items' },
    { target: 'all', title: 'Everything', description: 'Delete all personalization data permanently' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Privacy Controls</h1>
              <p className="text-sm text-secondary-500">Manage how your data is used for personalization</p>
            </div>
          </div>

          {/* Toggle settings */}
          <div className="bg-white rounded-xl border border-secondary-200 divide-y divide-secondary-100 mb-8">
            {toggles.map(({ key, icon: Icon, title, description }) => (
              <div key={key} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{title}</p>
                    <p className="text-xs text-secondary-500">{description}</p>
                  </div>
                </div>
                <button
                  onClick={() => updateSetting(key, !settings[key])}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] ? 'bg-primary-500' : 'bg-secondary-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            ))}
          </div>

          {saving && <p className="text-xs text-primary-500 mb-4">Saving...</p>}

          {/* Delete data section */}
          <div className="bg-white rounded-xl border border-red-200">
            <div className="p-5 border-b border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h2 className="text-base font-semibold text-secondary-900">Delete Data</h2>
              </div>
              <p className="text-xs text-secondary-500 mt-1">Permanently delete your personalization data. This cannot be undone.</p>
            </div>
            <div className="divide-y divide-secondary-100">
              {deleteOptions.map(option => (
                <div key={option.target} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{option.title}</p>
                    <p className="text-xs text-secondary-500">{option.description}</p>
                  </div>
                  {showDeleteConfirm === option.target ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deleteData(option.target)}
                        disabled={deleting}
                        className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                      >
                        {deleting ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="text-xs text-secondary-500 hover:text-secondary-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(option.target)}
                      className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
