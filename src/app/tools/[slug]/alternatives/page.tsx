import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { parseToolPage, parseAlternative, getAllToolSlugs, getAllTools } from '@/lib/tools';
import { renderMarkdownContent } from '@/lib/markdown';

interface AlternativesPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const slugs = getAllToolSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AlternativesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = parseToolPage(slug);
  if (!tool) return { title: 'Alternatives Not Found' };

  return {
    title: `${tool.name} Alternatives - Top Competitors Compared`,
    description: `Compare the best ${tool.name} alternatives. Find free, open-source, and premium options with detailed comparison.`,
  };
}

export default async function AlternativesPage({ params }: AlternativesPageProps) {
  const { slug } = await params;
  const tool = parseToolPage(slug);
  const alternative = parseAlternative(slug);

  if (!tool || !alternative) {
    notFound();
  }

  const allTools = getAllTools();
  const relatedTools = allTools
    .filter((t) => t.category === tool.category && t.slug !== slug)
    .slice(0, 6);

  return (
    <>
      <Header />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6">
            <Link
              href={`/tools/${slug}`}
              className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to {tool.name}
            </Link>
          </nav>

          <article className="card p-6 lg:p-8">
            <header className="mb-8 pb-6 border-b border-secondary-200">
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
                {tool.name} Alternatives
              </h1>
              <p className="text-secondary-600">
                Comprehensive comparison of the best {tool.name} alternatives in {tool.category}
              </p>
            </header>

            <div className="prose prose-secondary max-w-none">
              {renderMarkdownContent(alternative.content)}
            </div>
          </article>

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-secondary-900 mb-6">Related Tools</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {relatedTools.map((relatedTool) => (
                  <Link
                    key={relatedTool.slug}
                    href={`/tools/${relatedTool.slug}`}
                    className="card p-4 hover:border-primary-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-secondary-900 hover:text-primary-600">
                          {relatedTool.name}
                        </h3>
                        <p className="text-sm text-secondary-500 mt-1 line-clamp-1">
                          {relatedTool.description}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-secondary-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 flex gap-4">
            <Link href={`/tools/${slug}/reviews`} className="btn btn-secondary">
              Read Review
            </Link>
            <Link href={`/tools/${slug}`} className="btn btn-primary">
              Back to Tool
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
