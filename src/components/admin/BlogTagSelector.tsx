"use client";

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";

export interface SelectedTag {
  id: string;
  name: string;
}

interface AvailableTag {
  id: string;
  name: string;
  slug: string;
}

interface BlogTagSelectorProps {
  selectedTags: SelectedTag[];
  onChange: (tags: SelectedTag[]) => void;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Add / remove / create tags for a blog post, backed by the BlogTag /
 * BlogPostTag relationship (Tasks 20/21). Selection is held by the parent
 * form and only persisted when the post itself is saved (the parent sends
 * `tagIds` alongside the rest of the post payload) — this component itself
 * never saves anything, it only manages the in-progress selection plus
 * creating brand-new tags on the fly (which does need to exist in the
 * database immediately, since a tag needs an id before it can be selected).
 */
export default function BlogTagSelector({ selectedTags, onChange }: BlogTagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/blog-tags")
      .then((res) => res.json())
      .then((data) => setAvailableTags(data.tags || []));
  }, []);

  const unselectedTags = availableTags.filter(
    (tag) => !selectedTags.some((selected) => selected.id === tag.id)
  );

  const addExistingTag = (tagId: string) => {
    const tag = availableTags.find((t) => t.id === tagId);
    if (!tag) return;
    onChange([...selectedTags, { id: tag.id, name: tag.name }]);
  };

  const removeTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const createAndAddTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      setError("Enter a tag name first.");
      return;
    }

    const slug = slugify(name);
    if (!SLUG_PATTERN.test(slug)) {
      setError("Tag name must contain at least one letter or number.");
      return;
    }

    // If it already matches an existing tag (by slug), just select that one
    // instead of trying to create a duplicate.
    const existing = availableTags.find((t) => t.slug === slug);
    if (existing) {
      if (!selectedTags.some((t) => t.id === existing.id)) {
        onChange([...selectedTags, { id: existing.id, name: existing.name }]);
      }
      setNewTagName("");
      setError("");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/admin/blog-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableTags((prev) => [...prev, data.tag]);
        onChange([...selectedTags, { id: data.tag.id, name: data.tag.name }]);
        setNewTagName("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create tag.");
      }
    } catch {
      setError("Something went wrong creating the tag.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span key={tag.id} className="badge badge-secondary inline-flex items-center gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="hover:text-error-600"
                aria-label={`Remove ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {unselectedTags.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && addExistingTag(e.target.value)}
          className="input mb-3"
        >
          <option value="">Add an existing tag...</option>
          {unselectedTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createAndAddTag();
            }
          }}
          className="input"
          placeholder="New tag name"
        />
        <button
          type="button"
          onClick={createAndAddTag}
          disabled={isCreating}
          className="btn btn-secondary shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          {isCreating ? "Adding..." : "Add"}
        </button>
      </div>

      {error && <p className="text-xs text-error-600 mt-2">{error}</p>}
    </div>
  );
}
