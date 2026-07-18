'use client';

import { useState, useEffect } from 'react';
import {
  Globe, Plus, Trash2, Eye, EyeOff, Edit2, Save, X,
  BarChart3, TrendingUp, FileText, Tag, Search, RefreshCw,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

interface LandingPage {
  id: string;
  slug: string;
  title: string;
  heading: string | null;
  page_type: string;
  is_published: boolean;
  view_count: number;
  tool_count: number;
  sort_order: number;
  meta_description: string | null;
}

interface IndexSetting {
  id: string;
  url_pattern: string;
  should_index: boolean;
  priority: number;
  change_freq: string;
  notes: string | null;
}

interface SeoTag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_published: boolean;
  tool_count: number;
  view_count: number;
}

interface SeoData {
  pages: LandingPage[];
  indexSettings: IndexSetting[];
  tags: SeoTag[];
  analytics: {
    totalViews: number;
    topPages: Array<{ page_slug: string; page_type: string; views: number }>;
    pageTypeBreakdown: Array<{ page_type: string; count: number }>;
  };
}

type Tab = 'overview' | 'collections' | 'tags' | 'index';

export default function AdminSEOPages() {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // New collection form
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPage, setNewPage] = useState({ slug: '', title: '', heading: '', meta_description: '', page_type: 'collection' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/seo-pages');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(id: string, currentState: boolean, type: 'page' | 'tag') {
    setSaving(id);
    try {
      await fetch('/api/seo-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, is_published: !currentState }),
      });
      await loadData();
    } finally {
      setSaving(null);
    }
  }

  async function createPage() {
    if (!newPage.slug || !newPage.title) return;
    setSaving('new');
    try {
      await fetch('/api/seo-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPage),
      });
      setShowNewPage(false);
      setNewPage({ slug: '', title: '', heading: '', meta_description: '', page_type: 'collection' });
      await loadData();
    } finally {
      setSaving(null);
    }
  }

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'collections', label: 'Collections', icon: FileText },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'index', label: 'Index Settings', icon: Globe },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">SEO Pages</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Manage dynamic landing pages, collections, and search index settings</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {tab === 'collections' && (
            <button
              onClick={() => setShowNewPage(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Collection
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary-200 mb-6 gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-secondary-500">Failed to load data.</div>
      ) : (
        <>
          {/* Overview Tab */}
          {tab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Collections', value: data.pages.length, sub: `${data.pages.filter(p => p.is_published).length} published`, icon: FileText, color: 'text-primary-600 bg-primary-50' },
                  { label: 'Tags', value: data.tags.length, sub: `${data.tags.filter(t => t.is_published).length} active`, icon: Tag, color: 'text-accent-600 bg-accent-50' },
                  { label: 'Index Rules', value: data.indexSettings.length, sub: `${data.indexSettings.filter(s => s.should_index).length} indexed`, icon: Globe, color: 'text-green-600 bg-green-50' },
                  { label: 'Total Page Views', value: data.analytics.totalViews.toLocaleString(), sub: 'All time', icon: TrendingUp, color: 'text-orange-600 bg-orange-50' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl border border-secondary-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-secondary-500">{stat.label}</span>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                    <p className="text-xs text-secondary-400 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white rounded-xl border border-secondary-200 p-5">
                  <h3 className="font-semibold text-secondary-900 mb-4">Top Pages by Views</h3>
                  {data.analytics.topPages.length === 0 ? (
                    <p className="text-sm text-secondary-400 text-center py-6">No views tracked yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.analytics.topPages.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-secondary-400 font-medium w-4">{i + 1}</span>
                            <span className="text-secondary-700 truncate">{p.page_slug}</span>
                            <span className="text-xs text-secondary-400 bg-secondary-100 px-1.5 py-0.5 rounded flex-shrink-0">{p.page_type}</span>
                          </div>
                          <span className="text-secondary-900 font-medium flex-shrink-0 ml-2">{p.views}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Page Type Breakdown */}
                <div className="bg-white rounded-xl border border-secondary-200 p-5">
                  <h3 className="font-semibold text-secondary-900 mb-4">Collections by Type</h3>
                  {data.analytics.pageTypeBreakdown.length === 0 ? (
                    <p className="text-sm text-secondary-400 text-center py-6">No data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.analytics.pageTypeBreakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-700 capitalize">{item.page_type.replace('_', ' ')}</span>
                          <span className="font-medium text-secondary-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Collections Tab */}
          {tab === 'collections' && (
            <div>
              {/* New Page Form */}
              {showNewPage && (
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-secondary-900">New Collection</h3>
                    <button onClick={() => setShowNewPage(false)} className="text-secondary-400 hover:text-secondary-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">Slug *</label>
                      <input
                        value={newPage.slug}
                        onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))}
                        placeholder="best-ai-tools-for-..."
                        className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">Title *</label>
                      <input
                        value={newPage.title}
                        onChange={e => setNewPage(p => ({ ...p, title: e.target.value }))}
                        placeholder="Best AI Tools for..."
                        className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">Heading</label>
                      <input
                        value={newPage.heading}
                        onChange={e => setNewPage(p => ({ ...p, heading: e.target.value }))}
                        placeholder="Page heading (optional)"
                        className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary-700 mb-1">Page Type</label>
                      <select
                        value={newPage.page_type}
                        onChange={e => setNewPage(p => ({ ...p, page_type: e.target.value }))}
                        className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500"
                      >
                        <option value="collection">Collection</option>
                        <option value="use_case">Use Case</option>
                        <option value="comparison">Comparison</option>
                        <option value="featured">Featured</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-secondary-700 mb-1">Meta Description</label>
                      <input
                        value={newPage.meta_description}
                        onChange={e => setNewPage(p => ({ ...p, meta_description: e.target.value }))}
                        placeholder="SEO meta description..."
                        className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowNewPage(false)} className="px-4 py-2 text-sm text-secondary-600 hover:text-secondary-800 border border-secondary-200 rounded-lg">
                      Cancel
                    </button>
                    <button
                      onClick={createPage}
                      disabled={saving === 'new' || !newPage.slug || !newPage.title}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {saving === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Create
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary-50 border-b border-secondary-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-secondary-700">Collection</th>
                      <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden md:table-cell">Type</th>
                      <th className="text-center px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Views</th>
                      <th className="text-center px-5 py-3 font-semibold text-secondary-700">Status</th>
                      <th className="text-right px-5 py-3 font-semibold text-secondary-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {data.pages.map(page => (
                      <tr key={page.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-secondary-900">{page.title}</div>
                          <div className="text-xs text-secondary-400 font-mono">/collections/{page.slug}</div>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600 capitalize">
                            {page.page_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center hidden sm:table-cell text-secondary-600">
                          {page.view_count.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            page.is_published ? 'bg-green-100 text-green-700' : 'bg-secondary-100 text-secondary-500'
                          }`}>
                            {page.is_published ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {page.is_published ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/collections/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => togglePublished(page.id, page.is_published, 'page')}
                              disabled={saving === page.id}
                              className="p-1.5 text-secondary-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                              title={page.is_published ? 'Unpublish' : 'Publish'}
                            >
                              {saving === page.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : page.is_published ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tags Tab */}
          {tab === 'tags' && (
            <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary-50 border-b border-secondary-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-secondary-700">Tag</th>
                    <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden md:table-cell">Description</th>
                    <th className="text-center px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Views</th>
                    <th className="text-center px-5 py-3 font-semibold text-secondary-700">Status</th>
                    <th className="text-right px-5 py-3 font-semibold text-secondary-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {data.tags.map(tag => (
                    <tr key={tag.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-secondary-900">{tag.name}</div>
                        <div className="text-xs text-secondary-400 font-mono">/tags/{tag.slug}</div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-secondary-500 text-xs line-clamp-1 max-w-xs">
                        {tag.description || '—'}
                      </td>
                      <td className="px-5 py-3 text-center hidden sm:table-cell text-secondary-600">
                        {tag.view_count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          tag.is_published ? 'bg-green-100 text-green-700' : 'bg-secondary-100 text-secondary-500'
                        }`}>
                          {tag.is_published ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {tag.is_published ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/tags/${tag.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-secondary-400 hover:text-secondary-600 rounded-lg hover:bg-secondary-100 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => togglePublished(tag.id, tag.is_published, 'tag')}
                            disabled={saving === tag.id}
                            className="p-1.5 text-secondary-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            {saving === tag.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : tag.is_published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Index Settings Tab */}
          {tab === 'index' && (
            <div>
              <p className="text-sm text-secondary-500 mb-4">Configure which URL patterns are indexed by search engines and their sitemap priorities.</p>
              <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary-50 border-b border-secondary-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-secondary-700">URL Pattern</th>
                      <th className="text-center px-5 py-3 font-semibold text-secondary-700">Index</th>
                      <th className="text-center px-5 py-3 font-semibold text-secondary-700 hidden sm:table-cell">Priority</th>
                      <th className="text-center px-5 py-3 font-semibold text-secondary-700 hidden md:table-cell">Change Freq</th>
                      <th className="text-left px-5 py-3 font-semibold text-secondary-700 hidden lg:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {data.indexSettings.map(setting => (
                      <tr key={setting.id} className="hover:bg-secondary-50 transition-colors">
                        <td className="px-5 py-3 font-mono text-secondary-700">{setting.url_pattern}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            setting.should_index ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {setting.should_index ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {setting.should_index ? 'Indexed' : 'Noindex'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center hidden sm:table-cell text-secondary-600">{setting.priority}</td>
                        <td className="px-5 py-3 text-center hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-600">{setting.change_freq}</span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell text-xs text-secondary-400">{setting.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
