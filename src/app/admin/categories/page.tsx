"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  _count?: { tools: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      setCategories(categories.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Categories</h1>
          <p className="text-secondary-500 mt-1">Organize tools into categories</p>
        </div>
        <Link href="/admin/categories/new" className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <FolderTree className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{category.name}</h3>
                    <p className="text-sm text-secondary-500">{category.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="p-2 rounded-lg hover:bg-primary-100 text-primary-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 rounded-lg hover:bg-error-100 text-error-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-secondary-600 mt-4">{category.description}</p>
              )}
              <p className="text-sm text-secondary-400 mt-4">
                {category._count?.tools || 0} tools
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
