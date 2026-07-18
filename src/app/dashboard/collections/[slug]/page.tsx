'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Library, Trash2, Globe, Lock, Loader2, ArrowLeft, Star, Pencil, Check, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface CollectionItem {
  id: string;
  tool_id: string;
  note: string | null;
  sort_order: number;
  slug: string;
  name: string;
  title: string;
  description: string;
  pricing: string;
  rating: number | null;
}

interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  created_at: string;
  items: CollectionItem[];
  isOwner: boolean;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublic, setEditPublic] = useState(false);

  useEffect(() => { if (slug) loadCollection(); }, [slug]);

  async function loadCollection() {
    try {
      const res = await fetch(`/api/personalization/collections/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data);
        setEditName(data.name);
        setEditDescription(data.description || '');
        setEditPublic(data.is_public);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    await fetch(`/api/personalization/collections/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDescription || null, is_public: editPublic }),
    });
    setEditing(false);
    loadCollection();
  }

  async function removeItem(toolId: string) {
    await fetch(`/api/personalization/collections/${slug}/items?tool_id=${toolId}`, { method: 'DELETE' });
    setCollection(prev => prev ? { ...prev, items: prev.items.filter(i => i.tool_id !== toolId) } : null);
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

  if (!collection) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-secondary-500">Collection not found</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard/collections" className="text-sm text-secondary-500 hover:text-primary-600 flex items-center gap-1 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Collections
          </Link>

          <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
            {editing ? (
              <div className="space-y-3">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 text-base font-semibold focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Description..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
                />
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    checked={editPublic}
                    onChange={e => setEditPublic(e.target.checked)}
                    className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  Public collection
                </label>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="btn btn-primary text-sm px-3 py-1.5 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="text-sm text-secondary-500 hover:text-secondary-700 flex items-center gap-1">
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-secondary-900">{collection.name}</h1>
                    {collection.is_public ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Globe className="h-3 w-3" /> Public</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full"><Lock className="h-3 w-3" /> Private</span>
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-sm text-secondary-500 mt-2">{collection.description}</p>
                  )}
                  <p className="text-xs text-secondary-400 mt-2">{collection.items.length} tools</p>
                </div>
                {collection.isOwner && (
                  <button onClick={() => setEditing(true)} className="p-2 text-secondary-400 hover:text-primary-600 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {collection.items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-secondary-200">
              <Library className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-500 font-medium">This collection is empty</p>
              <p className="text-secondary-400 text-sm mt-1">Add tools from their detail pages.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {collection.items.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-secondary-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Link href={`/tools/${item.slug}`} className="text-sm font-semibold text-secondary-900 hover:text-primary-600 transition-colors">
                        {item.name}
                      </Link>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-primary-500 fill-primary-500" />
                          <span className="text-xs font-medium text-secondary-600">{item.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-500 capitalize">{item.pricing}</span>
                    </div>
                    <p className="text-xs text-secondary-500 mt-1 line-clamp-1">{item.description}</p>
                    {item.note && <p className="text-xs text-primary-500 italic mt-1">{item.note}</p>}
                  </div>
                  {collection.isOwner && (
                    <button
                      onClick={() => removeItem(item.tool_id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-secondary-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
