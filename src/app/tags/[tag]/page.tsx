import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTools } from '@/lib/tools';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, toolListJsonLd } from '@/lib/seo/json-ld';
import { getPricingLabel, getPricingColor } from '@/lib/landing-pages';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Tag, Star, ExternalLink, ChevronRight } from 'lucide-react';

const TAG_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  filter: (tool: ReturnType<typeof getAllTools>[0]) => boolean;
  heroDesc: string;
}> = {
  'free-plan': {
    name: 'Free Plan Available',
    description: 'AI tools with a free plan or tier — no credit card required to start.',
    heroDesc: 'Start using powerful AI tools for free. These tools offer a free plan or free trial so you can try before you buy.',
    filter: t => t.pricing === 'free' || t.has_free_tier,
  },
  'api-available': {
    name: 'API Available',
    description: 'AI tools with a public API for developers to integrate into their own products.',
    heroDesc: 'Build on top of AI with tools that expose a developer API. Integrate AI capabilities directly into your own applications.',
    filter: t => t.has_api,
  },
  'mobile-app': {
    name: 'Mobile App',
    description: 'AI tools with a dedicated iOS or Android mobile application.',
    heroDesc: 'Access AI tools on the go. These tools have dedicated mobile apps for iOS and Android.',
    filter: t => t.platforms.some(p => p.toLowerCase().includes('ios') || p.toLowerCase().includes('android') || p.toLowerCase().includes('mobile')),
  },
  'browser-extension': {
    name: 'Browser Extension',
    description: 'AI tools available as browser extensions for Chrome, Firefox, or Safari.',
    heroDesc: 'Add AI superpowers to your browser. These tools work as extensions you can install in Chrome, Firefox, and more.',
    filter: t => t.platforms.some(p => p.toLowerCase().includes('extension') || p.toLowerCase().includes('chrome') || p.toLowerCase().includes('browser')),
  },
  'open-source': {
    name: 'Open Source',
    description: 'Open source AI tools you can self-host, modify, and contribute to.',
    heroDesc: 'Transparency, privacy, and full control. These open source AI tools can be self-hosted and customized to your needs.',
    filter: t => t.content.toLowerCase().includes('open source') || t.content.toLowerCase().includes('open-source'),
  },
  'team-collaboration': {
    name: 'Team Collaboration',
    description: 'AI tools built for teams with shared workspaces, collaboration features, and multi-user support.',
    heroDesc: 'Level up your whole team with AI. These tools support team workspaces, shared projects, and collaborative workflows.',
    filter: t => {
      const c = t.content.toLowerCase();
      return c.includes('team') || c.includes('collaboration') || c.includes('workspace') || c.includes('organization');
    },
  },
  'gdpr-compliant': {
    name: 'GDPR Compliant',
    description: 'AI tools with GDPR compliance and strong data privacy practices.',
    heroDesc: 'Use AI with confidence. These tools are GDPR compliant with clear data privacy policies and European data storage options.',
    filter: t => t.content.toLowerCase().includes('gdpr'),
  },
  'no-signup': {
    name: 'No Signup Required',
    description: 'AI tools you can use immediately without creating an account.',
    heroDesc: 'Jump right in — no registration required. Try these AI tools instantly without creating an account.',
    filter: t => {
      const c = t.content.toLowerCase();
      return c.includes('no signup') || c.includes('no account') || c.includes('no registration');
    },
  },
  'offline': {
    name: 'Works Offline',
    description: 'AI tools that run locally or work without an internet connection.',
    heroDesc: 'AI that goes with you anywhere. These tools can run locally on your device without requiring an internet connection.',
    filter: t => {
      const c = t.content.toLowerCase();
      return c.includes('offline') || c.includes('local') || c.includes('on-device') || c.includes('self-hosted');
    },
  },
  'new-this-month': {
    name: 'New This Month',
    description: 'Recently launched and updated AI tools added to LaunchPilot this month.',
    heroDesc: 'Stay ahead of the curve. Discover the newest AI tools that have just launched or been significantly updated.',
    filter: () => true, // show all, sorted by newest
  },
};

interface TagPageProps {
  params: Promise<{ tag: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(TAG_DEFINITIONS).map(tag => ({ tag }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params;
  const def = TAG_DEFINITIONS[tag];
  if (!def) return { title: 'Not Found' };
  return buildMetadata({
    title: `${def.name} AI Tools`,
    description: def.description,
    path: `/tags/${tag}`,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const def = TAG_DEFINITIONS[tag];
  if (!def) notFound();

  const allTools = getAllTools();
  let tools = allTools.filter(def.filter);

  if (tag === 'new-this-month') {
    tools = allTools.slice(0, 30);
  }

  tools = tools.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Tags', href: '/tags' },
    { name: def.name, href: `/tags/${tag}` },
  ];

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListJsonLd(tools, def.name, `/tags/${tag}`)) }}
      />

      <main>
        <section className="bg-gradient-to-br from-secondary-900 to-secondary-800 text-white py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 text-sm text-secondary-400 mb-8" aria-label="Breadcrumb">
              {breadcrumbs.map((bc, i) => (
                <span key={bc.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  {i < breadcrumbs.length - 1 ? (
                    <Link href={bc.href} className="hover:text-white transition-colors">{bc.name}</Link>
                  ) : (
                    <span className="text-white font-medium">{bc.name}</span>
                  )}
                </span>
              ))}
            </nav>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Tag className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-secondary-300 uppercase tracking-wider">Tag</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">{def.name}</h1>
            <p className="text-xl text-secondary-300 max-w-2xl leading-relaxed">{def.heroDesc}</p>
            <p className="mt-4 text-secondary-400 text-sm">{tools.length} tools</p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {tools.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-secondary-500">No tools match this tag yet.</p>
              <Link href="/tools" className="mt-4 inline-flex text-primary-600 hover:underline text-sm">
                Browse all tools
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map(tool => (
                <article key={tool.slug} className="bg-white rounded-2xl border border-secondary-200 p-5 hover:border-primary-300 hover:shadow-md transition-all flex flex-col group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link href={`/tools/${tool.slug}`} className="text-base font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors leading-snug">
                      {tool.name}
                    </Link>
                    {tool.website_url && (
                      <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-600 flex-shrink-0">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-secondary-500 leading-relaxed mb-4 flex-1 line-clamp-3">{tool.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPricingColor(tool.pricing)}`}>
                      {getPricingLabel(tool.pricing)}
                    </span>
                    {tool.rating ? (
                      <span className="flex items-center gap-1 text-sm text-secondary-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {tool.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Related tags */}
          <div className="mt-16 pt-8 border-t border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Browse More Tags</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TAG_DEFINITIONS)
                .filter(([t]) => t !== tag)
                .map(([t, d]) => (
                  <Link
                    key={t}
                    href={`/tags/${t}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-secondary-200 text-secondary-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                  >
                    <Tag className="h-3 w-3" />
                    {d.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
