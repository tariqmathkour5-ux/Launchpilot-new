import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ToolGrid from '@/components/ToolGrid';
import { searchTools } from '@/lib/tools';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: 'Search AI Tools',
  description: 'Search our comprehensive database of AI tools to find the perfect solution for your needs.',
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  if (!q || q.trim().length < 2) {
    notFound();
  }

  const tools = searchTools(q.trim());

  return (
    <>
      <Header />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900">Search Results</h1>
            <p className="text-secondary-500 mt-2">
              Found {tools.length} tools for "{q}"
            </p>
          </div>

          <ToolGrid tools={tools} />
        </div>
      </main>

      <Footer />
    </>
  );
}
