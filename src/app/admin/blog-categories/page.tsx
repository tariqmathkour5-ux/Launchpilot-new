"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Edit, Trash2, FolderTree, X, Save, AlertTriangle } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  _count?: { posts: number };
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  order: 0,
};

export default function AdminBlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/blog-categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch blog categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.slug.toLowerCase().includes(query) ||
        (c.description ?? "").toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const openCreateDialog = () => {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEditDialog = (category: BlogCategory) => {
    setFormMode("edit");
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      icon: category.icon ?? "",
      order: category.order,
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeFormDialog = () => {
    if (isSaving) return;
    setFormOpen(false);
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug:
        formMode === "create"
          ? name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
          : prev.slug,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setFormError("Name and slug are required.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      const url =
        formMode === "create"
          ? "/api/admin/blog-categories"
          : `/api/admin/blog-categories/${editingId}`;
      const method = formMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setFormOpen(false);
        fetchCategories();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to save category.");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (category: BlogCategory) => {
    setDeleteTarget(category);
    setDeleteError("");
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  useEscapeKey(Boolean(deleteTarget), closeDeleteDialog);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/blog-categories/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        setDeleteError(
          data.error === "Category is in use and cannot be deleted"
            ? `This category is used by ${data.postCount} blog post${data.postCount === 1 ? "" : "s"}. Reassign or remove those posts before deleting it.`
            : data.error || "Failed to delete category."
        );
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Blog Categories</h1>
          <p className="text-secondary-500 mt-1">Organize blog posts into categories</p>
        </div>
        <button onClick={openCreateDialog} className="btn btn-primary w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      <DataTable<BlogCategory>
        data={filteredCategories}
        loading={isLoading}
        searchPlaceholder="Search blog categories..."
        onSearch={setSearchQuery}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (category) => (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FolderTree className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-secondary-900">{category.name}</p>
                  {category.description && (
                    <p className="text-xs text-secondary-500 line-clamp-1">{category.description}</p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "slug",
            header: "Slug",
            render: (category) => <span className="text-secondary-500">{category.slug}</span>,
          },
          {
            key: "posts",
            header: "Posts",
            render: (category) => (
              <span className="badge badge-secondary">{category._count?.posts ?? 0}</span>
            ),
          },
          {
            key: "order",
            header: "Order",
          },
        ]}
        actions={(category) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => openEditDialog(category)}
              className="p-2 rounded-lg hover:bg-primary-100 text-primary-600"
              aria-label={`Edit ${category.name}`}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteDialog(category)}
              className="p-2 rounded-lg hover:bg-error-100 text-error-600"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={formMode === "create" ? "Add Category" : "Edit Category"}
            className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-secondary-900">
                {formMode === "create" ? "Add Category" : "Edit Category"}
              </h2>
              <button
                onClick={closeFormDialog}
                className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-500"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-error-50 text-error-600 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Name <span className="text-error-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="input"
                    placeholder="e.g., Product Updates"
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
                    placeholder="e.g., product-updates"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Icon</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="input"
                    placeholder="e.g., newspaper"
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
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeFormDialog}
                  disabled={isSaving}
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : formMode === "create" ? "Create Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete Category"
            className="card w-full max-w-md p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-error-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-error-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-secondary-900">Delete category</h2>
                <p className="text-sm text-secondary-500 mt-1">
                  Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-4 p-3 rounded-lg bg-error-50 text-error-600 text-sm">{deleteError}</div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 w-full sm:w-auto"
              >
                {isDeleting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
