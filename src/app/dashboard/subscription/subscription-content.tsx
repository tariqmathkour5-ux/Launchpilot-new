'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard, ArrowUpRight, Loader2, Receipt, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface SubscriptionData {
  subscription: {
    id: string;
    plan_name: string;
    plan_slug: string;
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string;
    trial_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  plan: { name: string; slug: string };
  limits: Record<string, number>;
  usage: Record<string, number>;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export default function SubscriptionContent() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if returning from Stripe checkout
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setShowSuccess(true);
    }

    Promise.all([
      fetch('/api/subscriptions/current').then(r => r.json()),
      fetch('/api/subscriptions/invoices').then(r => r.json()),
    ]).then(([subData, invData]) => {
      setData(subData);
      setInvoices(Array.isArray(invData) ? invData : []);
    }).finally(() => setLoading(false));
  }, [searchParams]);

  async function cancelSubscription(immediate: boolean) {
    setActionLoading(true);
    await fetch('/api/subscriptions/current', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', immediate }),
    });
    setShowCancel(false);
    const res = await fetch('/api/subscriptions/current');
    setData(await res.json());
    setActionLoading(false);
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
        <Footer />
      </>
    );
  }

  if (!data) return null;

  const sub = data.subscription;
  const isActive = sub && (sub.status === 'active' || sub.status === 'trialing');
  const isFree = data.plan.slug === 'free';

  const limitEntries = Object.entries(data.limits || {}).filter(([_, v]) => v !== 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-green-900 font-medium">Subscription activated successfully!</p>
                <p className="text-green-700 text-sm">Your payment was processed and your plan is now active.</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Subscription</h1>
              <p className="text-sm text-secondary-500">Manage your plan and billing</p>
            </div>
          </div>

          {/* Current Plan */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-secondary-900">{data.plan.name} Plan</h2>
                  {sub && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      sub.status === 'active' ? 'bg-green-50 text-green-700' :
                      sub.status === 'trialing' ? 'bg-blue-50 text-blue-700' :
                      sub.status === 'past_due' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-secondary-100 text-secondary-600'
                    }`}>
                      {sub.status === 'trialing' ? 'Trial' : sub.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
                {sub && sub.cancel_at_period_end && (
                  <p className="text-sm text-orange-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Cancels at end of period ({new Date(sub.current_period_end).toLocaleDateString()})
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {isFree ? (
                  <Link href="/pricing" className="btn btn-primary text-sm px-4 py-2 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4" /> Upgrade
                  </Link>
                ) : (
                  <>
                    <Link href="/pricing" className="btn btn-secondary text-sm px-4 py-2 flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4" /> Change Plan
                    </Link>
                    {isActive && !sub?.cancel_at_period_end && (
                      <button
                        onClick={() => setShowCancel(true)}
                        className="text-sm px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {sub && isActive && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-secondary-100">
                <div>
                  <p className="text-xs text-secondary-500">Billing Cycle</p>
                  <p className="text-sm font-medium text-secondary-900 capitalize">{sub.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Renewal Date</p>
                  <p className="text-sm font-medium text-secondary-900">{new Date(sub.current_period_end).toLocaleDateString()}</p>
                </div>
                {sub.trial_end && (
                  <div>
                    <p className="text-xs text-secondary-500">Trial Ends</p>
                    <p className="text-sm font-medium text-secondary-900">{new Date(sub.trial_end).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cancel confirmation */}
          {showCancel && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
              <h3 className="text-base font-semibold text-red-900 mb-2">Cancel Subscription?</h3>
              <p className="text-sm text-red-700 mb-4">
                You can cancel immediately or at the end of your current billing period.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => cancelSubscription(false)}
                  disabled={actionLoading}
                  className="text-sm px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                >
                  Cancel at Period End
                </button>
                <button
                  onClick={() => cancelSubscription(true)}
                  disabled={actionLoading}
                  className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cancel Immediately
                </button>
                <button onClick={() => setShowCancel(false)} className="text-sm text-secondary-500 hover:text-secondary-700 ml-2">
                  Keep Plan
                </button>
              </div>
            </div>
          )}

          {/* Usage Limits */}
          {limitEntries.length > 0 && (
            <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
              <h3 className="text-base font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary-500" /> Usage & Limits
              </h3>
              <div className="space-y-4">
                {limitEntries.map(([metric, limit]) => {
                  const current = data.usage[metric] || 0;
                  const unlimited = limit === -1;
                  const percentage = unlimited ? 0 : Math.min((current / limit) * 100, 100);
                  const isNearLimit = !unlimited && percentage >= 80;

                  return (
                    <div key={metric}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-secondary-700 capitalize">{metric.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-secondary-500">
                          {unlimited ? 'Unlimited' : `${current} / ${limit}`}
                        </span>
                      </div>
                      {!unlimited && (
                        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-orange-500' : 'bg-primary-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Billing History */}
          <div className="bg-white rounded-xl border border-secondary-200">
            <div className="p-5 border-b border-secondary-100">
              <h3 className="text-base font-semibold text-secondary-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary-500" /> Billing History
              </h3>
            </div>
            {invoices.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500 text-sm">No invoices yet</p>
              </div>
            ) : (
              <div className="divide-y divide-secondary-50">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{inv.invoice_number}</p>
                      <p className="text-xs text-secondary-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                        inv.status === 'refunded' ? 'bg-orange-50 text-orange-700' :
                        'bg-secondary-100 text-secondary-600'
                      }`}>
                        {inv.status}
                      </span>
                      <span className="text-sm font-medium text-secondary-900">
                        ${(inv.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}