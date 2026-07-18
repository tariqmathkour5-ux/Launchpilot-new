// =====================================================
// SIMILAR TOOLS COMPONENT
// Displays related tools with match reasons using the recommendation engine
// =====================================================

import Link from 'next/link';
import { Tool } from '@/types';
import { ArrowRight, Sparkles, Tag, Check, Star, TrendingUp } from 'lucide-react';
import { RelatedToolResult } from '@/lib/related-tools-engine';

interface SimilarToolsProps {
  similarTools: Tool[] | RelatedToolResult[];
  currentToolSlug: string;
  showReasons?: boolean;
}

export default function SimilarTools({ similarTools, currentToolSlug, showReasons = true }: SimilarToolsProps) {
  if (similarTools.length === 0) {
    return null;
  }

  // Check if we have RelatedToolResult objects (with score/reasons) or plain Tool objects
  const hasReasons = showReasons && 'score' in similarTools[0] && 'matchReasons' in similarTools[0];
  const results = hasReasons
    ? (similarTools as RelatedToolResult[])
    : (similarTools as Tool[]).map(t => ({ tool: t, score: 0, matchReasons: [] as string[] }));

  return (
    <section className="py-16 lg:py-24 bg-secondary-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Related Tools</h2>
            <p className="text-secondary-500 text-sm">
              Recommended tools with similar features and capabilities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(({ tool, score, matchReasons }) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="group">
              <article className="card p-6 h-full flex flex-col transition-all duration-200 group-hover:shadow-lg">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-primary-600 mt-1">{tool.category}</p>
                  </div>
                  {score > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary-50 rounded-lg">
                      <TrendingUp className="h-3.5 w-3.5 text-primary-500" />
                      <span className="text-xs font-medium text-primary-700">{Math.round(score)}%</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-secondary-600 line-clamp-2 mb-4">
                  {tool.description}
                </p>

                {/* Match Reasons */}
                {matchReasons.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {matchReasons.slice(0, 2).map((reason, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 text-accent-700 rounded-full text-xs">
                          <Check className="h-3 w-3" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {tool.pricing === 'freemium' && (
                    <span className="badge badge-success">Free tier</span>
                  )}
                  {tool.pricing === 'free' && (
                    <span className="badge badge-success">Free</span>
                  )}
                  {tool.has_api && (
                    <span className="badge badge-primary">API</span>
                  )}
                  {tool.platforms?.slice(0, 2).map((platform) => (
                    <span key={platform} className="badge badge-secondary">
                      {platform}
                    </span>
                  ))}
                </div>

                {tool.features && tool.features.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-secondary-100">
                    <p className="text-xs text-secondary-500 uppercase font-medium mb-2">Key Features</p>
                    <ul className="grid grid-cols-1 gap-1">
                      {tool.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-center gap-1.5 text-xs text-secondary-600">
                          <Check className="h-3 w-3 text-accent-500 flex-shrink-0" />
                          <span className="truncate">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/tools" 
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Browse all tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
