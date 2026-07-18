'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, TrendingUp, Folder, ArrowRight, Loader2, Heart } from 'lucide-react';

interface RecommendedTool {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  pricing: string;
  rating: number | null;
  reason?: string;
}

interface PersonalizedData {
  recommended: RecommendedTool[];
  recentlyViewed: RecommendedTool[];
  newInCategories: RecommendedTool[];
  trending: RecommendedTool[];
}

function MiniToolCard({ tool, onFavorite }: { tool: RecommendedTool; onFavorite?: (id: string) => void }) {
  return (
    <div className="group relative bg-white rounded-xl border border-secondary-200 p-4 hover:border-primary-300 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/tools/${tool.slug}`}
          className="text-sm font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-1"
        >
          {tool.name}
        </Link>
        {onFavorite && (
          <button
            onClick={() => onFavorite(tool.id)}
            className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-red-500 transition-all"
          >
            <Heart className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-secondary-500 line-clamp-2 mb-3">{tool.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 capitalize">
          {tool.pricing}
        </span>
        {tool.rating && (
          <span className="text-xs font-medium text-primary-600">{tool.rating.toFixed(1)}/5</span>
        )}
      </div>
      {tool.reason && (
        <p className="mt-2 text-xs text-primary-500 italic">{tool.reason}</p>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, tools, onFavorite, viewAllHref }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  tools: RecommendedTool[];
  onFavorite?: (id: string) => void;
  viewAllHref?: string;
}) {
  if (tools.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
            <p className="text-xs text-secondary-500">{subtitle}</p>
          </div>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.slice(0, 4).map(tool => (
          <MiniToolCard key={tool.id || tool.slug} tool={tool} onFavorite={onFavorite} />
        ))}
      </div>
    </div>
  );
}

export default function PersonalizedHomepage() {
  const [data, setData] = useState<PersonalizedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/personalization/recommendations');
        if (!res.ok) {
          setError(true);
          return;
        }
        setData(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleFavorite = async (toolId: string) => {
    try {
      await fetch('/api/personalization/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_type: 'tool', item_id: toolId }),
      });
    } catch { /* silent fail */ }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !data) return null;

  const hasPersonalData = data.recommended.length > 0 || data.recentlyViewed.length > 0 || data.newInCategories.length > 0;

  if (!hasPersonalData && data.trending.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-secondary-50/50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {hasPersonalData && (
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-bold text-secondary-900">Personalized For You</h2>
          </div>
        )}

        <Section
          icon={Sparkles}
          title="Recommended"
          subtitle="Based on your interests and activity"
          tools={data.recommended}
          onFavorite={handleFavorite}
          viewAllHref="/tools"
        />

        <Section
          icon={Clock}
          title="Continue Exploring"
          subtitle="Pick up where you left off"
          tools={data.recentlyViewed}
          viewAllHref="/dashboard/history"
        />

        <Section
          icon={Folder}
          title="New in Your Categories"
          subtitle="Recent additions in categories you follow"
          tools={data.newInCategories}
          onFavorite={handleFavorite}
        />

        <Section
          icon={TrendingUp}
          title="Trending Now"
          subtitle="Popular tools across the platform"
          tools={data.trending}
          onFavorite={handleFavorite}
          viewAllHref="/tools"
        />
      </div>
    </section>
  );
}
