import { prisma } from '@/lib/prisma';

// =====================================================
// BLOG NEWSLETTER INTEGRATION
// Reuses the existing NewsletterSubscriber / NewsletterCampaign models
// exactly — no new subscriber table, no new campaign table, no email
// library. There is no SMTP/email-sending capability anywhere in this
// codebase (confirmed: no mail dependency, no send function exists) —
// PROJECT_STATUS.md itself lists "Email Notifications — Configure SMTP"
// as future work. So "subscriber delivery queue" here means exactly
// that: a queued NewsletterCampaign record with its target recipient
// count captured, ready for whatever future sending mechanism picks it
// up — not an actual dispatch, which this task cannot honestly claim to
// do without infrastructure that doesn't exist yet.
// =====================================================

interface NotifiablePost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
}

/**
 * Subscribers eligible to receive blog content — "respect user
 * preferences" in concrete form: only ACTIVE subscribers are ever
 * counted or targeted. UNSUBSCRIBED/BOUNCED subscribers are never
 * included, the same status field the existing newsletter admin already
 * relies on (src/app/api/admin/analytics/newsletter/route.ts).
 */
export async function getEligibleSubscriberCount(): Promise<number> {
  return prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } });
}

export interface NewsletterContentData {
  name: string;
  subject: string;
  content: string;
  url: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Assemble newsletter content from the post's own fields — no separate
 * "newsletter copy" is authored; the subject/summary/link are derived
 * directly from what's already on the post (title, excerpt/description,
 * slug), the same "don't duplicate content that already exists elsewhere"
 * principle Task 35/36's import/export system follows.
 */
export function buildNewsletterContentData(post: NotifiablePost): NewsletterContentData {
  const summary = post.excerpt || post.description || '';
  return {
    name: `New post: ${post.title}`,
    subject: post.title,
    content: summary,
    url: `${SITE_URL}/blog/${post.slug}`,
  };
}

/**
 * A campaign already queued for this post, if one exists — used to avoid
 * creating a second queued campaign for the same post (e.g. if a post is
 * unpublished and republished).
 */
export async function getQueuedCampaignForPost(postId: string) {
  return prisma.newsletterCampaign.findFirst({ where: { postId } });
}

/**
 * Queue a "new article" campaign for a newly-published post — creates a
 * NewsletterCampaign row (status: 'draft', matching the real column's
 * lowercase values) linked to the post via postId, with recipientCount
 * set to the current count of eligible (ACTIVE) subscribers as a
 * snapshot at queue time. This is data for a future send, not a send
 * itself. No-op (returns the existing campaign) if one is already queued
 * for this post.
 */
export async function queueNewArticleCampaign(post: NotifiablePost) {
  const existing = await getQueuedCampaignForPost(post.id);
  if (existing) {
    return existing;
  }

  const content = buildNewsletterContentData(post);
  const recipientCount = await getEligibleSubscriberCount();

  return prisma.newsletterCampaign.create({
    data: {
      name: content.name,
      subject: content.subject,
      content: `${content.content}\n\n${content.url}`,
      status: 'draft',
      recipientCount,
      postId: post.id,
    },
  });
}
