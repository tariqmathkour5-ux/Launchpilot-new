'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Building2, Globe, MapPin, Calendar, Users, Phone, Mail, CheckCircle2, AlertCircle, Image, Link as LinkIcon } from 'lucide-react';

const SIZE_OPTIONS = ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'];
const SIZE_LABELS: Record<string, string> = {
  STARTUP: 'Startup (1–10)', SMALL: 'Small (11–50)', MEDIUM: 'Medium (51–200)',
  LARGE: 'Large (201–1000)', ENTERPRISE: 'Enterprise (1000+)',
};

interface CompanyProfile {
  id: string; name: string; slug: string; logo: string | null; website: string | null;
  description: string | null; industry: string | null; size: string | null;
  founded: number | null; headquarters: string | null; email: string | null;
  phone: string | null; status: string; verified: boolean;
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', website: '', industry: '', size: '',
    founded: '', headquarters: '', email: '', phone: '', logo: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/company/profile');
        if (res.ok) {
          const { company } = await res.json();
          setProfile(company);
          setForm({
            name: company.name || '',
            description: company.description || '',
            website: company.website || '',
            industry: company.industry || '',
            size: company.size || '',
            founded: company.founded?.toString() || '',
            headquarters: company.headquarters || '',
            email: company.email || '',
            phone: company.phone || '',
            logo: company.logo || '',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/company/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, founded: form.founded ? parseInt(form.founded) : null }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Company Profile</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Manage your public company information</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {error}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Branding */}
        <section className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Image className="h-4 w-4 text-secondary-400" />
            Branding
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Company Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Logo URL</label>
              <div className="flex gap-2">
                <input
                  value={form.logo}
                  onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
                  placeholder="https://..."
                  className="flex-1 text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500"
                />
                {form.logo && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-50 border border-secondary-200 overflow-hidden flex-shrink-0">
                    <img src={form.logo} alt="Logo preview" className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500 resize-none"
                placeholder="Tell the world about your company..."
              />
            </div>
          </div>
        </section>

        {/* Company Details */}
        <section className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-secondary-400" />
            Company Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://yourcompany.com"
                  className="w-full text-sm border border-secondary-200 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Industry</label>
              <input
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                placeholder="e.g. Artificial Intelligence"
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Team Size</label>
              <select
                value={form.size}
                onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500"
              >
                <option value="">Select size</option>
                {SIZE_OPTIONS.map(s => (
                  <option key={s} value={s}>{SIZE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Founded Year</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="number"
                  value={form.founded}
                  onChange={e => setForm(f => ({ ...f, founded: e.target.value }))}
                  placeholder="e.g. 2020"
                  min={1900}
                  max={new Date().getFullYear()}
                  className="w-full text-sm border border-secondary-200 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Headquarters</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  value={form.headquarters}
                  onChange={e => setForm(f => ({ ...f, headquarters: e.target.value }))}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full text-sm border border-secondary-200 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl border border-secondary-200 p-6">
          <h2 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-secondary-400" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contact@yourcompany.com"
                  className="w-full text-sm border border-secondary-200 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-sm border border-secondary-200 rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Verification Status */}
        {profile && (
          <section className={`rounded-xl border p-5 ${profile.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              {profile.verified ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <p className={`font-semibold ${profile.verified ? 'text-green-800' : 'text-amber-800'}`}>
                  {profile.verified ? 'Verified Company' : 'Verification Pending'}
                </p>
                <p className={`text-sm ${profile.verified ? 'text-green-600' : 'text-amber-600'}`}>
                  {profile.verified
                    ? 'Your company profile is verified. A badge appears on your public page.'
                    : 'Submit documents to get a verification badge on your profile.'}
                </p>
              </div>
              {!profile.verified && (
                <a href="/company/verification" className="ml-auto text-sm text-amber-700 font-medium hover:underline whitespace-nowrap">
                  Start verification →
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
