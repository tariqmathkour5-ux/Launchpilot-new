"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewCategoryPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    order: 0,
  });

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setError("Name and slug are required.");
      return;
    }
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.push("/admin/categories");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create category.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/categories"
          className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to categories
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Add New Category</h1>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Creating..." : "Create Category"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Name <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input"
                placeholder="e.g., AI Chat"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Slug <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="input"
                placeholder="e.g., ai-chat"
                required
              />
              <p className="text-xs text-secondary-400 mt-1">Used in URLs — lowercase, hyphens only</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Brief description of this category"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Icon</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="input"
                placeholder="e.g., message-square"
              />
              <p className="text-xs text-secondary-400 mt-1">Lucide icon name (optional)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="input"
                min={0}
              />
              <p className="text-xs text-secondary-400 mt-1">Lower numbers appear first</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
