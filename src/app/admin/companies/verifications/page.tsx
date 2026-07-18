'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface VerificationRequest {
  id: string; company_id: string; company_name: string; status: string;
  submitted_at: string; reviewed_at: string | null; rejection_reason: string | null;
  documents: Array<{ name: string; url: string }>; notes: string | null;
  reviewer_name: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-700 bg-amber-50', icon: Clock },
  under_review: { label: 'Under Review', color: 'text-blue-700 bg-blue-50', icon: Clock },
  verified: { label: 'Verified', color: 'text-green-700 bg-green-50', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-700 bg-red-50', icon: XCircle },
};

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    try {
      const res = await fetch(`/api/admin/verifications?status=${filter}`);
      if (res.ok) {
        const d = await res.json();
        setRequests(d.verifications);
      }
    } finally {
      setLoading(false);
    }
  }

  async function review(req: VerificationRequest, status: 'verified' | 'rejected' | 'under_review') {
    setReviewing(req.id);
    try {
      await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId: req.id,
          companyId: req.company_id,
          status,
          rejectionReason: status === 'rejected' ? rejectionReason[req.id] : undefined,
        }),
      });
      load();
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Company Verifications</h1>
        <p className="text-sm text-secondary-500 mt-0.5">Review and approve company verification requests</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'under_review', 'verified', 'rejected', ''].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-secondary-200 text-secondary-600 hover:border-primary-300'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <Shield className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No verification requests{filter ? ` with status "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
            const SIcon = cfg.icon;
            const isExpanded = expandedId === req.id;
            return (
              <div key={req.id} className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-secondary-50 transition-colors text-left"
                >
                  <SIcon className={`h-5 w-5 flex-shrink-0 ${cfg.color.split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary-900">{req.company_name}</p>
                    <p className="text-xs text-secondary-400">
                      Submitted {new Date(req.submitted_at).toLocaleDateString()}
                      {req.reviewed_at && ` · Reviewed ${new Date(req.reviewed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-secondary-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-secondary-400 flex-shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-secondary-100 pt-4 space-y-4">
                    {req.notes && (
                      <div>
                        <p className="text-xs font-medium text-secondary-500 mb-1">Company Notes</p>
                        <p className="text-sm text-secondary-700">{req.notes}</p>
                      </div>
                    )}
                    {req.documents?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-secondary-500 mb-2">Documents</p>
                        <div className="space-y-1.5">
                          {req.documents.map((doc, i) => (
                            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                              {doc.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {req.rejection_reason && (
                      <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
                        <span className="font-medium">Rejection reason: </span>{req.rejection_reason}
                      </div>
                    )}

                    {['pending', 'under_review'].includes(req.status) && (
                      <div className="space-y-3 pt-2 border-t border-secondary-100">
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">Rejection reason (if rejecting)</label>
                          <input
                            value={rejectionReason[req.id] || ''}
                            onChange={e => setRejectionReason(r => ({ ...r, [req.id]: e.target.value }))}
                            placeholder="Explain why the request is rejected..."
                            className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          {req.status === 'pending' && (
                            <button onClick={() => review(req, 'under_review')} disabled={reviewing === req.id}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                              {reviewing === req.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              Mark Under Review
                            </button>
                          )}
                          <button onClick={() => review(req, 'verified')} disabled={reviewing === req.id}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                            {reviewing === req.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </button>
                          <button onClick={() => review(req, 'rejected')} disabled={reviewing === req.id || !rejectionReason[req.id]}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50">
                            {reviewing === req.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <XCircle className="h-4 w-4" /> Reject
                          </button>
                        </div>
                        {req.status === 'under_review' && !rejectionReason[req.id] && (
                          <p className="text-xs text-secondary-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Enter a rejection reason before rejecting.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
