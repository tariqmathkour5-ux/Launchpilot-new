import { z } from 'zod';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  create as createBlogPostRecord,
  update as updateBlogPostRecord,
  getById,
  deleteBlogPost as deleteBlogPostRecord,
} from '@/lib/blog-posts';
import { createRevision } from '@/lib/blog-post-revisions';
import { notifyPostPublished, notifyPostUpdated, notifyPostScheduled } from '@/lib/blog-notifications';
import { queueNewArticleCampaign } from '@/lib/blog-newsletter';
import { logApprovalAction } from '@/lib/blog-approvals';

// =====================================================
// BLOG POST SERVICE
// Business logic sits here; all persistence goes through
// the repository layer in src/lib/blog-posts.ts.
// =====================================================

// Only these fields count as "content" for revision-tracking purposes —
// touching only published/status/publishedAt/featured/tags (e.g. a plain
// publish/unpublish/archive action) does not create a revision, since
// nothing about the post's actual content changed. Keeps revision history
// meaningful instead of accumulating a duplicate snapshot every time
// someone just flips the publish switch.
const REVISION_TRACKED_FIELDS = ['title', 'slug', 'content', 'excerpt', 'description', 'categoryId'] as const;

/**
 * Create a new blog post.
 * Validates the raw input against createBlogPostSchema before
 * delegating persistence to the repository. If the input sets `status`
 * and a `role` is supplied, the status-transition permission rule is
 * enforced (see assertCanSetStatus below) — e.g. an EDITOR can't create a
 * post that's immediately PUBLISHED.
 *
 * If the post is created already published, notifies its author (Task 39
 * — "new published posts").
 */
export async function createPost(input: unknown, authorId?: string, role?: EditorRole) {
  const data: CreateBlogPostInput = createBlogPostSchema.parse(input);
  if (data.status && role) {
    assertCanSetStatus(role, data.status);
  }

  const post = await createBlogPostRecord(data, authorId);

  if (post.published) {
    await notifyPostPublished(post, post.authorId);
    try {
      await queueNewArticleCampaign(post);
    } catch (error) {
      console.error('Failed to queue newsletter campaign (publish proceeds anyway):', error);
    }
  }

  return post;
}

/**
 * Update an existing blog post's fields (title, content, category, etc).
 * Validates the raw input against updateBlogPostSchema before
 * delegating persistence to the repository. Same permission enforcement
 * as createPost when the update includes a `status` change.
 *
 * If the update touches any content field (see REVISION_TRACKED_FIELDS),
 * the post's *pre-update* state is snapshotted as a new BlogPostRevision
 * before the change is applied — this is the actual live path for the
 * editor's Save button, so this is where revision history is created for
 * normal edits (as opposed to restoreRevision in blog-post-revisions.ts,
 * which snapshots itself since it doesn't go through this function).
 * Revision-tracking is best-effort: if it fails, the failure is logged
 * but never blocks the actual save — losing a revision snapshot is far
 * less costly than losing someone's edit entirely.
 *
 * Also fires the "new published posts" and "content updates" notification
 * events (Task 39) by comparing the pre- and post-update state — both are
 * best-effort and never block the save.
 */
export async function updatePost(id: string, input: unknown, role?: EditorRole, actorId?: string) {
  const data: UpdateBlogPostInput = updateBlogPostSchema.parse(input);
  if (data.status && role) {
    assertCanSetStatus(role, data.status);
  }

  const current = await getById(id);

  const touchesContent = REVISION_TRACKED_FIELDS.some((field) => data[field] !== undefined);
  if (touchesContent && current) {
    try {
      await createRevision(
        {
          postId: current.id,
          title: current.title,
          slug: current.slug,
          content: current.content,
          excerpt: current.excerpt,
          description: current.description,
          categoryId: current.categoryId,
        },
        actorId
      );
    } catch (error) {
      console.error('Failed to save revision snapshot (update proceeds anyway):', error);
    }
  }

  const post = await updateBlogPostRecord(id, data);

  if (current && !current.published && post.published) {
    await notifyPostPublished(post, post.authorId);
    try {
      await queueNewArticleCampaign(post);
    } catch (error) {
      console.error('Failed to queue newsletter campaign (publish proceeds anyway):', error);
    }
  }

  if (current && touchesContent) {
    await notifyPostUpdated(post, current.authorId, actorId, 'A collaborator');
  }

  return post;
}

