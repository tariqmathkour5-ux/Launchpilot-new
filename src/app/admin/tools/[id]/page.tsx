"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Tool {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  content: string;
  categoryId: string;
  pricing: string;
  hasFreeTier: boolean;
  hasApi: boolean;
  platforms: string[];
  features: string[];
  pros: string[];
  cons: string[];
  useCases: string[];
  integrations: string[];
  websiteUrl: string | null;
  rating: number | null;
  published: boolean;
}

export default function EditToolPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params?.id as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (toolId) {
      fetchData();
    }
  }, [toolId]);

  const fetchData = async () => {
    try {
      const [toolRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/tools/${toolId}`),
        fetch("/api/admin/categories"),
      ]);

      const toolData = await toolRes.json();
      const categoriesData = await categoriesRes.json();

      setTool(toolData.tool);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tool),
      });

      if (res.ok) {
        router.push("/admin/tools");
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof Tool, value: unknown) => {
    if (!tool) return;
    setTool({ ...tool, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!tool) {
    return <div>Tool not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/tools" className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to tools
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Edit Tool</h1>
          <button onClick={handleSubmit} disabled={isSaving} className="btn btn-primary">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={tool.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Slug</label>
                  <input
                    type="text"
                    value={tool.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    className="input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={tool.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="input"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
                  <textarea
                    value={tool.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="input"
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Content (Markdown)</label>
                  <textarea
                    value={tool.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    className="input font-mono"
                    rows={10}
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">SEO & Rating</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={tool.websiteUrl || ""}
                    onChange={(e) => updateField("websiteUrl", e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={tool.rating || ""}
                    onChange={(e) => updateField("rating", parseFloat(e.target.value) || null)}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Publishing</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Category</label>
                  <select
                    value={tool.categoryId}
                    onChange={(e) => updateField("categoryId", e.target.value)}
                    className="input"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Pricing</label>
                  <select
                    value={tool.pricing}
                    onChange={(e) => updateField("pricing", e.target.value)}
                    className="input"
                  >
                    <option value="free">Free</option>
                    <option value="freemium">Freemium</option>
                    <option value="paid">Paid</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tool.hasFreeTier}
                      onChange={(e) => updateField("hasFreeTier", e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                    <span className="text-sm text-secondary-700">Has Free Tier</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tool.hasApi}
                      onChange={(e) => updateField("hasApi", e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                    <span className="text-sm text-secondary-700">Has API</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={tool.published}
                      onChange={(e) => updateField("published", e.target.checked)}
                      className="rounded border-secondary-300"
                    />
                    <span className="text-sm text-secondary-700">Published</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Platforms (comma separated)</label>
                  <input
                    type="text"
                    value={tool.platforms.join(", ")}
                    onChange={(e) => updateField("platforms", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Features (comma separated)</label>
                  <textarea
                    value={tool.features.join(",\n")}
                    onChange={(e) => updateField("features", e.target.value.split(/[,\n]/).map((s) => s.trim()).filter(Boolean))}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
