"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Trash2, MessageSquare, AlertTriangle } from "lucide-react";
import DataTable from "@/components/admin/DataTable";
import { useEscapeKey } from "@/hooks/useEscapeKey";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Comment {
  id: string;
  content: string;
  status: CommentStatus;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
  user: { id: string; name: string | null } | null;
  post: { id: string; slug: string; title: string };
}

const STATUS_BADGE: Record<CommentStatus, string> = {
  PENDING: "badge badge-warning",
  APPROVED: "badge badge-success",
  REJECTED: "badge bg-error-50 text-error-600",
};

export default function AdminBlogCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CommentStatus>("ALL");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/blog-comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredComments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return comments.filter((comment) => {
      const authorLabel = comment.user?.name || comment.authorName || comment.authorEmail || "";
      const matchesSearch =
        !query ||
        comment.content.toLowerCase().includes(query) ||
        authorLabel.toLowerCase().includes(query) ||
        comment.post.title.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || comment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [comments, searchQuery, statusFilter]);

  const setStatus = async (comment: Comment, status: CommentStatus) => {
    if (comment.status === status) return;
    setActioningId(comment.id);

    try {
      const res = await fetch(`/api/admin/blog-comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, status } : c)));
      }
    } catch (error) {
      console.error("Failed to update comment status:", error);
    } finally {
      setActioningId(null);
    }
  };

  const openDeleteDialog = (comment: Comment) => {
    setDeleteTarget(comment);
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
      const res = await fetch(`/api/admin/blog-comments/${deleteTarget.id}`, { method: "DELETE" });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete comment.");
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary-900">Comment Moderation</h1>
        <p className="text-secondary-500 mt-1">Review, approve, reject, and manage blog comments</p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-secondary-700 mb-2 sm:hidden">
          Filter by status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "ALL" | CommentStatus)}
          className="input w-full sm:w-56"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <DataTable<Comment>
        data={filteredComments}
        loading={isLoading}
        searchPlaceholder="Search comments..."
        onSearch={setSearchQuery}
        columns={[
          {
            key: "content",
            header: "Comment",
            render: (comment) => (
              <div className="flex items-start gap-3 max-w-md">
                <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-secondary-900 line-clamp-2">{comment.content}</p>
                  <p className="text-xs text-secondary-400 mt-1">
                    {comment.user?.name || comment.authorName || comment.authorEmail || "Guest"}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: "post",
            header: "Post",
            render: (comment) => (
              <Link
                href={`/blog/${comment.post.slug}`}
                target="_blank"
                className="text-secondary-600 hover:text-primary-600 line-clamp-1 max-w-[200px] inline-block"
              >
                {comment.post.title}
              </Link>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (comment) => (
              <span className={STATUS_BADGE[comment.status]}>{comment.status}</span>
            ),
          },
          {
            key: "createdAt",
            header: "Date",
            render: (comment) => (
              <span className="text-secondary-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            ),
          },
        ]}
        actions={(comment) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => setStatus(comment, "APPROVED")}
              disabled={actioningId === comment.id || comment.status === "APPROVED"}
              className="p-2 rounded-lg hover:bg-success-50 text-success-600 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Approve comment"
              title="Approve"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setStatus(comment, "REJECTED")}
              disabled={actioningId === comment.id || comment.status === "REJECTED"}
              className="p-2 rounded-lg hover:bg-error-100 text-error-600 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Reject comment"
              title="Reject"
            >
              <XCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDeleteDialog(comment)}
              className="p-2 rounded-lg hover:bg-error-100 text-error-600"
              aria-label="Delete comment"
              title="Delete"
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
            aria-label="Delete Comment"
            className="card w-full max-w-md p-6"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-error-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-error-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-secondary-900">Delete comment</h2>
                <p className="text-sm text-secondary-500 mt-1 line-clamp-3">
                  Are you sure you want to delete this comment: <em>&ldquo;{deleteTarget.content}&rdquo;</em>? This cannot be undone.
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
                {isDeleting ? "Deleting..." : "Delete Comment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
