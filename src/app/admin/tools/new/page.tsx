"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

export default function NewToolPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    slug: "",
    name: "",
    title: "",
    description: "",
    content: "",
    categoryId: "",
    pricing: "unknown",
    hasFreeTier: false,
    hasApi: false,
    published: true,
    websiteUrl: "",
    rating: null as number | null,
    platforms: [] as string[],
    features: [] as string[],
    pros: [] as string[],
    cons: [] as string[],
    useCases: [] as string[],
    integrations: [] as string[],
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/tools");
      }
    } catch (error) {
      console.error("Failed to create:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/tools" className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to tools
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Add New Tool</h1>
          <button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Creating..." : "Create Tool"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Tool Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              className="input"
              placeholder="e.g., ChatGPT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="input"
              placeholder="e.g., chatgpt"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              placeholder="e.g., ChatGPT - Advanced AI assistant"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Brief description for SEO and cards"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Pricing</label>
            <select value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} className="input">
              <option value="unknown">Unknown</option>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.hasFreeTier} onChange={(e) => setForm({ ...form, hasFreeTier: e.target.checked })} />
              <span className="text-sm">Has Free Tier</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.hasApi} onChange={(e) => setForm({ ...form, hasApi: e.target.checked })} />
              <span className="text-sm">Has API</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <span className="text-sm">Published</span>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 mb-2">Content (Markdown)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="input font-mono"
              rows={10}
              placeholder="Full tool description in markdown..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
