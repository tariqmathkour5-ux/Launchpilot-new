import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { buildMetadata } from '@/lib/seo/metadata';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: 'AI Tool Collections | LaunchPilot',
  description: 'Browse curated collections of the best AI tools for every use case, role, and industry.',
  path: '/collections',
});

export default async function CollectionsIndexPage() {
  let pages: Array<{
    slug: string; title: string; description: string | null;
    heading: string | null; tool_count: number; view_count: number;
  }> = [];

  try {
    pages = await prisma.$queryRaw`SELECT slug, title, description, heading, tool_count, view_count
      FROM seo_landing_pages WHERE is_published = true ORDER BY sort_order`;
  } catch { /* DB unavailable */ }

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-secondary-900 to-primary-900 text-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-primary-300 mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Curated Collections</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">AI Tool Collections</h1>
            <p className="text-xl text-primary-200 max-w-2xl">
              Expertly curated lists of the best AI tools for every use case, industry, and role.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {pages.length === 0 ? (
            <p className="text-center text-secondary-500 py-20">No collections available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map(page => (
                <Link
                  key={page.slug}
                  href={`/collections/${page.slug}`}
                  className="group bg-white rounded-2xl border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 flex-shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors leading-snug">
                      {page.heading || page.title}
                    </h2>
                  </div>
                  {page.description && (
                    <p className="text-sm text-secondary-500 leading-relaxed mb-4 flex-1 line-clamp-3">
                      {page.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-secondary-100">
                    <span className="text-xs text-secondary-400">Curated tools</span>
                    <span className="text-sm text-primary-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Browse <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
