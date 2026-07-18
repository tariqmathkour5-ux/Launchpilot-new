'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Trash2, Loader2, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ViewedItem {
  id: string;
  item_type: string;
  item_id: string;
  viewed_at: string;
  name: string | null;
  slug: string | null;
  description: string | null;
}

export default function HistoryPage() {
  const [items, setItems] = useState<ViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try {
      const res = await fetch('/api/personalization/recently-viewed');
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function removeItem(id: string) {
    await fetch(`/api/personalization/recently-viewed?id=${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(item => item.id !== id));
  }

  async function clearAll() {
    if (!confirm('Clear all browsing history?')) return;
    await fetch('/api/personalization/recently-viewed?all=true', { method: 'DELETE' });
    setItems([]);
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function getItemLink(item: ViewedItem) {
    if (item.item_type === 'tool') return `/tools/${item.slug}`;
    if (item.item_type === 'category') return `/categories/${item.slug}`;
    return '#';
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
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Browsing History</h1>
                <p className="text-sm text-secondary-500">{items.length} recently viewed items</p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-secondary-200">
              <Clock className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500 text-lg font-medium mb-2">No browsing history</p>
              <p className="text-secondary-400 text-sm mb-6">Items you view will appear here.</p>
              <Link href="/tools" className="btn btn-primary text-sm px-5 py-2">Browse Tools</Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-secondary-200 divide-y divide-secondary-100">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-secondary-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={getItemLink(item)}
                      className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors"
                    >
                      {item.name || 'Unknown'}
                    </Link>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-secondary-400 capitalize">{item.item_type}</span>
                      <span className="text-xs text-secondary-300">{formatTime(item.viewed_at)}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-secondary-500 mt-1 line-clamp-1">{item.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-secondary-400 hover:text-red-500 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
