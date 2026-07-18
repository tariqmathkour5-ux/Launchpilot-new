/**
 * Telegram Webhook API Route
 * Receives callback queries from Telegram bot for proposal responses
 * This endpoint is NOT exposed to public - authentication via AGENT_SYSTEM_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { telegramGateway } from '@/lib/agents/telegram-gateway';
import { orchestrator } from '@/lib/agents/orchestrator';

/**
 * Verify request is from Telegram or authorized source
 */
function verifyRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.AGENT_SYSTEM_SECRET;
  
  // Allow requests with valid secret or from Telegram (no auth header for webhooks)
  if (!secret) {
    console.warn('[Telegram Webhook] No AGENT_SYSTEM_SECRET configured');
    return true; // Allow in development
  }
  
  if (authHeader === `Bearer ${secret}`) {
    return true;
  }

  return false;
}

/**
 * POST handler for Telegram webhook updates
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request
    if (!verifyRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Handle callback queries (button presses)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      const data = callbackQuery.data || '';

      // Parse callback data: prs_{proposalId}_{action}
      const match = data.match(/^prs_([^_]+)_(approve|reject|changes)$/);

      if (match) {
        const [, proposalId, action] = match;
        
        console.log(`[Telegram Webhook] Received ${action} for proposal ${proposalId}`);

        // Notify orchestrator which will dispatch to the appropriate agent's handler
        // The handler was registered when the proposal was created
        const handler = (orchestrator as any).proposalHandlers?.get(proposalId);
        
        if (handler) {
          await handler(action, callbackQuery.message?.text);
          console.log(`[Telegram Webhook] Handler executed for proposal ${proposalId}`);
        } else {
          console.log(`[Telegram Webhook] No handler registered for proposal ${proposalId}`);
        }

        // Acknowledge the callback to remove loading indicator
        if (callbackQuery.id) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
            }),
          });
        }
      }
    }

    // Handle regular messages (for text responses)
    if (body.message) {
      const message = body.message;
      console.log(`[Telegram Webhook] Received message: ${message.text}`);
      
      // Messages can be used for free-form feedback or commands
      // This can be extended to handle text-based responses
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET handler for webhook verification (Telegram webhook setup)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hubChallenge = searchParams.get('hub.challenge');
  
  if (hubChallenge) {
    return new NextResponse(hubChallenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Return status for health checks
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Telegram Webhook',
    timestamp: new Date().toISOString()
  });
}