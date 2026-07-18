import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvancedSearch from '@/components/AdvancedSearch';
import { searchToolsKb, getToolsCount } from '@/lib/tools-kb';
import { CATEGORIES } from '@/types';
import { toJsonLdScript, organizationJsonLd, breadcrumbJsonLd, toolListJsonLd } from '@/lib/seo/json-ld';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'All AI Tools - Complete Directory',
  description: 'Browse our comprehensive directory of AI tools. Find the perfect AI solution for your workflow with detailed reviews and comparisons.',
};

export default async function ToolsPage() {
  // Get tools count for display
  const countInfo = getToolsCount();
  
  // Get initial tools from knowledge base (paginated for performance)
  // The AdvancedSearch component will handle client-side filtering and pagination
  const initialLimit = 100; // Initial load - user can search/filter to get more
  
  const allToolsResult = searchToolsKb({ 
    limit: initialLimit,
    offset: 0,
    excludeAgents: true // Exclude agent tools from main directory
  });
  
  // Also get all tools for the search component's client-side filtering
  // Note: For very large datasets, this sends all tools to client for filtering
  const fullToolsResult = searchToolsKb({ 
    limit: countInfo.aiTools, // Load all non-agent tools for client-side filtering
    excludeAgents: true 
  });
  
  const tools = fullToolsResult.tools;
  const categories = fullToolsResult.filters.categories.filter(c => c !== 'ai-agents');
  const platforms = fullToolsResult.filters.platforms;
  const pricingOptions = fullToolsResult.filters.pricingOptions;

  return (
    <>
      <Header />

      {/* Structured Data: Organization + BreadcrumbList + ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Tools', href: '/tools' },
          ])),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLdScript(toolListJsonLd(
            tools.slice(0, 20).map(t => ({
              slug: t.slug,
              name: t.name,
              description: t.description,
              rating: t.rating,
            })),
            'All AI Tools - Complete Directory',
            '/tools'
          )),
        }}
      />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900">All AI Tools</h1>
            <p className="text-secondary-500 mt-2">
              Explore {countInfo.aiTools.toLocaleString()} AI tools across {categories.length} categories
            </p>
            <p className="text-secondary-400 mt-1 text-sm">
              (Agent system tools are managed separately)
            </p>
          </div>

          <AdvancedSearch
            tools={tools}
            categories={categories}
            platforms={platforms}
            pricingOptions={pricingOptions}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}