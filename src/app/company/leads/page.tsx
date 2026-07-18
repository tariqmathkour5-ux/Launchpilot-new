'use client';

import { useState, useEffect } from 'react';
import { Plus, Loader2, UserCheck, Filter, Trash2, Edit2, X, CheckCircle2, Save, AlertCircle } from 'lucide-react';

interface Lead {
  id: string; name: string; email: string | null; phone: string | null;
  company_name: string | null; source: string; status: string;
  notes: string | null; created_at: string;
}

interface LeadCount { status: string; count: number; }

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost'];
const SOURCE_OPTIONS = ['organic', 'campaign', 'referral', 'direct', 'social', 'email', 'other'];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-secondary-100 text-secondary-500',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<LeadCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company_name: '', source: 'direct', notes: '' });

  useEffect(() => { loadLeads(); }, [filter]);

  async function loadLeads() {
    try {
      const url = filter ? `/api/company/leads?status=${filter}` : '/api/company/leads';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setLeads(d.leads);
        setCounts(d.counts);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveLead() {
    setSaving(true);
    try {
      if (editLead) {
        await fetch('/api/company/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: editLead.id, notes: form.notes, status: editLead.status }),
        });
        setEditLead(null);
      } else {
        await fetch('/api/company/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        setShowForm(false);
        setForm({ name: '', email: '', phone: '', company_name: '', source: 'direct', notes: '' });
      }
      loadLeads();
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(leadId: string, status: string) {
    await fetch('/api/company/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, status }),
    });
    loadLeads();
  }

  async function deleteLead(leadId: string) {
    await fetch(`/api/company/leads?leadId=${leadId}`, { method: 'DELETE' });
    loadLeads();
  }

  const totalLeads = counts.reduce((s, c) => s + c.count, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Lead Management</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Track and manage potential customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUS_OPTIONS.map(status => {
          const count = counts.find(c => c.status === status)?.count || 0;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? '' : status)}
              className={`rounded-xl border p-3 text-center transition-all ${filter === status ? 'border-primary-300 bg-primary-50' : 'border-secondary-200 bg-white hover:border-secondary-300'}`}
            >
              <p className="text-xl font-bold text-secondary-900">{count}</p>
              <p className={`text-xs mt-0.5 font-medium px-2 py-0.5 rounded-full capitalize inline-block ${STATUS_COLORS[status]}`}>{status}</p>
            </button>
          );
        })}
      </div>

      {/* Add Lead Form */}
      {showForm && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">New Lead</h3>
            <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-secondary-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Company</label>
              <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                {SOURCE_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">Cancel</button>
            <button onClick={saveLead} disabled={saving || !form.name} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add Lead
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <UserCheck className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No leads yet. Add your first lead to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-secondary-700">Lead</th>
                <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Contact</th>
                <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden md:table-cell">Source</th>
                <th className="text-center px-5 py-3 font-semibold text-secondary-700">Status</th>
                <th className="text-right px-5 py-3 font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-secondary-900">{lead.name}</p>
                    {lead.company_name && <p className="text-xs text-secondary-400">{lead.company_name}</p>}
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell text-secondary-500">
                    {lead.email && <p className="text-xs">{lead.email}</p>}
                    {lead.phone && <p className="text-xs">{lead.phone}</p>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 capitalize">{lead.source}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <select
                      value={lead.status}
                      onChange={e => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 ${STATUS_COLORS[lead.status]}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-secondary-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
