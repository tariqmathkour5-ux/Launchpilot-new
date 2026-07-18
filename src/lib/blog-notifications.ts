import { createNotification } from '@/lib/notifications';

// =====================================================
// BLOG NOTIFICATION INTEGRATION
// Four named trigger points, all funneling through the same
// createNotification() helper (src/lib/notifications.ts) — there is no
// second notification-creation path anywhere in this file.
// =====================================================

interface NotifiablePost {
  id: string;
  slug: string;
  title: string;
}

/** New published post — notifies the post's author that it's now live. */
export async function notifyPostPublished(post: NotifiablePost, recipientId: string | null): Promise<void> {
  if (!recipientId) return;

  await createNotification({
    userId: recipientId,
    type: 'BLOG',
    title: 'Post published',
    message: `"${post.title}" is now live.`,
    data: { postId: post.id, slug: post.slug, event: 'post_published' },
  });
}

/**
 * Comment activity — notifies the post's author that a new comment came
 * in. Every comment starts PENDING (Task 26/27), so this doubles as a
 * lightweight "something needs review" signal, without building a
 * separate moderation-queue notification concept for it.
 */
export async function notifyNewComment(
  post: NotifiablePost,
  recipientId: string | null,
  commentAuthorLabel: string
): Promise<void> {
  if (!recipientId) return;

  await createNotification({
    userId: recipientId,
    type: 'BLOG',
    title: 'New comment',
    message: `${commentAuthorLabel} commented on "${post.title}".`,
    data: { postId: post.id, slug: post.slug, event: 'new_comment' },
  });
}

/**
 * Scheduled publishing — notifies the post's author that it's been
 * scheduled. Note: this fires at the moment of scheduling, not "when the
 * scheduled time arrives and it goes live" — there is no cron/job runner
 * anywhere in this codebase (documented in Task 9) to actually flip a
 * scheduled post live on its own, so there is no later event to hook a
 * notification onto yet. Notifying at schedule-time is the one real event
 * that exists today.
 */
export async function notifyPostScheduled(
  post: NotifiablePost,
  recipientId: string | null,
  publishAt: Date
): Promise<void> {
  if (!recipientId) return;

  await createNotification({
    userId: recipientId,
    type: 'BLOG',
    title: 'Post scheduled',
    message: `"${post.title}" is scheduled to publish on ${publishAt.toLocaleDateString()}.`,
    data: { postId: post.id, slug: post.slug, event: 'post_scheduled', publishAt: publishAt.toISOString() },
  });
}

/**
 * Content updates — notifies the post's author when someone *else* edits
 * their post. Deliberately does not notify when authorId === actorId
 * (the common case of an author editing their own work) — a "you just
 * edited this" notification about your own edit is noise, not a useful
 * signal, so this only fires for the actually-interesting case of a
 * collaborator or admin changing someone else's post.
 */
export async function notifyPostUpdated(
  post: NotifiablePost,
  recipientId: string | null,
  actorId: string | undefined,
  actorLabel: string
): Promise<void> {
  if (!recipientId) return;
  if (actorId && actorId === recipientId) return;

  await createNotification({
    userId: recipientId,
    type: 'BLOG',
    title: 'Post updated',
    message: `${actorLabel} updated "${post.title}".`,
    data: { postId: post.id, slug: post.slug, event: 'post_updated' },
  });
}
