'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Star, Reply, Flag, CheckCircle2, Loader2, ChevronDown, ChevronUp, AlertCircle, Send } from 'lucide-react';

interface Review {
  id: string; tool_id: string; tool_name: string; tool_slug: string;
  rating: number; title: string | null; content: string; user_name: string | null;
  helpful: number; verified: boolean; created_at: string;
  reply_text: string | null; reply_id: string | null;
  report_status: string | null;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fake', label: 'Fake Review' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'conflict_of_interest', label: 'Conflict of Interest' },
  { value: 'other', label: 'Other' },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [reportForm, setReportForm] = useState<Record<string, { reason: string; details: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<Record<string, 'reply' | 'report' | null>>({});

  useEffect(() => { loadReviews(); }, []);

  async function loadReviews() {
    try {
      const res = await fetch('/api/company/reviews');
      if (res.ok) {
        const { reviews } = await res.json();
        setReviews(reviews);
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitReply(reviewId: string) {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    setSaving(reviewId + '_reply');
    try {
      await fetch('/api/company/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', reviewId, replyText: text }),
      });
      setReplyText(t => ({ ...t, [reviewId]: '' }));
      setActiveAction(a => ({ ...a, [reviewId]: null }));
      loadReviews();
    } finally {
      setSaving(null);
    }
  }

  async function submitReport(reviewId: string) {
    const form = reportForm[reviewId];
    if (!form?.reason) return;
    setSaving(reviewId + '_report');
    try {
      await fetch('/api/company/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'report', reviewId, ...form }),
      });
      setActiveAction(a => ({ ...a, [reviewId]: null }));
      loadReviews();
    } finally {
      setSaving(null);
    }
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const repliedCount = reviews.filter(r => r.reply_id).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Review Management</h1>
        <p className="text-sm text-secondary-500 mt-0.5">Reply to customer reviews and manage feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Reviews', value: reviews.length, color: 'text-primary-600 bg-primary-50' },
          { label: 'Avg Rating', value: reviews.length ? avgRating.toFixed(1) + '/5' : '—', color: 'text-amber-600 bg-amber-50' },
          { label: 'Replied', value: `${repliedCount}/${reviews.length}`, color: 'text-green-600 bg-green-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-secondary-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
            <p className="text-xs text-secondary-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <MessageSquare className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No reviews yet for your tools.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
              {/* Review Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-secondary-900">{review.user_name || 'Anonymous'}</span>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-secondary-400">on</span>
                      <a href={`/tools/${review.tool_slug}`} className="text-xs text-primary-600 hover:underline">{review.tool_name}</a>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-secondary-200'}`} />
                      ))}
                      <span className="text-xs text-secondary-500 ml-1">{review.rating}/5</span>
                    </div>
                    {review.title && <p className="text-sm font-medium text-secondary-900 mb-1">{review.title}</p>}
                    <p className="text-sm text-secondary-600 leading-relaxed">{review.content}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-secondary-400">{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.report_status && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full capitalize">
                        Reported: {review.report_status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Existing Reply */}
                {review.reply_text && (
                  <div className="ml-4 pl-4 border-l-2 border-primary-200 mt-3">
                    <p className="text-xs font-semibold text-primary-600 mb-1">Your reply</p>
                    <p className="text-sm text-secondary-700">{review.reply_text}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setActiveAction(a => ({ ...a, [review.id]: a[review.id] === 'reply' ? null : 'reply' }))}
                    className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-primary-600 transition-colors"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    {review.reply_text ? 'Edit Reply' : 'Reply'}
                  </button>
                  {!review.report_status && (
                    <button
                      onClick={() => setActiveAction(a => ({ ...a, [review.id]: a[review.id] === 'report' ? null : 'report' }))}
                      className="flex items-center gap-1.5 text-xs text-secondary-500 hover:text-red-500 transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Report
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {activeAction[review.id] === 'reply' && (
                <div className="px-5 pb-5 border-t border-secondary-100 pt-4">
                  <textarea
                    value={replyText[review.id] || review.reply_text || ''}
                    onChange={e => setReplyText(t => ({ ...t, [review.id]: e.target.value }))}
                    rows={3}
                    placeholder="Write a professional response to this review..."
                    className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500 resize-none mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setActiveAction(a => ({ ...a, [review.id]: null }))} className="px-3 py-1.5 text-xs text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReply(review.id)}
                      disabled={saving === review.id + '_reply'}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                    >
                      {saving === review.id + '_reply' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Post Reply
                    </button>
                  </div>
                </div>
              )}

              {/* Report Form */}
              {activeAction[review.id] === 'report' && (
                <div className="px-5 pb-5 border-t border-secondary-100 pt-4">
                  <p className="text-xs font-medium text-secondary-700 mb-2">Report Reason</p>
                  <select
                    value={reportForm[review.id]?.reason || ''}
                    onChange={e => setReportForm(f => ({ ...f, [review.id]: { ...f[review.id], reason: e.target.value } }))}
                    className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 mb-2"
                  >
                    <option value="">Select reason...</option>
                    {REPORT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <textarea
                    value={reportForm[review.id]?.details || ''}
                    onChange={e => setReportForm(f => ({ ...f, [review.id]: { ...f[review.id], details: e.target.value } }))}
                    rows={2}
                    placeholder="Additional details (optional)"
                    className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary-500 resize-none mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setActiveAction(a => ({ ...a, [review.id]: null }))} className="px-3 py-1.5 text-xs text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">
                      Cancel
                    </button>
                    <button
                      onClick={() => submitReport(review.id)}
                      disabled={saving === review.id + '_report' || !reportForm[review.id]?.reason}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                    >
                      {saving === review.id + '_report' && <Loader2 className="h-3 w-3 animate-spin" />}
                      Submit Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