/**
 * Publish a blog post. No-op if it's already published.
 * Publishing immediately supersedes any pending schedule.
 * `role` is optional and backward compatible: when omitted, no permission
 * check runs (this function had no role gate before this task, and had no
 * external callers either — see the note in the Content Status Management
 * section below). When provided, only ADMIN may publish.
 */
export async function publishPost(id: string, role?: EditorRole) {
  if (role) assertCanSetStatus(role, 'PUBLISHED');

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  if (existing.published) {
    return existing;
  }

  return updateBlogPostRecord(id, { published: true, status: 'PUBLISHED' });
}

/**
 * Unpublish a blog post. No-op if it's already unpublished.
 * Returns the post to DRAFT status (not ARCHIVED — unpublishing is "take
 * this down but keep working on it", archivePost() below is the separate,
 * explicit "retire this" action).
 */
export async function unpublishPost(id: string) {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  if (!existing.published) {
    return existing;
  }

  return updateBlogPostRecord(id, { published: false, status: 'DRAFT' });
}

/**
 * Delete a blog post.
 */
export async function deletePost(id: string) {
  return deleteBlogPostRecord(id);
}

// =====================================================
// PUBLISHING WORKFLOW (Task 9)
//
// getWorkflowStatus() below derives a UI-facing DRAFT/SCHEDULED/PUBLISHED
// concept purely from `published`/`publishedAt` — this predates the
// persisted `status` column added by this task (Task 31) and is kept
// as-is ("preserve existing publishing logic"). It is NOT the same thing
// as BlogPost.status: `status` is the actual editorial workflow value
// (Draft/Review/Published/Archived) now stored in the database; this
// function's "SCHEDULED" has no equivalent there — a scheduled post is
// still status = DRAFT with a future publishedAt, exactly as before.
// See the "CONTENT STATUS MANAGEMENT" section further down for the new,
// persisted 4-state workflow this task adds alongside this one.
//
// There is no cron/job runner anywhere in this codebase to flip a
// scheduled post live automatically at its target time. Until one
// exists, "scheduled" posts stay published=false in the database;
// any public-facing listing that needs to treat a due schedule as
// live should query on `publishedAt <= now()` rather than relying
// on the `published` flag alone. That read-side change is outside
// this task's scope (service layer only) and isn't made here.
// =====================================================

export type BlogPostWorkflowStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';

interface WorkflowFields {
  published: boolean;
  publishedAt: Date | null;
}

/** Derive DRAFT / SCHEDULED / PUBLISHED from the existing published/publishedAt fields. */
export function getWorkflowStatus(post: WorkflowFields): BlogPostWorkflowStatus {
  if (post.published) return 'PUBLISHED';
  if (post.publishedAt && post.publishedAt.getTime() > Date.now()) return 'SCHEDULED';
  return 'DRAFT';
}

const schedulePostSchema = z.object({
  publishAt: z.coerce.date(),
});

/**
 * Schedule a draft (or already-scheduled) post to go live at a future date.
 * Keeps `published: false` and stores the target date in `publishedAt`.
 * Rejects dates in the past. Refuses to reschedule an already-published post
 * (unpublish it first if that's really the intent).
 */
export async function schedulePost(id: string, input: unknown) {
  const { publishAt } = schedulePostSchema.parse(input);

  if (publishAt.getTime() <= Date.now()) {
    throw new Error('Scheduled publish date must be in the future');
  }

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  if (existing.published) {
    throw new Error('Post is already published; unpublish it before rescheduling');
  }

  const post = await updateBlogPostRecord(id, { published: false, publishedAt: publishAt });

  await notifyPostScheduled(post, post.authorId, publishAt);

  return post;
}

/**
 * Cancel a pending schedule, returning the post to a plain draft
 * (published = false, publishedAt = null). No-op if it wasn't scheduled.
 */
export async function cancelSchedule(id: string) {
  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  if (existing.published) {
    throw new Error('Post is already published; use unpublishPost instead');
  }

  if (getWorkflowStatus(existing) !== 'SCHEDULED') {
    return existing;
  }

  return updateBlogPostRecord(id, { published: false, publishedAt: null });
}

