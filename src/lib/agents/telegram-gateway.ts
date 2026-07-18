/**
 * Telegram Gateway Module
 * Handles all Telegram Bot communication for the Multi-Agent System
 */

import { AgentId, ProposalPayload, TelegramMessage } from './types';

/**
 * Telegram configuration from environment
 */
const TELEGRAM_CONFIG = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID || '967779403123',
  API_BASE: 'https://api.telegram.org/bot',
  PARSE_MODE: 'HTML' as const,
  DISABLE_WEB_PAGE_PREVIEW: true,
};

/**
 * Callback data generator for inline keyboards
 */
export function generateCallbackData(proposalId: string, action: string): string {
  return `prs_${proposalId}_${action}`;
}

/**
 * Inline keyboard generator for proposals
 */
export function generateProposalKeyboard(proposalId: string): TelegramInlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: '✅ Approve', callback_data: generateCallbackData(proposalId, 'approve') },
        { text: '❌ Reject', callback_data: generateCallbackData(proposalId, 'reject') },
        { text: '💬 Request Changes', callback_data: generateCallbackData(proposalId, 'changes') },
      ],
    ],
  };
}

interface TelegramInlineKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data: string }>>;
}

/**
 * Response callback type for proposal handling
 */
export type ResponseCallback = (proposalId: string, action: string, feedback?: string) => Promise<void>;

/**
 * Telegram Gateway class
 */
export class TelegramGateway {
  private botToken: string;
  private chatId: string;
  private apiBase: string;
  private responseHandler: ResponseCallback | null = null;
  private lastUpdateId: number = 0;

  constructor() {
    this.botToken = TELEGRAM_CONFIG.BOT_TOKEN ?? '';
    this.chatId = String(TELEGRAM_CONFIG.CHAT_ID);
    this.apiBase = TELEGRAM_CONFIG.API_BASE;
  }

  /**
   * Set response handler for processing proposal responses
   */
  setResponseHandler(handler: ResponseCallback): void {
    this.responseHandler = handler;
  }

