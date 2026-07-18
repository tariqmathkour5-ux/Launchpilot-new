import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyNewComment } from '@/lib/blog-notifications';

// =====================================================
// VALIDATION
// =====================================================

// `honeypot` is a hidden form field real visitors never see or fill in;
// spam bots that blindly fill every input often do. Not a visible/required
// field — see "prevent spam patterns" below.
export const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z
    .string()
    .min(3, 'Comment is too short')
    .max(3000, 'Comment must be 3000 characters or fewer'),
  authorName: z.string().min(1).max(100).optional(),
  authorEmail: z.string().email('Must be a valid email').optional(),
  honeypot: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export type UpdateCommentStatusInput = z.infer<typeof updateCommentStatusSchema>;

// =====================================================
// SPAM PREVENTION
// No external service — a few self-contained, well-established heuristics:
//  - honeypot field tripped -> spam
//  - too many links in the comment body -> spam (a very common spam pattern)
//  - identical content resubmitted by the same author within 60s -> treated
//    as a duplicate/bot-retry, not rejected outright but not duplicated either
// =====================================================

const MAX_LINKS = 3;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const DUPLICATE_WINDOW_MS = 60_000;

function countLinks(content: string): number {
  return (content.match(URL_PATTERN) || []).length;
}

function isLikelySpam(input: CreateCommentInput): boolean {
  const honeypotTripped = Boolean(input.honeypot && input.honeypot.trim().length > 0);
  const tooManyLinks = countLinks(input.content) > MAX_LINKS;
  return honeypotTripped || tooManyLinks;
}

// =====================================================
// REPOSITORY
// =====================================================

export interface CommentAuthorSession {
  userId: string;
  name?: string | null;
  email?: string | null;
}

export interface CreateCommentResult {
  comment: Awaited<ReturnType<typeof prisma.blogComment.create>>;
  wasAutoRejected: boolean;
  wasDuplicate: boolean;
}

/**
 * Submit a comment. Always writes something — a comment that trips the
 * spam heuristics is saved as REJECTED (visible to moderators for review,
 * not silently discarded) rather than PENDING. A genuine comment is
 * PENDING, same as the default this task's foundation (Task 26) already
 * set at the schema level — nothing here auto-approves anything, since
 * building the approval workflow itself is explicitly out of scope.
 */
export async function createComment(
  input: CreateCommentInput,
  session?: CommentAuthorSession
): Promise<CreateCommentResult> {
  const identityWhere = session?.userId
    ? { userId: session.userId }
    : { authorEmail: input.authorEmail ?? null, authorName: input.authorName ?? null };

  const recentDuplicate = await prisma.blogComment.findFirst({
    where: {
      postId: input.postId,
      content: input.content,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      ...identityWhere,
    },
  });

  if (recentDuplicate) {
    return { comment: recentDuplicate, wasAutoRejected: false, wasDuplicate: true };
  }

  const autoRejected = isLikelySpam(input);

  const comment = await prisma.blogComment.create({
    data: {
      postId: input.postId,
      content: input.content,
      userId: session?.userId,
      authorName: session?.userId ? session.name ?? null : input.authorName ?? null,
      authorEmail: session?.userId ? session.email ?? null : input.authorEmail ?? null,
      status: autoRejected ? 'REJECTED' : 'PENDING',
    },
  });

  // Notify the post's author — but only for a genuine, non-spam comment.
  // A notification about a comment that was immediately auto-rejected as
  // spam isn't a useful signal, so this is skipped for that case.
  if (!autoRejected) {
    const post = await prisma.blogPost.findUnique({
      where: { id: input.postId },
      select: { id: true, slug: true, title: true, authorId: true },
    });

    if (post) {
      const commentAuthorLabel = session?.name || input.authorName || input.authorEmail || 'Someone';
      await notifyNewComment(post, post.authorId, commentAuthorLabel);
    }
  }

  return { comment, wasAutoRejected: autoRejected, wasDuplicate: false };
}

/**
 * Comments for a post. Public callers only ever see APPROVED comments
 * (`includeAllStatuses` defaults to false) — PENDING/REJECTED comments are
 * invisible until a moderator acts on them, even though the moderation
 * workflow itself isn't built yet. Admin/moderation callers can pass
 * `includeAllStatuses: true` to see everything.
 */
export async function getCommentsByPost(postId: string, options: { includeAllStatuses?: boolean } = {}) {
  return prisma.blogComment.findMany({
    where: {
      postId,
      ...(options.includeAllStatuses ? {} : { status: 'APPROVED' }),
    },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * All comments across every post, for the admin moderation dashboard.
 * Unlike getCommentsByPost, this is inherently an admin/moderator-only
 * view — access control is enforced at the route level, not here.
 */
export async function listAllComments(options: { status?: UpdateCommentStatusInput['status'] } = {}) {
  return prisma.blogComment.findMany({
    where: options.status ? { status: options.status } : {},
    include: {
      user: { select: { id: true, name: true, image: true } },
      post: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/** Change a comment's moderation status. Admin-only at the route level. */
export async function updateCommentStatus(id: string, status: UpdateCommentStatusInput['status']) {
  const existing = await prisma.blogComment.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Comment not found');
  }

  return prisma.blogComment.update({ where: { id }, data: { status } });
}

/** Delete a comment. Admin-only at the route level. */
export async function deleteComment(id: string) {
  const existing = await prisma.blogComment.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Comment not found');
  }

  await prisma.blogComment.delete({ where: { id } });
}
