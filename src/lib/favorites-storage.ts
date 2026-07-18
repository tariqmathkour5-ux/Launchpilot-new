// =====================================================
// FAVORITES STORAGE UTILITY
// Client-side favorites using localStorage with server sync
// =====================================================

import { Tool } from '@/types';

const FAVORITES_KEY = 'launchpilot_favorites';

export interface FavoriteItem {
  slug: string;
  name: string;
  category: string;
  addedAt: string;
}

/**
 * Get favorites from localStorage
 */
export function getLocalFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a tool to local favorites
 */
export function addLocalFavorite(tool: Tool): FavoriteItem[] {
  const favorites = getLocalFavorites();
  if (favorites.some(f => f.slug === tool.slug)) return favorites;
  
  const newFavorite: FavoriteItem = {
    slug: tool.slug,
    name: tool.name,
    category: tool.category,
    addedAt: new Date().toISOString(),
  };
  
  const updated = [newFavorite, ...favorites];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Remove a tool from local favorites
 */
export function removeLocalFavorite(slug: string): FavoriteItem[] {
  const favorites = getLocalFavorites();
  const updated = favorites.filter(f => f.slug !== slug);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Check if a tool is favorited locally
 */
export function isLocalFavorite(slug: string): boolean {
  const favorites = getLocalFavorites();
  return favorites.some(f => f.slug === slug);
}

/**
 * Clear all local favorites
 */
export function clearLocalFavorites(): void {
  localStorage.removeItem(FAVORITES_KEY);
}

/**
 * Sync local favorites to server
 */
export async function syncFavoritesToServer(): Promise<void> {
  const local = getLocalFavorites();
  try {
    await fetch('/api/user/favorites/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorites: local }),
    });
  } catch {
    // Server sync is best-effort
  }
}