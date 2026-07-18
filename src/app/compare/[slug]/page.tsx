import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTools, getAllToolSlugs } from '@/lib/tools';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd } from '@/lib/seo/json-ld';
import { getPricingLabel, getPricingColor } from '@/lib/landing-pages';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { CheckCircle2, XCircle, Star, ChevronRight, ArrowLeftRight, ExternalLink } from 'lucide-react';

interface ComparePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

function parseCompareSlug(slug: string): [string, string] | null {
  const match = slug.match(/^(.+)-vs-(.+)$/);
  if (!match) return null;
  return [match[1], match[2]];
}

export async function generateStaticParams() {
  const slugs = getAllToolSlugs();
  const pairs: { slug: string }[] = [];
  const tools = getAllTools();

  // Generate pairs within the same category
  const byCategory = tools.reduce<Record<string, string[]>>((acc, t) => {
    const cat = t.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t.slug);
    return acc;
  }, {});

  for (const [, catSlugs] of Object.entries(byCategory)) {
    for (let i = 0; i < Math.min(catSlugs.length, 5); i++) {
      for (let j = i + 1; j < Math.min(catSlugs.length, 5); j++) {
        pairs.push({ slug: `${catSlugs[i]}-vs-${catSlugs[j]}` });
      }
    }
  }

  return pairs.slice(0, 200);
}

export async function generateMetadata({ params }: ComparePageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = parseCompareSlug(slug);
  if (!parts) return { title: 'Not Found' };

  const allTools = getAllTools();
  const toolA = allTools.find(t => t.slug === parts[0]);
  const toolB = allTools.find(t => t.slug === parts[1]);
  if (!toolA || !toolB) return { title: 'Not Found' };

  return buildMetadata({
    title: `${toolA.name} vs ${toolB.name}: Detailed Comparison`,
    description: `Compare ${toolA.name} and ${toolB.name} — features, pricing, ratings, pros and cons. Find out which AI tool is best for your needs.`,
    path: `/compare/${slug}`,
  });
}

