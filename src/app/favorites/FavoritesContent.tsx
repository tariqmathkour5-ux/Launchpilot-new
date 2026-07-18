// =====================================================
// FAVORITES CONTENT (CLIENT COMPONENT)
// Manages favorites list with localStorage persistence
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Tool } from '@/types';
import { Heart, Trash2, ExternalLink, Star, ArrowRight, BookmarkPlus, Search } from 'lucide-react';
import { getLocalFavorites, removeLocalFavorite, clearLocalFavorites, FavoriteItem } from '@/lib/favorites-storage';

export default function FavoritesContent() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteTools, setFavoriteTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load favorites from localStorage
  useEffect(() => {
    const stored = getLocalFavorites();
    setFavorites(stored);
  }, []);

  // Load tool details for favorites
  useEffect(() => {
    async function loadTools() {
      if (favorites.length === 0) {
        setFavoriteTools([]);
        setLoading(false);
        return;
      }

      try {
        const slugs = favorites.map(f => f.slug).join(',');
        const response = await fetch(`/api/tools/search?slugs=${encodeURIComponent(slugs)}`);
        const result = await response.json();
        if (result.tools) {
          setFavoriteTools(result.tools);
        }
      } catch (err) {
        console.error('Failed to load favorite tools:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTools();
  }, [favorites]);

  const handleRemove = useCallback((slug: string) => {
    const updated = removeLocalFavorite(slug);
    setFavorites(updated);
    setFavoriteTools(prev => prev.filter(t => t.slug !== slug));
  }, []);

  const handleClearAll = useCallback(() => {
    clearLocalFavorites();
    setFavorites([]);
    setFavoriteTools([]);
  }, []);

  const filteredFavorites = searchQuery.trim()
    ? favoriteTools.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favoriteTools;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 mb-6">
          <BookmarkPlus className="h-8 w-8 text-secondary-400" />
        </div>
        <h2 className="text-xl font-semibold text-secondary-900 mb-2">No favorites yet</h2>
        <p className="text-secondary-500 mb-8 max-w-md mx-auto">
          Start browsing AI tools and save your favorites for quick access later.
        </p>
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Browse Tools
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-secondary-300 bg-white pl-10 pr-4 py-2 text-sm text-secondary-900 placeholder-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <button
          onClick={handleClearAll}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Clear all
        </button>
      </div>

      {/* Favorites Grid */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-secondary-500">No favorites match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map(tool => (
            <div key={tool.slug} className="card p-6 flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-lg font-semibold text-secondary-900 hover:text-primary-600 transition-colors truncate block"
                  >
                    {tool.name}
                  </Link>
                  <p className="text-sm text-primary-600 mt-0.5">{tool.category}</p>
                </div>
                <button
                  onClick={() => handleRemove(tool.slug)}
                  className="text-secondary-400 hover:text-red-500 transition-colors p-1"
                  title="Remove from favorites"
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
              </div>

              <p className="text-sm text-secondary-600 line-clamp-2 mb-4 flex-1">
                {tool.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {tool.pricing === 'freemium' && (
                  <span className="badge badge-success">Free tier</span>
                )}
                {tool.pricing === 'free' && (
                  <span className="badge badge-success">Free</span>
                )}
                {tool.has_api && (
                  <span className="badge badge-primary">API</span>
                )}
                {tool.rating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 rounded text-xs font-medium text-primary-700">
                    <Star className="h-3 w-3 text-primary-500 fill-primary-500" />
                    {tool.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-secondary-100">
                <Link
                  href={`/tools/${tool.slug}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                >
                  View details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {tool.website_url && (
                  <a
                    href={tool.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-secondary-500 hover:text-secondary-700 inline-flex items-center gap-1 ml-auto"
                  >
                    Visit <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}