// =====================================================
// CONTENT STATUS MANAGEMENT (Task 31)
// The persisted BlogPost.status column: Draft -> Review -> Published,
// with a separate Archived state. Coexists with the publishing workflow
// above rather than replacing it — publishPost()/unpublishPost() keep
// `published`/`publishedAt` in sync with `status` (see above), so nothing
// that already depends on those two fields breaks.
// =====================================================

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type EditorRole = 'ADMIN' | 'EDITOR';

/**
 * Permission rule for status transitions:
 *  - ADMIN can set any status.
 *  - EDITOR can move a post between DRAFT and REVIEW (the normal
 *    write-then-submit-for-review flow) but cannot publish or archive —
 *    those stay admin-only, since they're the actions that actually
 *    change what's visible to the public.
 */
export function assertCanSetStatus(role: EditorRole, status: ContentStatus) {
  if (role === 'ADMIN') return;
  if (status === 'DRAFT' || status === 'REVIEW') return;
  throw new Error(`Only an admin can set a post's status to ${status}`);
}

/** Submit a post for review. ADMIN or EDITOR. No-op if already in review. */
export async function submitForReview(id: string, role: EditorRole, actorId?: string) {
  assertCanSetStatus(role, 'REVIEW');

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }
  if (existing.status === 'REVIEW') {
    return existing;
  }

  const post = await updateBlogPostRecord(id, { status: 'REVIEW' });
  await logApprovalAction(id, 'SUBMITTED', actorId).catch((error) =>
    console.error('Failed to log approval history (submit proceeds anyway):', error)
  );
  return post;
}

/**
 * Approve a post in review and publish it. ADMIN only (same rule as any
 * PUBLISHED transition — assertCanSetStatus). Logs an APPROVED entry to
 * the approval history with optional review notes.
 */
export async function approveContent(id: string, role: EditorRole, actorId?: string, notes?: string) {
  assertCanSetStatus(role, 'PUBLISHED');

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  const post = await updateBlogPostRecord(id, { status: 'PUBLISHED', published: true });
  await logApprovalAction(id, 'APPROVED', actorId, notes).catch((error) =>
    console.error('Failed to log approval history (approval proceeds anyway):', error)
  );
  await notifyPostPublished(post, post.authorId);
  return post;
}

/**
 * Reject a post in review, sending it back to draft. ADMIN only — same
 * tier as approving, since rejecting is the other half of the same
 * editorial decision. `notes` is where the reviewer explains what needs
 * to change; unlike approve, notes are effectively required in practice
 * (a reject with no reason isn't useful to the author), enforced by the
 * route layer, not this function, consistent with how other input shape
 * rules live at the validation boundary rather than the service.
 */
export async function rejectContent(id: string, role: EditorRole, actorId?: string, notes?: string) {
  assertCanSetStatus(role, 'PUBLISHED'); // rejecting is gated the same as the approve/publish decision it's the other half of

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  const post = await updateBlogPostRecord(id, { status: 'DRAFT', published: false });
  await logApprovalAction(id, 'REJECTED', actorId, notes).catch((error) =>
    console.error('Failed to log approval history (rejection proceeds anyway):', error)
  );
  return post;
}

/** Send a post back to draft (e.g. a reviewer requests changes). ADMIN or EDITOR. */
export async function returnToDraft(id: string, role: EditorRole) {
  assertCanSetStatus(role, 'DRAFT');

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }
  if (existing.status === 'DRAFT') {
    return existing;
  }

  return updateBlogPostRecord(id, { status: 'DRAFT', published: false });
}

/**
 * Archive a post: removes it from public view (published: false) while
 * preserving its history — publishedAt is deliberately left untouched, so
 * an archived post still records when it was originally published rather
 * than looking like it never was. ADMIN only.
 */
export async function archivePost(id: string, role: EditorRole) {
  assertCanSetStatus(role, 'ARCHIVED');

  const existing = await getById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }
  if (existing.status === 'ARCHIVED') {
    return existing;
  }

  return updateBlogPostRecord(id, { status: 'ARCHIVED', published: false });
}
