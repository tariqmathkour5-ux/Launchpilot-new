'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Plus, Loader2, X, TrendingUp, MousePointerClick, Eye, DollarSign } from 'lucide-react';

interface Campaign {
  id: string; title: string; description: string | null; type: string; position: string;
  status: string; clicks: number; impressions: number; budget: number | null; spent: number;
  startDate: string; endDate: string; createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-secondary-100 text-secondary-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ARCHIVED: 'bg-secondary-100 text-secondary-400',
};

const AD_TYPES = ['IMAGE', 'TEXT', 'HTML'];
const AD_POSITIONS = ['HEADER', 'SIDEBAR', 'FOOTER', 'INLINE', 'POPUP'];

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  IMAGE: 'Featured Tool (Image)',
  TEXT: 'Homepage Promotion (Text)',
  HTML: 'Sponsored Category (HTML)',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '', type: 'IMAGE', position: 'SIDEBAR', linkUrl: '', imageUrl: '',
    budget: '', startDate: '', endDate: '',
  });

  useEffect(() => { loadCampaigns(); }, []);

  async function loadCampaigns() {
    try {
      const res = await fetch('/api/company/campaigns');
      if (res.ok) {
        const { campaigns } = await res.json();
        setCampaigns(campaigns);
      }
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign() {
    setCreating(true);
    try {
      await fetch('/api/company/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ title: '', type: 'IMAGE', position: 'SIDEBAR', linkUrl: '', imageUrl: '', budget: '', startDate: '', endDate: '' });
      loadCampaigns();
    } finally {
      setCreating(false);
    }
  }

  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Marketing Campaigns</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Promote your tools and grow your audience</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Megaphone, label: 'Active', value: activeCampaigns, color: 'text-green-600 bg-green-50' },
          { icon: Eye, label: 'Impressions', value: totalImpressions.toLocaleString(), color: 'text-blue-600 bg-blue-50' },
          { icon: MousePointerClick, label: 'Clicks', value: totalClicks.toLocaleString(), color: 'text-primary-600 bg-primary-50' },
          { icon: TrendingUp, label: 'CTR', value: totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(1)}%` : '—', color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-secondary-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-secondary-500">{s.label}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-secondary-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Create Campaign Form */}
      {showForm && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Create Campaign</h3>
            <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-secondary-400" /></button>
          </div>

          {/* Campaign Types Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-white rounded-lg border border-secondary-200">
            <div className="text-xs text-center p-2">
              <p className="font-semibold text-secondary-800">Featured Tool</p>
              <p className="text-secondary-500 mt-0.5">Highlight your tool with a visual banner</p>
            </div>
            <div className="text-xs text-center p-2">
              <p className="font-semibold text-secondary-800">Homepage</p>
              <p className="text-secondary-500 mt-0.5">Appear on the homepage feed</p>
            </div>
            <div className="text-xs text-center p-2">
              <p className="font-semibold text-secondary-800">Sponsored Category</p>
              <p className="text-secondary-500 mt-0.5">Top of category listings</p>
            </div>
            <div className="text-xs text-center p-2">
              <p className="font-semibold text-secondary-800">Comparison</p>
              <p className="text-secondary-500 mt-0.5">Feature in compare pages</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Campaign Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Summer Product Launch" className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Campaign Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                {AD_TYPES.map(t => <option key={t} value={t}>{CAMPAIGN_TYPE_LABELS[t] || t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Position</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                {AD_POSITIONS.map(p => <option key={p} value={p} className="capitalize">{p.toLowerCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Destination URL *</label>
              <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://yourproduct.com" className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            {form.type === 'IMAGE' && (
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-1">Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..." className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="e.g. 500" className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">Cancel</button>
            <button onClick={createCampaign} disabled={creating || !form.title || !form.linkUrl || !form.startDate || !form.endDate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <Megaphone className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500 mb-2">No campaigns yet.</p>
          <p className="text-sm text-secondary-400">Create your first campaign to promote your tools.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-secondary-700">Campaign</th>
                <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden md:table-cell">Type</th>
                <th className="text-center px-5 py-3 font-semibold text-secondary-700">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Impressions</th>
                <th className="text-right px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Clicks</th>
                <th className="text-right px-5 py-3 font-semibold text-secondary-700 hidden lg:table-cell">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-secondary-900">{c.title}</p>
                    <p className="text-xs text-secondary-400">
                      {new Date(c.startDate).toLocaleDateString()} — {new Date(c.endDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600">{c.type}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[c.status] || 'bg-secondary-100 text-secondary-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right hidden sm:table-cell text-secondary-600">{c.impressions.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right hidden sm:table-cell text-secondary-600">{c.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right hidden lg:table-cell text-secondary-600">
                    {c.impressions > 0 ? `${((c.clicks / c.impressions) * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
