import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 text-secondary-400 mb-6">
            <Search className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">Page Not Found</h1>
          <p className="text-secondary-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn btn-primary px-6 py-3 rounded-lg">
              Go Home
            </Link>
            <Link href="/tools" className="btn btn-secondary px-6 py-3 rounded-lg">
              Browse Tools
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
