import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTools } from '@/lib/tools';
import { USE_CASES, getPricingLabel, getPricingColor } from '@/lib/landing-pages';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbJsonLd, toolListJsonLd, faqJsonLd } from '@/lib/seo/json-ld';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Lightbulb, Star, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';

interface UseCasePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  return USE_CASES.map(uc => ({ slug: uc.slug }));
}

export async function generateMetadata({ params }: UseCasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = USE_CASES.find(uc => uc.slug === slug);
  if (!useCase) return { title: 'Not Found' };
  return buildMetadata({
    title: `Best AI Tools for ${useCase.name} in 2025`,
    description: useCase.description,
    path: `/use-cases/${slug}`,
  });
}

export default async function UseCasePage({ params }: UseCasePageProps) {
  const { slug } = await params;
  const useCase = USE_CASES.find(uc => uc.slug === slug);
  if (!useCase) notFound();

  const allTools = getAllTools();
  const tools = allTools
    .filter(t => {
      const content = (t.content + t.description + t.category + t.use_cases.join(' ') + t.features.join(' ')).toLowerCase();
      return useCase.keywords.some(kw => content.includes(kw));
    })
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  const featuredTools = tools.slice(0, 6);

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Use Cases', href: '/use-cases' },
    { name: useCase.name, href: `/use-cases/${slug}` },
  ];

  const faqs = [
    {
      question: `What are the best AI tools for ${useCase.name.toLowerCase()}?`,
      answer: featuredTools.slice(0, 3).map(t => t.name).join(', ') + (featuredTools.length > 3 ? ` and ${tools.length - 3} more tools` : '') + ` are among the top-rated AI tools for ${useCase.name.toLowerCase()} on LaunchPilot.`,
    },
    {
      question: `Are there free AI tools for ${useCase.name.toLowerCase()}?`,
      answer: `Yes, ${tools.filter(t => t.pricing === 'free' || t.has_free_tier).length} of the ${tools.length} AI tools for ${useCase.name.toLowerCase()} offer a free plan or free tier.`,
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolListJsonLd(tools, `AI Tools for ${useCase.name}`, `/use-cases/${slug}`)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />

      <main>
        <section className="bg-gradient-to-br from-primary-900 to-accent-900 text-white py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 text-sm text-primary-300 mb-8" aria-label="Breadcrumb">
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
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-primary-200 uppercase tracking-wider">Use Case</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Best AI Tools for {useCase.name}
            </h1>
            <p className="text-xl text-primary-200 max-w-2xl leading-relaxed">{useCase.description}</p>
            <div className="flex items-center gap-6 mt-8 text-sm text-primary-300">
              <span>{tools.length} tools found</span>
              <span>{tools.filter(t => t.pricing === 'free' || t.has_free_tier).length} with free plan</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {tools.length === 0 ? (
            <div className="text-center py-20 text-secondary-500">No tools found for this use case yet.</div>
          ) : (
            <>
              {/* Featured tools */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-secondary-900 mb-6">Top Recommended Tools</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featuredTools.map((tool, i) => (
                    <article key={tool.slug} className="bg-white rounded-2xl border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-md transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 font-bold text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <Link href={`/tools/${tool.slug}`} className="text-base font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                              {tool.name}
                            </Link>
                            {tool.website_url && (
                              <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-600 flex-shrink-0">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          {tool.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, si) => (
                                <Star key={si} className={`h-3.5 w-3.5 ${si < Math.round(tool.rating!) ? 'fill-amber-400 text-amber-400' : 'text-secondary-200'}`} />
                              ))}
                              <span className="text-xs text-secondary-500 ml-1">{tool.rating.toFixed(1)}</span>
                            </div>
                          )}
                          <p className="text-sm text-secondary-500 leading-relaxed line-clamp-2 mb-3">{tool.description}</p>
                          {tool.use_cases.slice(0, 2).map(uc => (
                            <div key={uc} className="flex items-center gap-1.5 text-xs text-secondary-600">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              {uc}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-100">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getPricingColor(tool.pricing)}`}>
                          {getPricingLabel(tool.pricing)}
                        </span>
                        <Link href={`/tools/${tool.slug}`} className="text-sm text-primary-600 font-medium hover:text-primary-700">
                          View details →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              {/* All tools table */}
              {tools.length > 6 && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 mb-6">All {tools.length} Tools</h2>
                  <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary-50 border-b border-secondary-200">
                        <tr>
                          <th className="text-left px-5 py-3 font-semibold text-secondary-700">Tool</th>
                          <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden md:table-cell">Category</th>
                          <th className="text-left px-5 py-3 font-semibold text-secondary-700">Pricing</th>
                          <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {tools.slice(6).map(tool => (
                          <tr key={tool.slug} className="hover:bg-secondary-50 transition-colors">
                            <td className="px-5 py-3">
                              <Link href={`/tools/${tool.slug}`} className="font-medium text-secondary-900 hover:text-primary-600 transition-colors">
                                {tool.name}
                              </Link>
                              <p className="text-xs text-secondary-400 line-clamp-1 mt-0.5">{tool.description}</p>
                            </td>
                            <td className="px-5 py-3 hidden md:table-cell">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600">{tool.category}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPricingColor(tool.pricing)}`}>
                                {getPricingLabel(tool.pricing)}
                              </span>
                            </td>
                            <td className="px-5 py-3 hidden sm:table-cell">
                              {tool.rating ? (
                                <span className="flex items-center gap-1 text-xs text-secondary-600">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {tool.rating.toFixed(1)}
                                </span>
                              ) : <span className="text-xs text-secondary-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* FAQ Section */}
              <div className="mt-16 bg-secondary-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-secondary-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-secondary-200">
                      <h3 className="font-semibold text-secondary-900 mb-2">{faq.question}</h3>
                      <p className="text-sm text-secondary-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
