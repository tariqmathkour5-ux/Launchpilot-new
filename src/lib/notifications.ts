import { prisma } from '@/lib/prisma';

// =====================================================
// NOTIFICATION CREATION
// Before this, the only code touching the Notification table was the
// manual admin CRUD route (src/app/api/admin/notifications/route.ts) —
// nothing in the app created a notification in response to an actual
// event. This is the one shared creation path every event-triggered
// notification (starting with blog events) goes through, so there is
// exactly one place that calls prisma.notification.create(), not one
// per feature that wants to send one.
//
// NotificationType is a local literal union, matching every other status
// enum in this codebase (ContentStatus, BlogCommentStatus, etc.) rather
// than importing the Prisma-generated enum type — no existing file in
// this codebase does the latter, and it also avoids a type that only
// resolves after `prisma generate`, which hasn't been run here.
// =====================================================

export type NotificationType = 'SYSTEM' | 'REVIEW' | 'TOOL' | 'COMPANY' | 'USER' | 'PAYMENT' | 'ALERT' | 'BLOG';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create a notification. Never throws into the caller's main operation —
 * every call site treats notification-sending as best-effort (same
 * principle as Task 34's revision snapshots: losing a notification is far
 * less costly than failing the action that triggered it), so failures
 * are logged here and swallowed, not propagated. Silently does nothing
 * if there's no recipient — a post with no author, for example.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!input.userId) return;

  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ? JSON.stringify(input.data) : null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
