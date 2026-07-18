"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import BlogTagSelector, { type SelectedTag } from "@/components/admin/BlogTagSelector";
import { useBlogDraftAutosave } from "@/hooks/useBlogDraftAutosave";
import { saveLocalDraft, loadLocalDraft, clearLocalDraft } from "@/lib/draft-storage";

interface BlogCategory {
  id: string;
  name: string;
}

interface DraftFormShape {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  content: string;
  categoryId: string;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCAL_DRAFT_KEY = "new-post";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isSaving, setIsSaving] = useState<"draft" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [tags, setTags] = useState<SelectedTag[]>([]);

  // Set once the first successful autosave creates the real post
  // server-side — after that, autosave switches from "create" to "update".
  const [draftPostId, setDraftPostId] = useState<string | null>(null);

  const [restorableDraft, setRestorableDraft] = useState<{ form: DraftFormShape; tags: SelectedTag[]; savedAt: number } | null>(null);

  const [form, setForm] = useState<DraftFormShape>({
    slug: "",
    title: "",
    description: "",
    excerpt: "",
    content: "",
    categoryId: "",
  });

  const [seo, setSeo] = useState({
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImage: "",
    seoCanonical: "",
  });
  const [seoNoIndex, setSeoNoIndex] = useState(false);

  useEffect(() => {
    fetch("/api/admin/blog-categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []));
  }, []);

  // Only relevant before the post has ever been created server-side — once
  // draftPostId exists, the server is authoritative and there's nothing
  // meaningful to "restore" from localStorage anymore.
  useEffect(() => {
    if (draftPostId) return;
    const local = loadLocalDraft<{ form: DraftFormShape; tags: SelectedTag[] }>(LOCAL_DRAFT_KEY);
    if (local && (local.data.form.title || local.data.form.content)) {
      setRestorableDraft({ ...local.data, savedAt: local.savedAt });
    }
    // Only check once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restoreDraft = () => {
    if (!restorableDraft) return;
    setForm(restorableDraft.form);
    setTags(restorableDraft.tags);
    setSlugTouched(true);
    setRestorableDraft(null);
  };

  const discardDraft = () => {
    clearLocalDraft(LOCAL_DRAFT_KEY);
    setRestorableDraft(null);
  };

  // A post can't be created server-side until it satisfies the same
  // minimum fields the create API itself requires (title, slug, content,
  // categoryId) — autosave can't bypass that, so until all four are
  // present, the localStorage snapshot below is the only safety net.
  const canAutosaveToServer = Boolean(form.title && form.slug && form.content && form.categoryId);

  const { status: autosaveStatus } = useBlogDraftAutosave({
    data: { form, tags },
    enabled: Boolean(form.title || form.content),
    intervalMs: 3000,
    onSave: async ({ form: draftForm, tags: draftTags }) => {
      // Local snapshot first and unconditionally — this never depends on
      // network success, so it protects against a closed tab or crash
      // even while the post doesn't qualify for a server save yet.
      saveLocalDraft(LOCAL_DRAFT_KEY, { form: draftForm, tags: draftTags });

      if (!canAutosaveToServer) return;

      if (!draftPostId) {
        const res = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draftForm,
            published: false,
            status: "DRAFT",
            tagIds: draftTags.map((t) => t.id),
          }),
        });
        if (!res.ok) throw new Error("Autosave create failed");
        const data = await res.json();
        setDraftPostId(data.post.id);
        clearLocalDraft(LOCAL_DRAFT_KEY); // the server draft is now authoritative
      } else {
        const res = await fetch(`/api/admin/blog/${draftPostId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draftForm, tagIds: draftTags.map((t) => t.id) }),
        });
        if (!res.ok) throw new Error("Autosave update failed");
      }
    },
  });

  const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugTouched(true);
    setForm({ ...form, slug });
  };

  const validate = (): string | null => {
    if (!form.title) return "Title is required.";
    if (!form.slug) return "Slug is required.";
    if (!SLUG_PATTERN.test(form.slug)) return "Slug must contain only lowercase letters, numbers, and hyphens.";
    if (!form.content) return "Content is required.";
    if (!form.categoryId) return "Please select a category.";
    return null;
  };

  const handleSave = async (publish: boolean) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(publish ? "publish" : "draft");
    setError("");

    try {
      // If autosave already created this post in the background, save the
      // rest of the way through as an update instead of creating a
      // second, duplicate post.
      const url = draftPostId ? `/api/admin/blog/${draftPostId}` : "/api/admin/blog";
      const method = draftPostId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
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
        clearLocalDraft(LOCAL_DRAFT_KEY);
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

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/blog" className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to blog
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">New Blog Post</h1>
            <p className="text-xs text-secondary-400 mt-1 flex items-center gap-1.5 h-4" aria-live="polite">
              {autosaveStatus === "saving" && (
                <>
                  <Upload className="h-3.5 w-3.5 animate-pulse" />
                  Saving draft…
                </>
              )}
              {autosaveStatus === "saved" && "Draft saved automatically"}
              {autosaveStatus === "error" && (
                <span className="text-error-500">Autosave failed — your work is still saved locally</span>
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
              {isSaving === "draft" ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving !== null}
              className="btn btn-primary flex-1 sm:flex-none"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSaving === "publish" ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {restorableDraft && (
        <div className="mb-6 p-4 rounded-lg bg-primary-50 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-primary-700">
            You have an unsaved draft from {new Date(restorableDraft.savedAt).toLocaleString()}. Restore it?
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={discardDraft} className="btn btn-secondary">
              Discard
            </button>
            <button onClick={restoreDraft} className="btn btn-primary">
              Restore Draft
            </button>
          </div>
        </div>
      )}

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
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Title <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="input"
                  placeholder="e.g., How AI is changing content creation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Slug <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="input"
                  placeholder="e.g., how-ai-is-changing-content-creation"
                />
                <p className="text-xs text-secondary-400 mt-1">
                  Auto-generated from the title — lowercase, hyphens only. Edit it directly to override.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Brief description for cards and listings"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Short teaser shown in listings"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Content (Markdown) <span className="text-error-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="input font-mono"
                  rows={16}
                  placeholder="Full post content in markdown..."
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
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Category <span className="text-error-500">*</span>
                </label>
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
              <p className="text-xs text-secondary-400">
                Use <strong>Save Draft</strong> to keep working on this later, or <strong>Publish</strong> to make it live now.
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
