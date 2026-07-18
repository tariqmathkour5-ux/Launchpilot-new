'use client';

import { useState, useEffect } from 'react';
import { Image, Upload, Trash2, Loader2, Plus, Video, FileText, Camera, X } from 'lucide-react';

interface MediaItem {
  id: string; type: string; filename: string; original_name: string;
  url: string; mime_type: string | null; size_bytes: number | null;
  alt_text: string | null; sort_order: number; created_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  logo: Image, cover: Image, screenshot: Camera, video: Video, document: FileText,
};

const MEDIA_TYPES = ['logo', 'cover', 'screenshot', 'video', 'document'];

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ url: '', originalName: '', type: 'screenshot', altText: '' });
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { loadMedia(); }, [filterType]);

  async function loadMedia() {
    try {
      const url = filterType ? `/api/company/media?type=${filterType}` : '/api/company/media';
      const res = await fetch(url);
      if (res.ok) {
        const { media } = await res.json();
        setMedia(media);
      }
    } finally {
      setLoading(false);
    }
  }

  async function upload() {
    if (!uploadForm.url || !uploadForm.originalName) return;
    setUploading(true);
    try {
      await fetch('/api/company/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadForm),
      });
      setShowUpload(false);
      setUploadForm({ url: '', originalName: '', type: 'screenshot', altText: '' });
      loadMedia();
    } finally {
      setUploading(false);
    }
  }

  async function deleteMedia(mediaId: string) {
    setDeleting(mediaId);
    try {
      await fetch(`/api/company/media?mediaId=${mediaId}`, { method: 'DELETE' });
      loadMedia();
    } finally {
      setDeleting(null);
    }
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  const byType = MEDIA_TYPES.reduce((acc, type) => {
    acc[type] = media.filter(m => m.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Media Library</h1>
          <p className="text-sm text-secondary-500 mt-0.5">Manage logos, screenshots, videos, and documents</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Media
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${!filterType ? 'bg-primary-600 text-white' : 'bg-white border border-secondary-200 text-secondary-600 hover:border-primary-300'}`}>
          All ({media.length})
        </button>
        {MEDIA_TYPES.map(type => {
          const TypeIcon = TYPE_ICONS[type] || Image;
          return (
            <button key={type} onClick={() => setFilterType(type === filterType ? '' : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${filterType === type ? 'bg-primary-600 text-white' : 'bg-white border border-secondary-200 text-secondary-600 hover:border-primary-300'}`}>
              <TypeIcon className="h-3.5 w-3.5" />
              {type} ({byType[type] || 0})
            </button>
          );
        })}
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Add Media</h3>
            <button onClick={() => setShowUpload(false)}><X className="h-5 w-5 text-secondary-400" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">URL *</label>
              <input value={uploadForm.url} onChange={e => setUploadForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://..." className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">File Name *</label>
              <input value={uploadForm.originalName} onChange={e => setUploadForm(f => ({ ...f, originalName: e.target.value }))}
                placeholder="e.g. product-screenshot.png" className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Type</label>
              <select value={uploadForm.type} onChange={e => setUploadForm(f => ({ ...f, type: e.target.value }))}
                className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500">
                {MEDIA_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Alt Text</label>
              <input value={uploadForm.altText} onChange={e => setUploadForm(f => ({ ...f, altText: e.target.value }))}
                placeholder="Describe the image..." className="w-full text-sm border border-secondary-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-500" />
            </div>
          </div>
          {uploadForm.url && (uploadForm.type === 'screenshot' || uploadForm.type === 'logo' || uploadForm.type === 'cover') && (
            <div className="mb-4 p-2 bg-white border border-secondary-200 rounded-lg overflow-hidden max-h-32">
              <img src={uploadForm.url} alt="Preview" className="h-28 w-auto object-contain mx-auto" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50">Cancel</button>
            <button onClick={upload} disabled={uploading || !uploadForm.url || !uploadForm.originalName}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add to Library
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary-500" /></div>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-12 text-center">
          <Image className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500">No media files yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map(item => {
            const TypeIcon = TYPE_ICONS[item.type] || Image;
            const isImage = ['logo', 'cover', 'screenshot'].includes(item.type);
            return (
              <div key={item.id} className="group bg-white rounded-xl border border-secondary-200 overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all">
                <div className="aspect-video bg-secondary-50 relative flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img src={item.url} alt={item.alt_text || item.original_name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <TypeIcon className="h-10 w-10 text-secondary-300" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => deleteMedia(item.id)}
                      disabled={deleting === item.id}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-secondary-700 truncate">{item.original_name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-secondary-400 capitalize">{item.type}</span>
                    <span className="text-xs text-secondary-400">{formatSize(item.size_bytes)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