  /**
   * Send a proposal to Telegram for approval
   */
  async sendProposal(proposal: ProposalPayload): Promise<boolean> {
    if (!this.botToken) {
      console.warn('[TelegramGateway] No bot token configured, skipping proposal');
      return false;
    }

    const message: TelegramMessage = {
      chat_id: this.chatId,
      text: this.formatProposalMessage(proposal),
      parse_mode: TELEGRAM_CONFIG.PARSE_MODE,
      disable_web_page_preview: TELEGRAM_CONFIG.DISABLE_WEB_PAGE_PREVIEW,
      reply_markup: generateProposalKeyboard(proposal.id),
    };

    try {
      const response = await fetch(`${this.apiBase}${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${error}`);
      }

      console.log(`[TelegramGateway] Proposal sent: ${proposal.id}`);
      return true;
    } catch (error) {
      console.error('[TelegramGateway] Failed to send proposal:', error);
      throw error;
    }
  }

  /**
   * Send error alert to Telegram
   */
  async sendErrorAlert(params: {
    agentId: AgentId;
    type: string;
    message: string;
    context?: Record<string, unknown>;
  }): Promise<boolean> {
    if (!this.botToken) {
      console.warn('[TelegramGateway] No bot token configured, skipping error alert');
      return false;
    }

    const errorEmoji = '🚨';
    const text = `<b>${errorEmoji} AGENT ERROR ALERT</b>\n\n` +
      `<b>Agent:</b> ${params.agentId}\n` +
      `<b>Type:</b> ${params.type}\n` +
      `<b>Message:</b> ${params.message}\n` +
      (params.context ? `<b>Context:</b> ${JSON.stringify(params.context, null, 2)}` : '');

    try {
      const response = await fetch(`${this.apiBase}${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: TELEGRAM_CONFIG.PARSE_MODE,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[TelegramGateway] Failed to send error alert:', error);
      return false;
    }
  }

  /**
   * Send heartbeat/status update
   */
  async sendHeartbeat(agentId: AgentId, status: string): Promise<boolean> {
    if (!this.botToken) {
      return false;
    }

    const text = `<b>🤖 Agent Status</b>\n\n` +
      `<b>Agent:</b> ${agentId}\n` +
      `<b>Status:</b> ${status}\n` +
      `<b>Time:</b> ${new Date().toISOString()}`;

    try {
      const response = await fetch(`${this.apiBase}${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: TELEGRAM_CONFIG.PARSE_MODE,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[TelegramGateway] Failed to send heartbeat:', error);
      return false;
    }
  }

  /**
   * Send arbitrary text message to admin chat
   */
  async sendToAdminChat(text: string, options?: { parse_mode?: 'HTML' | 'MarkdownV2'; disable_web_page_preview?: boolean }): Promise<boolean> {
    if (!this.botToken) {
      console.warn('[TelegramGateway] No bot token configured, skipping message');
      return false;
    }

    try {
      const response = await fetch(`${this.apiBase}${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: options?.parse_mode || TELEGRAM_CONFIG.PARSE_MODE,
          disable_web_page_preview: options?.disable_web_page_preview ?? TELEGRAM_CONFIG.DISABLE_WEB_PAGE_PREVIEW,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TelegramGateway] sendMessage failed: ${response.status} - ${errorText}`);
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('[TelegramGateway] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Poll for new messages/updates (for receiving responses)
   */
  async pollForResponses(): Promise<void> {
    if (!this.botToken) {
      console.warn('[TelegramGateway] No bot token configured, skipping poll');
      return;
    }

    try {
      const response = await fetch(
        `${this.apiBase}${this.botToken}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=30`
      );

      if (!response.ok) {
        console.error('[TelegramGateway] Failed to poll for updates:', response.status);
        return;
      }

      const data = await response.json() as { ok: boolean; result: TelegramUpdate[] };
      
      if (!data.ok || !data.result) {
        return;
      }

      for (const update of data.result) {
        this.lastUpdateId = Math.max(this.lastUpdateId, update.update_id);

        // Handle callback queries (button presses)
        if (update.callback_query && this.responseHandler) {
          await this.handleCallbackQuery(update.callback_query);
        }
      }
    } catch (error) {
      console.error('[TelegramGateway] Poll error:', error);
    }
  }

  /**
   * Handle callback query from inline button press
   */
  private async handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
    const data = callbackQuery.data;
    
    // Parse callback data: prs_{proposalId}_{action}
    const match = data.match(/^prs_([^_]+)_(approve|reject|changes)$/);
    
    if (match && this.responseHandler) {
      const [, proposalId, action] = match;
      await this.responseHandler(proposalId, action, callbackQuery.message?.text);
      
      // Acknowledge the callback
      await this.answerCallbackQuery(callbackQuery.id);
    }
  }

  /**
   * Answer callback query (remove loading indicator)
   */
  private async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    try {
      await fetch(`${this.apiBase}${this.botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
        }),
      });
    } catch (error) {
      console.error('[TelegramGateway] Failed to answer callback query:', error);
    }
  }

  /**
   * Format proposal for Telegram message
   */
  private formatProposalMessage(proposal: ProposalPayload): string {
    const impactEmoji = {
      HIGH: '🔴',
      MEDIUM: '🟡',
      LOW: '🟢',
    };

    const emoji = impactEmoji[proposal.impact.category as keyof typeof impactEmoji] || '🔵';

    let text = `<b>${emoji} ${proposal.title}</b>\n\n`;
    text += `<b>Agent:</b> ${proposal.agentId}\n`;
    text += `<b>Type:</b> ${proposal.type}\n\n`;
    text += `<b>Description:</b>\n${proposal.description}\n\n`;
    text += `<b>Impact Assessment:</b>\n`;
    text += `- Risk Score: ${proposal.impact.riskScore}/100\n`;
    if (proposal.impact.estimatedValue) {
      text += `- Estimated Value: ${proposal.impact.estimatedValue}\n`;
    }
    text += `\n<b>Expires:</b> ${new Date(proposal.expiresAt).toISOString()}`;

    return text;
  }

  /**
   * Verify webhook signature (for future use)
   */
  verifyWebhookSignature(_signature: string, _body: string): boolean {
    // Implement webhook signature verification if using webhooks
    // For now, we assume requests come from trusted sources
    return true;
  }
}

// Types for Telegram updates
interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramCallbackQuery {
  id: string;
  data: string;
  message?: {
    message_id: number;
    text?: string;
  };
}

// Export singleton instance
export const telegramGateway = new TelegramGateway();