'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Loader2, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  trial_days: number;
  features: string[];
  sort_order: number;
  limits: {
    favorites: number;
    collections: number;
    collection_items: number;
    comparisons: number;
  };
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/subscriptions/plans')
      .then(r => r.json())
      .then(setPlans)
      .finally(() => setLoading(false));
  }, []);

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(0)}`;
  }

  async function handleSubscribe(planSlug: string) {
    if (planSlug === 'free') {
      router.push('/auth/signup');
      return;
    }

    setCheckoutLoading(planSlug);
    
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: planSlug, 
          billing_cycle: billing 
        }),
      });

      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  }

  const highlighted = 'pro';

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

  // Sort plans: Free, Pro, Enterprise
  const sortedPlans = [...plans].sort((a, b) => {
    const order = { free: 0, pro: 1, enterprise: 2, business: 1 };
    return (order[a.slug as keyof typeof order] || 99) - (order[b.slug as keyof typeof order] || 99);
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="pt-16 pb-12 bg-gradient-to-b from-secondary-50 to-white">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-secondary-500 max-w-2xl mx-auto mb-8">
              Start free and upgrade as you grow. All plans include access to our entire AI tool directory.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center bg-secondary-100 rounded-xl p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billing === 'monthly' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billing === 'yearly' ? 'bg-white text-secondary-900 shadow-sm' : 'text-secondary-500'
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs text-green-600 font-semibold">Save 17%</span>
              </button>
            </div>
          </div>
        </section>

        {/* Plans grid */}
        <section className="pb-24 -mt-4">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sortedPlans.map(plan => {
                const price = billing === 'monthly' ? plan.monthly_price : plan.yearly_price;
                const isHighlighted = plan.slug === highlighted;
                const isFree = plan.slug === 'free';
                const isLoading = checkoutLoading === plan.slug;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                      isHighlighted
                        ? 'border-primary-500 shadow-xl shadow-primary-500/10'
                        : 'border-secondary-200'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-secondary-900">{plan.name}</h3>
                      <p className="text-sm text-secondary-500 mt-1">{plan.description}</p>
                    </div>

                    <div className="mb-6">
                      {isFree ? (
                        <div>
                          <span className="text-3xl font-bold text-secondary-900">Free</span>
                          <p className="text-xs text-secondary-400 mt-1">Forever free</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-secondary-900">
                              {formatPrice(price / (billing === 'yearly' ? 12 : 1))}
                            </span>
                            <span className="text-secondary-500 text-sm">/mo</span>
                          </div>
                          {billing === 'yearly' && (
                            <p className="text-xs text-secondary-400 mt-1">
                              Billed {formatPrice(price)} annually
                            </p>
                          )}
                          {plan.trial_days > 0 && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              {plan.trial_days}-day free trial
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={isLoading}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors inline-flex items-center justify-center gap-2 ${
                        isHighlighted
                          ? 'bg-primary-600 text-white hover:bg-primary-700'
                          : isFree
                          ? 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                          : 'bg-secondary-900 text-white hover:bg-secondary-800'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFree ? (
                        'Get Started'
                      ) : plan.trial_days > 0 ? (
                        'Start Free Trial'
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Subscribe
                        </>
                      )}
                    </button>

                    <ul className="mt-6 space-y-3 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-secondary-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}