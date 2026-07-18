import Link from 'next/link';
import { Star, ExternalLink, Check, Tag } from 'lucide-react';
import { Tool } from '@/types';
import { hasActiveDeal } from '@/lib/deals-utils';

interface ToolCardProps {
  tool: Tool;
  showRating?: boolean;
}

export default function ToolCard({ tool, showRating = true }: ToolCardProps) {
  const categorySlug = tool.category.toLowerCase().replace(/\s+/g, '-');
  const hasDeal = hasActiveDeal(tool.slug);

  return (
    <article className="card p-6 h-full flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/tools/${tool.slug}`} className="text-lg font-semibold text-secondary-900 hover:text-primary-600 transition-colors truncate">
              {tool.name}
            </Link>
            {tool.website_url && (
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary-400 hover:text-primary-600 transition-colors"
                aria-label="Visit website"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <Link
            href={`/categories/${categorySlug}`}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            {tool.category}
          </Link>
        </div>
        {showRating && tool.rating && (
          <div className="flex items-center gap-1 px-2 py-1 bg-primary-50 rounded-lg">
            <Star className="h-4 w-4 text-primary-500 fill-primary-500" />
            <span className="text-sm font-medium text-primary-700">{tool.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-secondary-600 line-clamp-2 mb-4">
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {hasDeal && (
          <Link 
            href="/deals" 
            className="badge badge-warning inline-flex items-center gap-1 group"
          >
            <Tag className="h-3 w-3 group-hover:animate-pulse" />
            Deal
          </Link>
        )}
        {tool.pricing === 'freemium' && (
          <span className="badge badge-success">Free tier</span>
        )}
        {tool.pricing === 'free' && (
          <span className="badge badge-success">Free</span>
        )}
        {tool.has_api && (
          <span className="badge badge-primary">API</span>
        )}
        {tool.platforms.slice(0, 2).map((platform) => (
          <span key={platform} className="badge badge-secondary">
            {platform}
          </span>
        ))}
      </div>

      {tool.features.length > 0 && (
        <div className="mt-auto pt-4 border-t border-secondary-100">
          <p className="text-xs text-secondary-500 uppercase font-medium mb-2">Key Features</p>
          <ul className="grid grid-cols-2 gap-1">
            {tool.features.slice(0, 4).map((feature) => (
              <li key={feature} className="flex items-center gap-1.5 text-xs text-secondary-600">
                <Check className="h-3 w-3 text-accent-500 flex-shrink-0" />
                <span className="truncate">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
