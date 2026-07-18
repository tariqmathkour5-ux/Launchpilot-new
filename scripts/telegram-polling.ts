#!/usr/bin/env node

/**
 * Telegram Polling Script
 * Runs continuously to poll for proposal responses from Telegram
 * This is an alternative to webhooks for local development
 */

import dotenv from 'dotenv';
import { telegramGateway } from '../src/lib/agents/telegram-gateway';
import { orchestrator } from '../src/lib/agents/orchestrator';
import { DataAggregatorAgent } from '../src/lib/agents/data-aggregator';

// Load environment variables
dotenv.config();

// Track active proposal handlers
const activeProposals = new Map<string, any>();

// Register handlers for each agent
function registerProposalHandlers(): void {
  // Data Aggregator handler
  const dataAggregator = new DataAggregatorAgent();
  
  // Set up the response handler on the gateway
  telegramGateway.setResponseHandler(async (proposalId, action, feedback) => {
    console.log(`[Polling] Received ${action} for proposal ${proposalId}`);
    
    // Find which agent owns this proposal
    const handler = (orchestrator as any).proposalHandlers?.get(proposalId);
    
    if (handler) {
      try {
        await handler(action, feedback);
        console.log(`[Polling] Handler executed successfully for ${proposalId}`);
      } catch (error) {
        console.error(`[Polling] Handler error for ${proposalId}:`, error);
      }
    } else {
      console.log(`[Polling] No handler for proposal ${proposalId}`);
    }
  });
}

/**
 * Main polling loop
 */
async function startPolling(): Promise<void> {
  console.log('[Polling] Starting Telegram polling for proposal responses...');
  registerProposalHandlers();

  const POLL_INTERVAL = 5000; // 5 seconds

  while (true) {
    try {
      await telegramGateway.pollForResponses();
    } catch (error) {
      console.error('[Polling] Error in polling cycle:', error);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * Graceful shutdown
 */
function setupShutdown(): void {
  process.on('SIGINT', () => {
    console.log('\n[Polling] Shutting down...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n[Polling] Shutting down...');
    process.exit(0);
  });
}

// Check for bot token
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('[Polling] Error: TELEGRAM_BOT_TOKEN not configured in .env');
  process.exit(1);
}

// Initialize and start
setupShutdown();
startPolling().catch(error => {
  console.error('[Polling] Fatal error:', error);
  process.exit(1);
});