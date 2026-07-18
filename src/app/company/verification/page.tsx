'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Clock, XCircle, AlertCircle, Plus, FileText, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';

interface Verification {
  id: string; status: string; submitted_at: string; reviewed_at: string | null;
  rejection_reason: string | null; documents: Array<{ name: string; url: string }>;
  notes: string | null; reviewer_name: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  pending: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock, desc: 'Your request has been submitted and is awaiting review.' },
  under_review: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Clock, desc: 'Your request is actively being reviewed by our team.' },
  verified: { label: 'Verified', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle2, desc: 'Your company is verified. A badge will appear on your public profile.' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle, desc: 'Your verification request was rejected. See the reason below.' },
};

export default function VerificationPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [docs, setDocs] = useState<Array<{ name: string; url: string }>>([{ name: '', url: '' }]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/company/verification');
      if (res.ok) {
        const d = await res.json();
        setVerifications(d.verifications);
      }
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      const validDocs = docs.filter(d => d.name && d.url);
      const res = await fetch('/api/company/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, documents: validDocs }),
      });
      if (res.ok) {
        setShowForm(false);
        setNotes('');
        setDocs([{ name: '', url: '' }]);
        load();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to submit verification request.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function addDoc() {
    setDocs(d => [...d, { name: '', url: '' }]);
  }

  function removeDoc(idx: number) {
    setDocs(d => d.filter((_, i) => i !== idx));
  }

  function updateDoc(idx: number, field: 'name' | 'url', value: string) {
    setDocs(d => d.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const latest = verifications[0];
  const hasActiveRequest = latest && ['pending', 'under_review'].includes(latest.status);
  const isVerified = latest?.status === 'verified';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Company Verification</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Build trust with a verified badge on your profile</p>
        </div>
        {!hasActiveRequest && !isVerified && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <Shield className="h-4 w-4" /> Apply for Verification
          </button>
        )}
      </div>

      {/* Current Status Banner */}
      {latest && (() => {
        const cfg = STATUS_CONFIG[latest.status] || STATUS_CONFIG.pending;
        const StatusIcon = cfg.icon;
        return (
          <div className={`border rounded-xl p-5 mb-6 ${cfg.bg}`}>
            <div className="flex items-start gap-3">
              <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
              <div className="flex-1">
                <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
                <p className={`text-sm mt-0.5 ${cfg.color} opacity-80`}>{cfg.desc}</p>
                {latest.rejection_reason && (
                  <div className="mt-2 p-3 bg-white/60 rounded-lg text-sm text-red-700">
                    <span className="font-medium">Reason: </span>{latest.rejection_reason}
                  </div>
                )}
                {isVerified && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-white/60 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified badge is active on your public profile
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* No verification yet */}
      {!latest && !showForm && (
        <div className="bg-white rounded-xl border border-secondary-200 p-10 text-center mb-6">
          <Shield className="h-12 w-12 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-600 font-medium mb-1">Get Verified</p>
          <p className="text-sm text-secondary-400 mb-4 max-w-sm mx-auto">
            Verified companies receive a badge on their profile, increasing trust and visibility in search results.
          </p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <Shield className="h-4 w-4" /> Apply for Verification
          </button>
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Verification Request</h3>
            <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-secondary-400" /></button>
          </div>

          <div className="bg-white border border-secondary-200 rounded-lg p-4 mb-4 text-sm text-secondary-600">
            <p className="font-medium text-secondary-800 mb-1">What we verify:</p>
            <ul className="list-disc list-inside space-y-1 text-secondary-500">
              <li>Company registration documents</li>
              <li>Official website ownership</li>
              <li>Legitimate business presence</li>
              <li>Tool ownership and authenticity</li>
            </ul>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-secondary-700">Supporting Documents</label>
              <button onClick={addDoc} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add document
              </button>
            </div>
            <div className="space-y-2">
              {docs.map((doc, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input value={doc.name} onChange={e => updateDoc(idx, 'name', e.target.value)}
                    placeholder="Document name" className="flex-1 text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                  <input value={doc.url} onChange={e => updateDoc(idx, 'url', e.target.value)}
                    placeholder="URL" className="flex-1 text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
                  {docs.length > 1 && (
                    <button onClick={() => removeDoc(idx)} className="text-secondary-400 hover:text-red-500 flex-shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-secondary-700 mb-1">Additional Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Any additional context to help reviewers verify your company..."
              className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500 resize-none" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">Cancel</button>
            <button onClick={submit} disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </div>
      )}

      {/* Audit History */}
      {verifications.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-secondary-500 uppercase tracking-wider mb-3">Request History</h2>
          <div className="space-y-3">
            {verifications.map((v, i) => {
              const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
              const VIcon = cfg.icon;
              const isExpanded = expandedId === v.id;
              return (
                <div key={v.id} className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <VIcon className={`h-4 w-4 ${cfg.color}`} />
                      <div className="text-left">
                        <p className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</p>
                        <p className="text-xs text-secondary-400">
                          Submitted {new Date(v.submitted_at).toLocaleDateString()}
                          {v.reviewed_at && ` · Reviewed ${new Date(v.reviewed_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Latest</span>}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-secondary-400" /> : <ChevronDown className="h-4 w-4 text-secondary-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-secondary-100 pt-3 space-y-3">
                      {v.rejection_reason && (
                        <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                          <span className="font-medium">Rejection reason: </span>{v.rejection_reason}
                        </div>
                      )}
                      {v.notes && (
                        <div>
                          <p className="text-xs font-medium text-secondary-500 mb-1">Your notes</p>
                          <p className="text-sm text-secondary-700">{v.notes}</p>
                        </div>
                      )}
                      {v.documents && v.documents.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-secondary-500 mb-2">Documents</p>
                          <div className="space-y-1.5">
                            {v.documents.map((doc, di) => (
                              <a key={di} href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                                <FileText className="h-3.5 w-3.5" />
                                {doc.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {v.reviewer_name && (
                        <p className="text-xs text-secondary-400">Reviewed by {v.reviewer_name}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
