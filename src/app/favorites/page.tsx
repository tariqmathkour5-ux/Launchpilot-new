// =====================================================
// FAVORITES PAGE
// Displays user's saved/favorited tools
// =====================================================

import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FavoritesContent from './FavoritesContent';

export const metadata: Metadata = {
  title: 'My Favorites - Saved AI Tools',
  description: 'View and manage your saved AI tools. Access your favorite tools quickly from one place.',
};

export default function FavoritesPage() {
  return (
    <>
      <Header />
      <main className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900">My Favorites</h1>
            <p className="text-secondary-500 mt-2">
              Your saved AI tools for quick access
            </p>
          </div>
          <FavoritesContent />
        </div>
      </main>
      <Footer />
    </>
  );
}