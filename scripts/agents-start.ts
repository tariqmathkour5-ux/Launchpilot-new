#!/usr/bin/env node

/**
 * Multi-Agent System Entry Point
 * Starts the orchestrator and initializes all agents
 */

import dotenv from 'dotenv';
import { orchestrator } from '../src/lib/agents/orchestrator';
import { telegramGateway } from '../src/lib/agents/telegram-gateway';

// Load environment variables
dotenv.config();

// Set up response handler for Telegram callbacks
telegramGateway.setResponseHandler(async (proposalId, action, feedback) => {
  console.log(`[AgentSystem] Received ${action} for proposal ${proposalId}`);
  
  // The orchestrator will dispatch to the appropriate agent's handler
  // Handlers are registered when proposals are created
});

/**
 * Start the orchestrator and initialize agents
 */
async function startAgentSystem(): Promise<void> {
  console.log('[AgentSystem] Starting Multi-Agent System...');
  
  try {
    // Start the orchestrator
    await orchestrator.start();
    
    // Send a startup notification
    await telegramGateway.sendToAdminChat(
      `<b>🤖 Agent System Started</b>\n\nAll 15 agents are initialized and ready.`
    );
    
    console.log('[AgentSystem] All agents started successfully');
    console.log('[AgentSystem] Press Ctrl+C to stop');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n[AgentSystem] Shutting down...');
      await orchestrator.stop();
      await telegramGateway.sendToAdminChat(
        '<b>🛑 Agent System Stopped</b>'
      );
      process.exit(0);
    });
    
  } catch (error) {
    console.error('[AgentSystem] Failed to start:', error);
    process.exit(1);
  }
}

// Start the system
startAgentSystem();