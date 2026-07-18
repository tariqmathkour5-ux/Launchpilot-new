import { Metadata } from 'next';
import { USE_CASES } from '@/lib/landing-pages';
import { buildMetadata } from '@/lib/seo/metadata';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, Lightbulb } from 'lucide-react';

export const metadata: Metadata = buildMetadata({
  title: 'AI Tool Use Cases | LaunchPilot',
  description: 'Find the best AI tools for your specific use case — writing, coding, design, marketing, and more.',
  path: '/use-cases',
});

export default function UseCasesIndexPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-primary-900 to-accent-900 text-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-primary-200 mb-4">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm font-medium">Use Cases</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">AI Tools by Use Case</h1>
            <p className="text-xl text-primary-200 max-w-2xl">
              Find the right AI tool for exactly what you need to accomplish.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map(uc => (
              <Link
                key={uc.slug}
                href={`/use-cases/${uc.slug}`}
                className="group bg-white rounded-2xl border border-secondary-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                    {uc.name}
                  </h2>
                  <ArrowRight className="h-4 w-4 text-secondary-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-sm text-secondary-500 leading-relaxed">{uc.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
