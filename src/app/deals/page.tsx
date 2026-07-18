import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DealCard from '@/components/DealCard';
import DealSubscriptionForm from './DealSubscriptionForm';
import { getActiveDeals, Deal } from '@/data/deals';
import { getAllTools } from '@/lib/tools';
import { Tag, Clock, TrendingDown, Percent, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Exclusive Deals Hub - AI Tool Promo Codes & Price Drops',
  description: 'Discover exclusive deals, promo codes, and price drops on top AI tools. Save up to 50% on ChatGPT, Midjourney, GitHub Copilot, and more.',
};

export const revalidate = 3600; // Revalidate every hour

export default function DealsPage() {
  const deals = getActiveDeals();
  const tools = getAllTools();
  
  // Get unique categories from tools that have deals
  const dealCategories = [...new Set(deals.map(d => d.toolSlug))];
  
  const promoDeals = deals.filter(d => d.type === 'promo_code');
  const priceDropDeals = deals.filter(d => d.type === 'price_drop');
  const highPriorityDeals = deals.filter(d => d.priority === 'high');

  // Calculate time remaining for expiring deals
  const getDaysRemaining = (expiresAt: string | undefined) => {
    if (!expiresAt) return null;
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-secondary-50 py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning-500 to-primary-600">
                <Tag className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              Exclusive Deals Hub
            </h1>
            <p className="text-lg text-secondary-500 max-w-2xl mx-auto">
              Hand-picked offers on the best AI tools. Save money on ChatGPT, Midjourney, 
              Claude, and 100+ other AI tools with exclusive promo codes and price drops.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-secondary-200 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Percent className="h-5 w-5 text-primary-600" />
                <span className="text-2xl font-bold text-secondary-900">{deals.length}</span>
              </div>
              <p className="text-sm text-secondary-500">Active Deals</p>
            </div>
            <div className="bg-white rounded-xl border border-secondary-200 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-success-600" />
                <span className="text-2xl font-bold text-secondary-900">
                  {Math.max(...deals.map(d => parseInt(d.discount) || 0))}%
                </span>
              </div>
              <p className="text-sm text-secondary-500">Max Savings</p>
            </div>
            <div className="bg-white rounded-xl border border-secondary-200 p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-warning-600" />
                <span className="text-2xl font-bold text-secondary-900">
                  {highPriorityDeals.length}
                </span>
              </div>
              <p className="text-sm text-secondary-500">Hot Deals Ending Soon</p>
            </div>
          </div>

          {/* Featured/Hot Deals Section */}
          {highPriorityDeals.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="h-6 w-6 text-warning-600" />
                <h2 className="text-2xl font-bold text-secondary-900">Hot Deals</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highPriorityDeals.map(deal => (
                  <DealCard 
                    key={deal.id} 
                    deal={deal} 
                    daysRemaining={getDaysRemaining(deal.expiresAt)}
                    featured={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Deals Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">All Deals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map(deal => (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  daysRemaining={getDaysRemaining(deal.expiresAt)}
                />
              ))}
            </div>
          </section>

          {/* Deal Types Legend */}
          <section className="mb-12">
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Deal Types</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Promo Code
                  </span>
                  <span className="text-sm text-secondary-600">
                    {promoDeals.length} deals with discount codes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Price Drop
                  </span>
                  <span className="text-sm text-secondary-600">
                    {priceDropDeals.length} deals with reduced pricing
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Subscription Form */}
          <section className="mb-12">
            <div className="bg-gradient-to-r from-primary-50 to-accent-50/30 rounded-xl border border-primary-200/50 p-8">
              <DealSubscriptionForm availableTools={tools} />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}