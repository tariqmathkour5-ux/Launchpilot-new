"use client";

import Link from 'next/link';
import { Tag, Clock, TrendingDown, Percent, Copy, ExternalLink, Zap } from 'lucide-react';
import { Deal } from '@/data/deals';
import { useState } from 'react';

interface DealCardProps {
  deal: Deal;
  daysRemaining: number | null;
  featured?: boolean;
}

export default function DealCard({ deal, daysRemaining, featured = false }: DealCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (deal.promoCode) {
      await navigator.clipboard.writeText(deal.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPriorityStyles = () => {
    if (featured) {
      return 'border-warning-200 bg-gradient-to-br from-warning-50 to-primary-50/30';
    }
    switch (deal.priority) {
      case 'high':
        return 'border-warning-200 bg-warning-50/20';
      case 'medium':
        return 'border-secondary-200 bg-white';
      case 'low':
        return 'border-secondary-200 bg-secondary-50/50';
      default:
        return 'border-secondary-200 bg-white';
    }
  };

  const getBadgeStyles = () => {
    if (deal.type === 'promo_code') {
      return 'bg-primary-100 text-primary-800';
    }
    return 'bg-success-100 text-success-800';
  };

  return (
    <article className={`rounded-xl border ${getPriorityStyles()} p-6 flex flex-col h-full transition-all hover:shadow-lg`}>
      {/* Header with Badge */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeStyles()} mb-2`}>
            {deal.type === 'promo_code' ? <Tag className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {deal.type === 'promo_code' ? 'Promo Code' : 'Price Drop'}
          </span>
          <h3 className="text-xl font-bold text-secondary-900">
            <Link href={`/tools/${deal.toolSlug}`} className="hover:text-primary-600 transition-colors">
              {deal.toolName}
            </Link>
          </h3>
        </div>
        {featured && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
            <Zap className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Deal Title */}
      <h4 className="text-lg font-semibold text-secondary-800 mb-2">{deal.title}</h4>

      {/* Description */}
      <p className="text-sm text-secondary-600 mb-4 flex-grow">{deal.description}</p>

      {/* Pricing Info */}
      {deal.type === 'price_drop' && deal.originalPrice && deal.newPrice && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-lg border border-secondary-200">
          <div className="text-secondary-500 line-through text-sm">{deal.originalPrice}</div>
          <div className="text-success-600 font-bold text-lg">{deal.newPrice}</div>
        </div>
      )}

      {/* Promo Code */}
      {deal.type === 'promo_code' && deal.promoCode && (
        <div className="flex items-center justify-between mb-4 p-3 bg-secondary-100 rounded-lg">
          <div>
            <p className="text-xs text-secondary-500 uppercase font-medium mb-1">Promo Code</p>
            <code className="text-lg font-bold text-secondary-900">{deal.promoCode}</code>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Expiration & CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-secondary-200">
        {daysRemaining !== null && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5 text-secondary-400" />
            <span className={daysRemaining <= 3 ? 'text-warning-600 font-medium' : 'text-secondary-500'}>
              {daysRemaining === 0 ? 'Expires today!' : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`}
            </span>
          </div>
        )}
        <a
          href={deal.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          {deal.ctaText}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}