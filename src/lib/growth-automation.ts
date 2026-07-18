/**
 * Growth Automation - Notification System
 * Sends log events to console and optionally to webhooks
 */

// Webhook configuration (optional - add to .env for production)
const WEBHOOK_URL = process.env.GROWTH_WEBHOOK_URL;
const ENABLE_WEBHOOKS = process.env.ENABLE_GROWTH_WEBHOOKS === 'true';

export interface GrowthNotification {
  id?: string;
  type: 'REVIEW_SUBMITTED' | 'REVENUE_EARNED' | 'USER_SIGNED_UP' | 'TOOL_VIEWED' | 'AFFILIATE_CLICK';
  title: string;
  message: string;
  userId?: string;
  resourceId?: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface ReviewNotificationData {
  toolId: string;
  toolName: string;
  toolSlug: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  rating: number;
  title?: string;
  content: string;
}

export interface RevenueNotificationData {
  toolId: string;
  toolName: string;
  amount: number;
  currency: string;
  transactionType: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send notification to console and optionally to webhook
 */
export async function sendGrowthNotification(notification: GrowthNotification): Promise<void> {
  const timestamp = notification.timestamp || new Date();
  const isoString = timestamp.toISOString();

  // Console log with styling
  const priorityEmoji = {
    low: '🔵',
    medium: '🟡',
    high: '🔴',
  };

  const typeLabel = notification.type.replace(/_/g, ' ');
  
  console.log(
    `[GrowthAutomation] ${priorityEmoji[notification.priority]} [${notification.priority.toUpperCase()}] ${typeLabel}`,
    {
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      resourceId: notification.resourceId,
      timestamp: isoString,
      ...(notification.metadata ? { metadata: notification.metadata } : {}),
    }
  );

  // Send to webhook if configured
  if (ENABLE_WEBHOOKS && WEBHOOK_URL) {
    try {
      await sendWebhookNotification({
        ...notification,
        timestamp,
      });
    } catch (error) {
      console.error('[GrowthAutomation] Failed to send webhook:', error);
    }
  }
}

/**
 * Send notification to webhook endpoint
 */
async function sendWebhookNotification(notification: GrowthNotification): Promise<void> {
  if (!WEBHOOK_URL) return;

  const payload = {
    event: notification.type.toLowerCase(),
    data: {
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      resourceId: notification.resourceId,
      priority: notification.priority,
      metadata: notification.metadata,
      timestamp: notification.timestamp?.toISOString(),
    },
  };

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Growth-Automation': 'true',
      ...(process.env.GROWTH_WEBHOOK_SECRET 
        ? { 'X-Webhook-Secret': process.env.GROWTH_WEBHOOK_SECRET } 
        : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook responded with ${response.status}`);
  }
}

/**
 * Notify when a new user review is submitted
 */
export async function notifyReviewSubmitted(data: ReviewNotificationData): Promise<void> {
  await sendGrowthNotification({
    type: 'REVIEW_SUBMITTED',
    title: `New Review: ${data.toolName}`,
    message: `User ${data.userName || 'Anonymous'} submitted a ${data.rating}-star review for ${data.toolName}`,
    userId: data.userId,
    resourceId: data.toolId,
    priority: data.rating >= 4 ? 'high' : data.rating >= 3 ? 'medium' : 'low',
    metadata: {
      toolId: data.toolId,
      toolName: data.toolName,
      toolSlug: data.toolSlug,
      userName: data.userName,
      userEmail: data.userEmail,
      rating: data.rating,
      title: data.title,
      contentPreview: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
    },
  });
}

/**
 * Notify when a tool earns revenue
 */
export async function notifyRevenueEarned(data: RevenueNotificationData): Promise<void> {
  await sendGrowthNotification({
    type: 'REVENUE_EARNED',
    title: `Revenue Earned: ${data.toolName}`,
    message: `${data.toolName} earned ${data.currency} ${data.amount.toFixed(2)} from ${data.transactionType.toLowerCase()}`,
    resourceId: data.toolId,
    priority: data.amount >= 100 ? 'high' : data.amount >= 50 ? 'medium' : 'low',
    metadata: {
      toolId: data.toolId,
      toolName: data.toolName,
      amount: data.amount,
      currency: data.currency,
      transactionType: data.transactionType,
      description: data.description,
      ...(data.metadata || {}),
    },
  });
}

/**
 * Log growth event to activity log
 */
export async function logGrowthEvent(
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    // Import prisma dynamically to avoid circular dependencies
    const { prisma } = await import('./prisma');
    await prisma.activityLog.create({
      data: {
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  } catch (error) {
    console.error('[GrowthAutomation] Failed to log activity:', error);
  }
}

/**
 * Get all growth notifications (for admin dashboard)
 */
export async function getGrowthNotifications(
  limit: number = 50,
  offset: number = 0
): Promise<Array<{
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  createdAt: Date;
}>> {
  try {
    const { prisma } = await import('./prisma');
    
    // Get activity logs related to growth events
    const logs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: [
            'REVIEW_CREATED',
            'REVIEW_SUBMITTED',
            'REVENUE_EARNED',
            'AFFILIATE_CLICK',
            'TOOL_VIEW',
            'DB_BACKUP',
          ],
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log: {
      id: string;
      action: string;
      resource: string;
      resourceId: string | null;
      details: string | null;
      createdAt: Date;
    }) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error('[GrowthAutomation] Failed to fetch notifications:', error);
    return [];
  }
}