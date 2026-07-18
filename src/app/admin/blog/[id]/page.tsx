"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Send, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import BlogTagSelector, { type SelectedTag } from "@/components/admin/BlogTagSelector";
import { useBlogDraftAutosave } from "@/hooks/useBlogDraftAutosave";

interface BlogCategory {
  id: string;
  name: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  excerpt: string | null;
  content: string;
  categoryId: string | null;
  published: boolean;
  blogPostTags?: Array<{ tag: { id: string; name: string } }>;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<SelectedTag[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<{ post: BlogPost; tags: SelectedTag[] } | null>(null);

  const [seo, setSeo] = useState({
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImage: "",
    seoCanonical: "",
  });
  const [seoNoIndex, setSeoNoIndex] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchData();
    }
  }, [postId]);

  const fetchData = async () => {
    try {
      const [postRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/blog/${postId}`),
        fetch("/api/admin/blog-categories"),
      ]);

      const postData = await postRes.json();
      const categoriesData = await categoriesRes.json();
      const loadedTags = (postData.post?.blogPostTags || []).map((link: { tag: { id: string; name: string } }) => link.tag);

      setPost(postData.post);
      setCategories(categoriesData.categories || []);
      setTags(loadedTags);
      if (postData.post) {
        setInitialSnapshot({ post: postData.post, tags: loadedTags });
        // Populate the SEO form from what's actually saved — without
        // this, editing a post that already has SEO values set would
        // show a blank form and silently overwrite them with empty
        // strings the next time Save was clicked.
        setSeo({
          seoTitle: postData.post.seoTitle || "",
          seoDescription: postData.post.seoDescription || "",
          seoKeywords: "",
          seoOgImage: postData.post.seoOgImage || "",
          seoCanonical: postData.post.seoCanonicalUrl || "",
        });
        setSeoNoIndex(Boolean(postData.post.seoNoIndex));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const { status: autosaveStatus } = useBlogDraftAutosave({
    data: { post, tags },
    initialData: initialSnapshot ? { post: initialSnapshot.post, tags: initialSnapshot.tags } : undefined,
    enabled: Boolean(post),
    intervalMs: 3000,
    onSave: async ({ post: draftPost, tags: draftTags }) => {
      if (!draftPost) return;

      // Autosave only persists content — it re-sends published/status
      // exactly as currently set rather than overriding them, so it can
      // never silently publish, unpublish, or archive a post on its own.
      // Explicit publish/unpublish stays a deliberate action via the
      // Save Draft / Publish buttons below.
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftPost, tagIds: draftTags.map((t) => t.id) }),
      });

      if (!res.ok) throw new Error("Autosave failed");
    },
  });

  const updateField = (field: keyof BlogPost, value: unknown) => {
    if (!post) return;
    setPost({ ...post, [field]: value });
  };

  const validate = (): string | null => {
    if (!post) return "Post not loaded.";
    if (!post.title) return "Title is required.";
    if (!post.slug) return "Slug is required.";
    if (!SLUG_PATTERN.test(post.slug)) return "Slug must contain only lowercase letters, numbers, and hyphens.";
    if (!post.content) return "Content is required.";
    if (!post.categoryId) return "Please select a category.";
    return null;
  };

  const handleSave = async (publish: boolean) => {
    if (!post) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(publish ? "publish" : "draft");
    setError("");

    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          published: publish,
          tagIds: tags.map((t) => t.id),
          seoTitle: seo.seoTitle || undefined,
          seoDescription: seo.seoDescription || undefined,
          seoOgImage: seo.seoOgImage || undefined,
          seoCanonicalUrl: seo.seoCanonical || undefined,
          seoNoIndex,
        }),
      });

      if (res.ok) {
        router.push("/admin/blog");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save blog post.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!post) {
    return <div>Blog post not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to blog
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Edit Blog Post</h1>
            <p className="text-xs text-secondary-400 mt-1 flex items-center gap-1.5 h-4" aria-live="polite">
              {autosaveStatus === "saving" && (
                <>
                  <Upload className="h-3.5 w-3.5 animate-pulse" />
                  Saving draft…
                </>
              )}
              {autosaveStatus === "saved" && "Draft saved automatically"}
              {autosaveStatus === "error" && (
                <span className="text-error-500">Autosave failed — use Save Draft to save manually</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving !== null}
              className="btn btn-secondary flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving === "draft" ? "Saving..." : post.published ? "Unpublish & Save" : "Save Draft"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving !== null}
              className="btn btn-primary flex-1 sm:flex-none"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSaving === "publish" ? "Publishing..." : post.published ? "Update" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Content</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Title</label>
                <input
                  type="text"
                  value={post.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Slug</label>
                <input
                  type="text"
                  value={post.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className="input"
                />
                <p className="text-xs text-secondary-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
                <textarea
                  value={post.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Excerpt</label>
                <textarea
                  value={post.excerpt || ""}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Content (Markdown)</label>
                <textarea
                  value={post.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  className="input font-mono"
                  rows={16}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold">SEO</h2>
            <p className="text-xs text-secondary-400 mb-4">
              SEO Title, Description, Social Image, and Canonical URL are saved with the post (Task 48).
              Keywords is still preview-only — there's no keywords column yet.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={seoNoIndex}
                  onChange={(e) => setSeoNoIndex(e.target.checked)}
                  className="rounded border-secondary-300"
                />
                <span className="text-sm text-secondary-700">Hide from search engines (noindex)</span>
              </label>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-secondary-700">SEO Title</label>
                  <span className="text-xs text-secondary-400">{seo.seoTitle.length}/70</span>
                </div>
                <input
                  type="text"
                  value={seo.seoTitle}
                  onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
                  className="input"
                  maxLength={70}
                  placeholder="Defaults to the post title if left blank"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-secondary-700">SEO Description</label>
                  <span className="text-xs text-secondary-400">{seo.seoDescription.length}/160</span>
                </div>
                <textarea
                  value={seo.seoDescription}
                  onChange={(e) => setSeo({ ...seo, seoDescription: e.target.value })}
                  className="input"
                  rows={2}
                  maxLength={160}
                  placeholder="Defaults to the description if left blank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">SEO Keywords</label>
                <input
                  type="text"
                  value={seo.seoKeywords}
                  onChange={(e) => setSeo({ ...seo, seoKeywords: e.target.value })}
                  className="input"
                  placeholder="Comma-separated, e.g. ai tools, productivity, saas"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Social Image URL</label>
                  <input
                    type="text"
                    value={seo.seoOgImage}
                    onChange={(e) => setSeo({ ...seo, seoOgImage: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Canonical URL</label>
                  <input
                    type="text"
                    value={seo.seoCanonical}
                    onChange={(e) => setSeo({ ...seo, seoCanonical: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
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
                  value={post.categoryId || ""}
                  onChange={(e) => updateField("categoryId", e.target.value)}
                  className="input"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-secondary-400">
                {post.published
                  ? "This post is live. Use Update to save changes, or Unpublish & Save to take it down."
                  : "This post is a draft. Use Save Draft to keep editing, or Publish to make it live."}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Tags</h2>
            <BlogTagSelector selectedTags={tags} onChange={setTags} />
          </div>
        </div>
      </div>
    </div>
  );
}
