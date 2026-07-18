"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, FileText, AlertTriangle, CheckSquare, Square, X } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
  category: { id: string; name: string } | null;
}

interface BlogCategory {
  id: string;
  name: string;
}

type WorkflowStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

// Mirrors src/lib/blog-post-service.ts#getWorkflowStatus. Kept as a small,
// local, pure function rather than importing the service module directly,
// since that module pulls in the Prisma client and isn't meant for the browser bundle.
function getWorkflowStatus(post: BlogPost): WorkflowStatus {
  if (post.published) return "PUBLISHED";
  if (post.publishedAt && new Date(post.publishedAt).getTime() > Date.now()) return "SCHEDULED";
  return "DRAFT";
}

const STATUS_BADGE: Record<WorkflowStatus, string> = {
  DRAFT: "badge badge-secondary",
  SCHEDULED: "badge badge-warning",
  PUBLISHED: "badge badge-success",
};

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | WorkflowStatus>("ALL");

  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetch("/api/admin/blog-categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        (post.category?.name ?? "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || getWorkflowStatus(post) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, searchQuery, statusFilter]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(filteredPosts.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkCategoryId("");
    setBulkError("");
    setBulkDeleteConfirm(false);
  };

  const runBulkAction = async (
    action: "publish" | "archive" | "delete" | "updateCategory",
    extra?: { categoryId?: string }
  ) => {
    setIsBulkWorking(true);
    setBulkError("");

    try {
      const res = await fetch("/api/admin/blog/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: Array.from(selectedIds), ...extra }),
      });

      const result = await res.json();

      if (!res.ok) {
        setBulkError(result.error || "Bulk action failed.");
        return;
      }

      if (result.failed?.length) {
        setBulkError(`${result.failed.length} of ${selectedIds.size} post(s) could not be updated.`);
      }

      await fetchPosts();
      clearSelection();
    } catch {
      setBulkError("Something went wrong. Please try again.");
    } finally {
      setIsBulkWorking(false);
    }
  };

  const openDeleteDialog = (post: BlogPost) => {
    setDeleteTarget(post);
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
      const res = await fetch(`/api/admin/blog/${deleteTarget.id}`, { method: "DELETE" });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete post.");
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
          <h1 className="text-2xl font-bold text-secondary-900">Blog</h1>
          <p className="text-secondary-500 mt-1">Manage blog posts</p>
        </div>
        <Link href="/admin/blog/new" className="btn btn-primary w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Link>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | WorkflowStatus)}
          className="input w-full sm:w-56"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {filteredPosts.length > 0 && (
          <button onClick={selectAllVisible} className="text-sm text-primary-600 hover:underline whitespace-nowrap">
            Select all {filteredPosts.length} visible
          </button>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 rounded-lg bg-primary-50 border border-primary-100 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary-700">
              {selectedIds.size} post{selectedIds.size === 1 ? "" : "s"} selected
            </span>
            <button onClick={clearSelection} className="text-secondary-500 hover:text-secondary-700" aria-label="Clear selection">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => runBulkAction("publish")}
              disabled={isBulkWorking}
              className="btn btn-primary"
            >
              Publish
            </button>
            <button
              onClick={() => runBulkAction("archive")}
              disabled={isBulkWorking}
              className="btn btn-secondary"
            >
              Archive
            </button>

            <div className="flex items-center gap-2">
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="input"
                disabled={isBulkWorking}
              >
                <option value="">Move to category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                onClick={() => bulkCategoryId && runBulkAction("updateCategory", { categoryId: bulkCategoryId })}
                disabled={isBulkWorking || !bulkCategoryId}
                className="btn btn-secondary"
              >
                Move
              </button>
            </div>

            {bulkDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-error-600">Delete {selectedIds.size} post(s)?</span>
                <button
                  onClick={() => runBulkAction("delete")}
                  disabled={isBulkWorking}
                  className="btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500"
                >
                  {isBulkWorking ? "Deleting..." : "Confirm Delete"}
                </button>
                <button onClick={() => setBulkDeleteConfirm(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={isBulkWorking}
                className="btn bg-error-600 text-white hover:bg-error-700 focus:ring-error-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>

          {bulkError && <p className="text-sm text-error-600">{bulkError}</p>}
        </div>
      )}

      <DataTable<BlogPost>
        data={filteredPosts}
        loading={isLoading}
        searchPlaceholder="Search blog posts..."
        onSearch={setSearchQuery}
        columns={[
          {
            key: "title",
            header: "Title",
            render: (post) => (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleSelected(post.id)}
                  className="shrink-0 text-secondary-400 hover:text-primary-600"
                  aria-label={selectedIds.has(post.id) ? `Deselect ${post.title}` : `Select ${post.title}`}
                >
                  {selectedIds.has(post.id) ? (
                    <CheckSquare className="h-4 w-4 text-primary-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-secondary-900">{post.title}</p>
                  <p className="text-xs text-secondary-500">{post.slug}</p>
                </div>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (post) => (
              <span className="text-secondary-500">{post.category?.name ?? "Uncategorized"}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (post) => {
              const status = getWorkflowStatus(post);
              return <span className={STATUS_BADGE[status]}>{STATUS_LABEL[status]}</span>;
            },
          },
          {
            key: "updatedAt",
            header: "Updated",
            render: (post) => (
              <span className="text-secondary-500">
                {new Date(post.updatedAt).toLocaleDateString()}
              </span>
            ),
          },
        ]}
        actions={(post) => (
          <div className="flex justify-end gap-1">
            <Link
              href={`/admin/blog/${post.id}`}
              className="p-2 rounded-lg hover:bg-primary-100 text-primary-600 inline-flex"
              aria-label={`Edit ${post.title}`}
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              onClick={() => openDeleteDialog(post)}
              className="p-2 rounded-lg hover:bg-error-100 text-error-600"
              aria-label={`Delete ${post.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary-900/50">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete Blog Post"
            className="card w-full max-w-md p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-error-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-error-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-secondary-900">Delete post</h2>
                <p className="text-sm text-secondary-500 mt-1">
                  Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
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
                {isDeleting ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