function FeatureRow({ label, a, b }: { label: string; a: boolean; b: boolean }) {
  return (
    <tr className="border-b border-secondary-100">
      <td className="px-5 py-3 text-sm text-secondary-700">{label}</td>
      <td className="px-5 py-3 text-center">
        {a ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-secondary-300 mx-auto" />}
      </td>
      <td className="px-5 py-3 text-center">
        {b ? <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" /> : <XCircle className="h-5 w-5 text-secondary-300 mx-auto" />}
      </td>
    </tr>
  );
}

export default async function ComparePage({ params }: ComparePageProps) {
  const { slug } = await params;
  const parts = parseCompareSlug(slug);
  if (!parts) notFound();

  const allTools = getAllTools();
  const toolA = allTools.find(t => t.slug === parts[0]);
  const toolB = allTools.find(t => t.slug === parts[1]);
  if (!toolA || !toolB) notFound();

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Compare', href: '/tools' },
    { name: `${toolA.name} vs ${toolB.name}`, href: `/compare/${slug}` },
  ];

  const sharedFeatures = toolA.features.filter(f =>
    toolB.features.some(bf => bf.toLowerCase().includes(f.toLowerCase().split(' ')[0]))
  );

  const relatedComparisons = allTools
    .filter(t => t.slug !== toolA.slug && t.slug !== toolB.slug && t.category === toolA.category)
    .slice(0, 4);

  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }}
      />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-secondary-900 to-primary-900 text-white py-14 lg:py-20">
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
              <ArrowLeftRight className="h-5 w-5 text-primary-300" />
              <span className="text-sm text-primary-300 uppercase tracking-wider font-medium">Head-to-Head Comparison</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              {toolA.name} <span className="text-primary-300">vs</span> {toolB.name}
            </h1>
            <p className="text-xl text-primary-200 max-w-2xl">
              A detailed side-by-side comparison to help you choose the right AI tool for your needs.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

          {/* Quick Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[toolA, toolB].map((tool, i) => (
              <div key={tool.slug} className={`bg-white rounded-2xl border-2 p-6 ${i === 0 ? 'border-primary-300' : 'border-secondary-200'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-600'}`}>
                        {i === 0 ? 'Option A' : 'Option B'}
                      </span>
                    </div>
                    <Link href={`/tools/${tool.slug}`} className="text-xl font-bold text-secondary-900 hover:text-primary-600 transition-colors">
                      {tool.name}
                    </Link>
                  </div>
                  {tool.website_url && (
                    <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-600">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {tool.rating && (
                  <div className="flex items-center gap-1.5 mb-3">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className={`h-4 w-4 ${si < Math.round(tool.rating!) ? 'fill-amber-400 text-amber-400' : 'text-secondary-200'}`} />
                    ))}
                    <span className="text-sm font-medium text-secondary-700 ml-1">{tool.rating.toFixed(1)} / 5</span>
                  </div>
                )}

                <p className="text-sm text-secondary-600 leading-relaxed mb-4">{tool.description}</p>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${getPricingColor(tool.pricing)}`}>
                    {getPricingLabel(tool.pricing)}
                  </span>
                  <span className="text-xs text-secondary-400 bg-secondary-50 px-2.5 py-1 rounded-full">{tool.category}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-secondary-900 mb-6">Feature Comparison</h2>
            <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary-50 border-b border-secondary-200">
                    <th className="text-left px-5 py-4 text-sm font-semibold text-secondary-700 w-1/2">Feature</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-primary-700">{toolA.name}</th>
                    <th className="text-center px-5 py-4 text-sm font-semibold text-secondary-700">{toolB.name}</th>
                  </tr>
                </thead>
                <tbody>
                  <FeatureRow label="Free Plan" a={toolA.pricing === 'free' || toolA.has_free_tier} b={toolB.pricing === 'free' || toolB.has_free_tier} />
                  <FeatureRow label="API Access" a={toolA.has_api} b={toolB.has_api} />
                  <FeatureRow label="Mobile App" a={toolA.platforms.some(p => p.toLowerCase().includes('ios') || p.toLowerCase().includes('android'))} b={toolB.platforms.some(p => p.toLowerCase().includes('ios') || p.toLowerCase().includes('android'))} />
                  <FeatureRow label="Browser Extension" a={toolA.platforms.some(p => p.toLowerCase().includes('extension') || p.toLowerCase().includes('chrome'))} b={toolB.platforms.some(p => p.toLowerCase().includes('extension') || p.toLowerCase().includes('chrome'))} />
                  <FeatureRow label="Team Collaboration" a={toolA.content.toLowerCase().includes('team')} b={toolB.content.toLowerCase().includes('team')} />
                  <FeatureRow label="Custom Integrations" a={toolA.integrations.length > 0} b={toolB.integrations.length > 0} />
                </tbody>
              </table>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[toolA, toolB].map((tool, i) => (
              <div key={tool.slug}>
                <h2 className="text-xl font-bold text-secondary-900 mb-4">
                  {tool.name} — Pros &amp; Cons
                </h2>
                <div className="space-y-4">
                  {tool.pros.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">Pros</h3>
                      <ul className="space-y-2">
                        {tool.pros.slice(0, 5).map((pro, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-secondary-700">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tool.cons.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-2 uppercase tracking-wide">Cons</h3>
                      <ul className="space-y-2">
                        {tool.cons.slice(0, 5).map((con, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-secondary-700">
                            <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-8 mb-12 border border-primary-100">
            <h2 className="text-2xl font-bold text-secondary-900 mb-4">Our Verdict</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Choose {toolA.name} if you…</h3>
                <ul className="space-y-1 text-sm text-secondary-600">
                  {toolA.use_cases.slice(0, 3).map((uc, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      Need {uc.toLowerCase()}
                    </li>
                  ))}
                  {toolA.has_free_tier && !toolB.has_free_tier && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      Want to start for free
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-secondary-900 mb-2">Choose {toolB.name} if you…</h3>
                <ul className="space-y-1 text-sm text-secondary-600">
                  {toolB.use_cases.slice(0, 3).map((uc, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                      Need {uc.toLowerCase()}
                    </li>
                  ))}
                  {toolB.has_free_tier && !toolA.has_free_tier && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-secondary-400 flex-shrink-0" />
                      Want to start for free
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Related comparisons */}
          {relatedComparisons.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-secondary-900 mb-4">Related Comparisons</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedComparisons.map(rt => (
                  <Link
                    key={rt.slug}
                    href={`/compare/${toolA.slug}-vs-${rt.slug}`}
                    className="bg-white rounded-xl border border-secondary-200 px-4 py-3 text-sm text-secondary-700 hover:border-primary-300 hover:text-primary-600 transition-all text-center"
                  >
                    {toolA.name} vs {rt.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
