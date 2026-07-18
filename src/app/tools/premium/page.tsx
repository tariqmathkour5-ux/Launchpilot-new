import { hasActiveSubscription, canAccessFeature } from '@/lib/subscription-guard';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function PremiumToolsPage() {
  // Check if user has active subscription for premium features
  const hasActive = await hasActiveSubscription();
  const canAccessAdvancedAI = await canAccessFeature('advanced_search');

  if (!hasActive || !canAccessAdvancedAI) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-secondary-50 py-16">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 mx-auto mb-6">
              <Lock className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-4">
              Premium AI Tools
            </h1>
            <p className="text-lg text-secondary-500 mb-8">
              Access advanced AI tools and premium features with a Pro or Enterprise subscription.
            </p>
            <div className="bg-white rounded-xl border border-secondary-200 p-8 mb-8">
              <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                What you get with Premium:
              </h2>
              <ul className="space-y-3 text-left">
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="text-secondary-600">Advanced AI-powered search and recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="text-secondary-600">Unlimited favorites and collections</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="text-secondary-600">Export comparisons and analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="text-secondary-600">Priority support and early access to features</span>
                </li>
              </ul>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Upgrade to Premium
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // User has access - show premium tools
  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Premium AI Tools</h1>
              <p className="text-sm text-secondary-500">Advanced tools for power users</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Welcome to Premium!
            </h2>
            <p className="text-secondary-600">
              You now have access to advanced AI tools and features. Premium tools will be available here soon.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}