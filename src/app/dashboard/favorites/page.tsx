'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, FolderPlus, Trash2, Loader2, Star, ExternalLink, Palette } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Favorite {
  id: string;
  item_type: string;
  item_id: string;
  folder_id: string | null;
  created_at: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  folder_name: string | null;
}

interface Folder {
  id: string;
  name: string;
  color: string | null;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const res = await fetch('/api/personalization/favorites');
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
        setFolders(data.folders || []);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(id: string) {
    await fetch(`/api/personalization/favorites?id=${id}`, { method: 'DELETE' });
    setFavorites(prev => prev.filter(f => f.id !== id));
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await fetch('/api/personalization/favorites/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
    });
    setNewFolderName('');
    setShowNewFolder(false);
    loadFavorites();
  }

  async function deleteFolder(folderId: string) {
    await fetch(`/api/personalization/favorites/folders?id=${folderId}`, { method: 'DELETE' });
    if (activeFolder === folderId) setActiveFolder(null);
    loadFavorites();
  }

  const filteredFavorites = activeFolder
    ? favorites.filter(f => f.folder_id === activeFolder)
    : favorites;

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <Heart className="h-5 w-5 fill-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">My Favorites</h1>
                <p className="text-sm text-secondary-500">{favorites.length} saved items</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewFolder(true)}
              className="btn btn-secondary text-sm flex items-center gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </button>
          </div>

          {showNewFolder && (
            <div className="mb-6 p-4 bg-white rounded-xl border border-secondary-200 shadow-sm">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-secondary-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                  onKeyDown={e => e.key === 'Enter' && createFolder()}
                />
                <input
                  type="color"
                  value={newFolderColor}
                  onChange={e => setNewFolderColor(e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border border-secondary-200"
                />
                <button onClick={createFolder} className="btn btn-primary text-sm px-4 py-2">Create</button>
                <button onClick={() => setShowNewFolder(false)} className="text-sm text-secondary-500 hover:text-secondary-700">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex gap-6">
            {/* Folder sidebar */}
            {folders.length > 0 && (
              <div className="w-56 flex-shrink-0">
                <div className="bg-white rounded-xl border border-secondary-200 p-3">
                  <button
                    onClick={() => setActiveFolder(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!activeFolder ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50'}`}
                  >
                    All Favorites
                  </button>
                  {folders.map(folder => (
                    <div key={folder.id} className="flex items-center group">
                      <button
                        onClick={() => setActiveFolder(folder.id)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeFolder === folder.id ? 'bg-primary-50 text-primary-700' : 'text-secondary-700 hover:bg-secondary-50'}`}
                      >
                        <Palette className="h-3 w-3" style={{ color: folder.color || '#6b7280' }} />
                        {folder.name}
                      </button>
                      <button
                        onClick={() => deleteFolder(folder.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-secondary-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1">
              {filteredFavorites.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-secondary-200">
                  <Heart className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                  <p className="text-secondary-500 text-lg font-medium mb-2">No favorites yet</p>
                  <p className="text-secondary-400 text-sm mb-6">Browse tools and click the heart icon to save them here.</p>
                  <Link href="/tools" className="btn btn-primary text-sm px-5 py-2">
                    Browse Tools
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFavorites.map(fav => (
                    <div key={fav.id} className="bg-white rounded-xl border border-secondary-200 p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={fav.item_type === 'tool' ? `/tools/${fav.slug}` : fav.item_type === 'category' ? `/categories/${fav.slug}` : '#'}
                            className="text-sm font-semibold text-secondary-900 hover:text-primary-600 transition-colors line-clamp-1"
                          >
                            {fav.name || 'Unknown'}
                          </Link>
                          <span className="text-xs text-secondary-400 capitalize">{fav.item_type}</span>
                        </div>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-secondary-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {fav.description && (
                        <p className="text-xs text-secondary-500 line-clamp-2">{fav.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
