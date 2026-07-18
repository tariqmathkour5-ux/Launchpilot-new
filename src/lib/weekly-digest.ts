// =====================================================
// WEEKLY TOOL DIGEST NOTIFICATION SERVICE
// =====================================================
// Sends weekly email summaries of new AI tools to registered users

import { prisma } from '@/lib/prisma';
import { sendEmail, isResendConfigured } from '@/lib/email';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'LaunchPilot';

export interface NewTool {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  createdAt: Date;
}

/**
 * Get users who are eligible to receive weekly tool digest
 * - Must have an email address
 * - Must have weeklyToolDigest enabled in settings (defaults to true)
 * - Must have emailNotifications enabled (defaults to true)
 */
export async function getEligibleDigestRecipients(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      status: 'ACTIVE',
    },
    include: {
      settings: true,
    },
  });

  return users
    .filter(user => {
      const settings = (user as any).settings;
      if (!settings) return true; // Default to true if no settings
      return settings.emailNotifications !== false && settings.weeklyToolDigest !== false;
    })
    .map(user => user.email!)
    .filter((email): email is string => !!email);
}

/**
 * Get tools created in the last week
 */
export async function getNewToolsLastWeek(): Promise<NewTool[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const tools = await prisma.tool.findMany({
    where: {
      createdAt: {
        gte: oneWeekAgo,
      },
      published: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      title: true,
      description: true,
      category: {
        select: {
          name: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return tools.map(tool => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    title: tool.title,
    description: tool.description,
    category: tool.category?.name || 'AI Tools',
    createdAt: tool.createdAt,
  }));
}

/**
 * Generate HTML email content for the weekly digest
 */
export function generateDigestEmailHTML(tools: NewTool[], weekStart: Date, weekEnd: Date): string {
  const formattedDate = weekStart.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });

  const toolCards = tools.map(tool => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937;">
        <a href="${SITE_URL}/tools/${tool.slug}" style="color: #2563eb; text-decoration: none;">
          ${escapeHtml(tool.name)}
        </a>
      </h3>
      <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">
        ${escapeHtml(tool.description.substring(0, 200))}${tool.description.length > 200 ? '...' : ''}
      </p>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 12px; color: #6b7280;">
          ${escapeHtml(tool.category)}
        </span>
        <a href="${SITE_URL}/tools/${tool.slug}" style="color: #2563eb; font-size: 12px; text-decoration: none;">
          View Details →
        </a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <header style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1f2937; margin: 0;">
            🚀 ${SITE_NAME} Weekly Tool Digest
          </h1>
          <p style="color: #6b7280; margin: 8px 0 0 0;">
            New AI tools added: ${formattedDate}
          </p>
        </header>

        ${toolCards || '<p style="color: #6b7280; text-align: center;">No new tools this week. Check back next week!</p>'}

        <footer style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>You're receiving this email because you subscribed to ${SITE_NAME} updates.</p>
          <p>
            <a href="${SITE_URL}/settings" style="color: #6b7280;">Manage preferences</a>
          </p>
        </footer>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email content for the weekly digest
 */
export function generateDigestEmailText(tools: NewTool[], weekStart: Date, weekEnd: Date): string {
  const formattedDate = weekStart.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });

  const toolList = tools.map(tool => `
${tool.name}
  Category: ${tool.category}
  ${tool.description}
  View: ${SITE_URL}/tools/${tool.slug}
`).join('');

  return `🚀 ${SITE_NAME} Weekly Tool Digest - ${formattedDate}

${tools.length} new AI tools added this week:

${toolList || 'No new tools this week. Check back next week!'}

---
You're receiving this email because you subscribed to ${SITE_NAME} updates.
Manage preferences: ${SITE_URL}/settings
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Send the weekly tool digest to all eligible recipients
 */
export async function sendWeeklyToolDigest(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const isConfigured = isResendConfigured();
  
  if (!isConfigured) {
    console.warn('[DEV] Resend not configured. Would send digest to eligible recipients.');
    const recipients = await getEligibleDigestRecipients();
    console.log(`[DEV] Eligible recipients count: ${recipients.length}`);
    
    const tools = await getNewToolsLastWeek();
    console.log(`[DEV] New tools count: ${tools.length}`);
    
    return {
      success: 0,
      failed: recipients.length,
      total: recipients.length,
    };
  }

  const recipients = await getEligibleDigestRecipients();
  const tools = await getNewToolsLastWeek();

  if (recipients.length === 0) {
    console.log('No eligible recipients for weekly digest');
    return { success: 0, failed: 0, total: 0 };
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date();

  const htmlContent = generateDigestEmailHTML(tools, weekStart, weekEnd);
  const textContent = generateDigestEmailText(tools, weekStart, weekEnd);

  // Batch send emails in groups of 50 to avoid rate limits
  const batchSize = 50;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const result = await sendEmail({
      to: batch,
      subject: `🚀 ${SITE_NAME} Weekly: ${tools.length} New AI Tools Added`,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'category', value: 'weekly-digest' },
        { name: 'tool_count', value: String(tools.length) },
      ],
    });

    if (result) {
      success += batch.length;
    } else {
      failed += batch.length;
    }
  }

  // Update last digest sent timestamp for all recipients
  const userIds = await prisma.user.findMany({
    where: {
      email: { in: recipients },
    },
    select: { id: true },
  });

  // Use type assertion to work with Prisma client
  await (prisma as any).userSettings.updateMany({
    where: {
      userId: { in: userIds.map(u => u.id) },
    },
    data: {
      lastDigestSentAt: new Date(),
    },
  });

  return { success, failed, total: recipients.length };
}

/**
 * Queue the weekly digest as a newsletter campaign
 * This allows the admin to review before sending
 */
export async function queueWeeklyDigestCampaign(): Promise<{
  id: string;
  toolCount: number;
  recipientCount: number;
} | null> {
  const tools = await getNewToolsLastWeek();
  const recipientCount = await getEligibleSubscriberCount();

  if (recipientCount === 0) {
    console.log('No eligible recipients for weekly digest campaign');
    return null;
  }

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  
  // Check if campaign already exists for this week (using metadata field)
  const existingCampaign = await prisma.newsletterCampaign.findFirst({
    where: {
      metadata: {
        contains: 'weekly-digest',
      },
      createdAt: {
        gte: weekStart,
      },
    },
  });

if (existingCampaign) {
    console.log('Weekly digest campaign already exists for this week');
    const metadata = JSON.parse((existingCampaign as any).metadata || '{}');
    return {
      id: existingCampaign.id,
      toolCount: metadata.toolCount || tools.length,
      recipientCount: existingCampaign.recipientCount,
    };
  }

  const htmlContent = generateDigestEmailHTML(tools, weekStart, new Date());
  const textContent = generateDigestEmailText(tools, weekStart, new Date());

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      name: `Weekly Tool Digest - ${weekStart.toLocaleDateString('en-US')}`,
      subject: `🚀 ${SITE_NAME} Weekly: ${tools.length} New AI Tools Added`,
      content: htmlContent,
      status: 'scheduled',
      recipientCount,
      metadata: JSON.stringify({
        textContent,
        toolCount: tools.length,
        tags: ['weekly-digest'],
        scheduledFor: 'weekly',
      }),
    },
  });

  return {
    id: campaign.id,
    toolCount: tools.length,
    recipientCount,
  };
}

/**
 * Get eligible subscriber count (helper function)
 */
async function getEligibleSubscriberCount(): Promise<number> {
  return prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } });
}