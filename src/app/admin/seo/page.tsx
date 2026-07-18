"use client";

import { useEffect, useState } from "react";
import { Globe, FileText, Search, BarChart3, Edit, ExternalLink } from "lucide-react";

interface SEOMetadata {
  id: string;
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex: boolean;
  updatedAt: string;
}

export default function SEOPage() {
  const [metadata, setMetadata] = useState<SEOMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SEOMetadata>>({});

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const res = await fetch("/api/admin/seo");
      if (res.ok) {
        const data = await res.json();
        setMetadata(data);
      }
    } catch (error) {
      console.error("Failed to fetch SEO metadata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: SEOMetadata) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      keywords: item.keywords || "",
      ogImage: item.ogImage || "",
      canonicalUrl: item.canonicalUrl || "",
      noIndex: item.noIndex,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const res = await fetch(`/api/admin/seo/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setMetadata((prev) =>
          prev.map((m) => (m.id === editingId ? { ...m, ...updated } : m))
        );
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error("Failed to save SEO metadata:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const stats = {
    total: metadata.length,
    noIndex: metadata.filter((m) => m.noIndex).length,
    missingDescription: metadata.filter((m) => !m.description).length,
    missingOgImage: metadata.filter((m) => !m.ogImage).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">SEO Management</h1>
        <p className="text-secondary-500 mt-1">Manage meta tags, Open Graph, and indexing settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Globe className="h-5 w-5 text-primary-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
              <p className="text-xs text-secondary-500">Total Pages</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-100">
              <Search className="h-5 w-5 text-warning-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.noIndex}</p>
              <p className="text-xs text-secondary-500">No-Index Pages</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-error-100">
              <FileText className="h-5 w-5 text-error-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.missingDescription}</p>
              <p className="text-xs text-secondary-500">Missing Description</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-100">
              <BarChart3 className="h-5 w-5 text-accent-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.missingOgImage}</p>
              <p className="text-xs text-secondary-500">Missing OG Image</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Path
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {metadata.map((item) => (
                <tr key={item.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-secondary-600">{item.path}</span>
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary-400 hover:text-primary-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editForm.title || ""}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="input w-full"
                      />
                    ) : (
                      <span className="text-sm text-secondary-900 truncate max-w-xs block">
                        {item.title}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="input w-full"
                        rows={2}
                      />
                    ) : (
                      <span
                        className={`text-sm truncate max-w-xs block ${
                          !item.description ? "text-warning-600 italic" : "text-secondary-600"
                        }`}
                      >
                        {item.description || "No description"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingId === item.id ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.noIndex}
                          onChange={(e) => setEditForm({ ...editForm, noIndex: e.target.checked })}
                          className="rounded border-secondary-300"
                        />
                        <span className="text-sm">No Index</span>
                      </label>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.noIndex
                            ? "bg-warning-100 text-warning-700"
                            : "bg-success-100 text-success-700"
                        }`}
                      >
                        {item.noIndex ? "No Index" : "Indexable"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {editingId === item.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={handleCancel} className="btn btn-secondary btn-sm">
                          Cancel
                        </button>
                        <button onClick={handleSave} className="btn btn-primary btn-sm">
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-secondary-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
