// =====================================================
// RESEND EMAIL SERVICE
// =====================================================
// Email service provider integration using Resend

interface ResendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

interface ResendResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

// Lazy load Resend SDK to avoid errors when API key is not set
interface ResendClient {
  emails: {
    send: (options: {
      from: string;
      to: string[];
      subject: string;
      html?: string;
      text?: string;
      reply_to?: string[];
      tags?: Array<{ name: string; value: string }>;
    }) => Promise<ResendResponse>;
  };
}

let resendClient: ResendClient | null = null;

function getResendClient(): ResendClient | null {
  if (!resendClient && process.env.RESEND_API_KEY) {
    try {
      // Using dynamic import for Resend
      const { Resend } = require('resend');
      resendClient = new Resend(process.env.RESEND_API_KEY);
    } catch (error) {
      console.warn('Resend SDK not installed. Run: npm install resend');
      return null;
    }
  }
  return resendClient;
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export function getResendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || 'LaunchPilot <onboarding@resend.dev>';
}

export async function sendEmail(options: ResendEmailOptions): Promise<ResendResponse | null> {
  const resend = getResendClient();
  
  if (!resend) {
    console.warn('[DEV] Resend not configured. Email would be sent to:', options.to);
    console.log('[DEV] Email subject:', options.subject);
    console.log('[DEV] Email content (text):', options.text?.substring(0, 200));
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: options.from || getResendFromAddress(),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo ? (Array.isArray(options.replyTo) ? options.replyTo : [options.replyTo]) : undefined,
      tags: options.tags,
    });

    return result;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    throw error;
  }
}