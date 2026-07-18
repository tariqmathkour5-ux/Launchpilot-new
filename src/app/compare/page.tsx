import Link from 'next/link';
import { ArrowLeft, GitCompare, X, Plus, ArrowRight } from 'lucide-react';
import { getToolBySlugKb, searchToolsKb } from '@/lib/tools-kb';
import { getToolsForComparison } from '@/lib/tools-compare';
import CompareClient from './CompareClient';

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string; c?: string; d?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const toolSlugs = [params.a, params.b, params.c, params.d].filter(Boolean) as string[];
  const uniqueSlugs = [...new Set(toolSlugs)];

  // Load all tools for the selector
  const allTools = searchToolsKb({}).tools;
  const toolsForSelect = getToolsForComparison(allTools);

  // Get selected tools (deduplicated)
  const selectedTools = uniqueSlugs
    .map(slug => getToolBySlugKb(slug))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <GitCompare className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-secondary-900">Compare Tools</h1>
          </div>
          <p className="text-secondary-600">Side-by-side comparison of AI tools to help you choose the right one.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <CompareClient
          allTools={allTools}
          toolsForSelect={toolsForSelect}
          initialSlugs={uniqueSlugs}
        />

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/tools" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </Link>
        </div>
      </div>
    </div>
  );
}

// Generate metadata
export async function generateMetadata({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const toolA = params.a ? getToolBySlugKb(params.a) : undefined;
  const toolB = params.b ? getToolBySlugKb(params.b) : undefined;
  
  let title = 'Compare AI Tools - LaunchPilot';
  let description = 'Side-by-side comparison of AI tools to help you choose the right solution for your needs.';
  
  if (toolA && toolB) {
    title = `${toolA.name} vs ${toolB.name} - Compare AI Tools`;
    description = `Compare ${toolA.name} and ${toolB.name} across features, pricing, and platforms.`;
  }
  
  return {
    title,
    description,
    alternates: {
      canonical: 'https://launchpilot.app/compare',
    },
  };
}