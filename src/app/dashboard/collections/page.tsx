'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Library, Plus, Trash2, Share2, Globe, Lock, Loader2, ExternalLink } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  item_count: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPublic, setNewPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadCollections(); }, []);

  async function loadCollections() {
    try {
      const res = await fetch('/api/personalization/collections');
      if (res.ok) setCollections(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function createCollection() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/personalization/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() || null, is_public: newPublic }),
      });
      if (res.ok) {
        setNewName('');
        setNewDescription('');
        setNewPublic(false);
        setShowCreate(false);
        loadCollections();
      }
    } catch { /* ignore */ } finally {
      setCreating(false);
    }
  }

  async function deleteCollection(slug: string) {
    if (!confirm('Delete this collection? This cannot be undone.')) return;
    await fetch(`/api/personalization/collections/${slug}`, { method: 'DELETE' });
    setCollections(prev => prev.filter(c => c.slug !== slug));
  }

  async function copyShareLink(slug: string) {
    const url = `${window.location.origin}/collections/${slug}`;
    await navigator.clipboard.writeText(url);
  }

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">My Collections</h1>
                <p className="text-sm text-secondary-500">Curated tool lists you can share</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </button>
          </div>

          {showCreate && (
            <div className="mb-6 p-5 bg-white rounded-xl border border-secondary-200 shadow-sm">
              <h3 className="text-sm font-semibold text-secondary-900 mb-4">Create Collection</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Collection name"
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    checked={newPublic}
                    onChange={e => setNewPublic(e.target.checked)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  Make this collection public (shareable)
                </label>
                <div className="flex gap-3">
                  <button onClick={createCollection} disabled={creating} className="btn btn-primary text-sm px-4 py-2">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="text-sm text-secondary-500 hover:text-secondary-700">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {collections.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-secondary-200">
              <Library className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500 text-lg font-medium mb-2">No collections yet</p>
              <p className="text-secondary-400 text-sm mb-6">Create a collection to curate and share your favorite tools.</p>
              <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm px-5 py-2">
                Create Your First Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {collections.map(col => (
                <div key={col.id} className="bg-white rounded-xl border border-secondary-200 p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/collections/${col.slug}`}
                        className="text-base font-semibold text-secondary-900 hover:text-primary-600 transition-colors line-clamp-1"
                      >
                        {col.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {col.is_public ? (
                          <span className="flex items-center gap-1 text-xs text-green-600"><Globe className="h-3 w-3" /> Public</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-secondary-400"><Lock className="h-3 w-3" /> Private</span>
                        )}
                        <span className="text-xs text-secondary-400">{col.item_count} tools</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.is_public && (
                        <button onClick={() => copyShareLink(col.slug)} className="p-1.5 text-secondary-400 hover:text-primary-600 rounded transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => deleteCollection(col.slug)} className="p-1.5 text-secondary-400 hover:text-red-500 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {col.description && (
                    <p className="text-xs text-secondary-500 line-clamp-2 mb-3">{col.description}</p>
                  )}
                  <Link href={`/dashboard/collections/${col.slug}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    View collection <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
