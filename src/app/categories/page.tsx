import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoryCard from '@/components/CategoryCard';
import { getAllTools } from '@/lib/tools';
import { CATEGORIES } from '@/types';

export const metadata: Metadata = {
  title: 'AI Tool Categories',
  description: 'Browse AI tools by category. Find tools for AI chat, image generation, coding, writing, audio, video, and more.',
};

export default function CategoriesPage() {
  const tools = getAllTools();

  const categoriesWithCount = CATEGORIES.map((cat) => ({
    ...cat,
    tool_count: tools.filter((t) => t.category.toLowerCase() === cat.name.toLowerCase()).length,
  }));

  return (
    <>
      <Header />

      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900">Categories</h1>
            <p className="text-secondary-500 mt-2">
              Browse AI tools organized by their primary use case
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesWithCount.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                toolCount={category.tool_count}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
