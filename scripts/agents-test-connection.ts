#!/usr/bin env node

/**
 * Agent System Connection Test
 * Tests the Telegram bot connection and sends a test message
 */

import 'dotenv/config';
import { telegramGateway } from '../src/lib/agents/telegram-gateway';
import { orchestrator } from '../src/lib/agents/orchestrator';

async function testConnection(): Promise<void> {
  console.log('[AgentTest] Testing Multi-Agent System connection...\n');

  // Check if required environment variables are set
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_ADMIN_CHAT_ID'];
  const missing: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error('[AgentTest] ❌ Missing environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.log('\nPlease configure these in your .env file');
    console.log('Example: TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
    process.exit(1);
  }

  console.log('[AgentTest] ✓ Environment variables configured');
  console.log(`[AgentTest] Bot Token: ${process.env.TELEGRAM_BOT_TOKEN?.substring(0, 20)}...`);
  console.log(`[AgentTest] Admin Chat ID: ${process.env.TELEGRAM_ADMIN_CHAT_ID}`);

  // Test orchestrator
  console.log('[AgentTest] Testing orchestrator...');
  console.log(`[AgentTest] ✓ Orchestrator instance created`);
  const agentConfigs = require('../src/lib/agents/orchestrator').AGENT_CONFIGS;
  console.log(`[AgentTest] ✓ Agent configs loaded: ${Object.keys(agentConfigs).length} agents`);

  // Test Telegram connection by sending a test message
  console.log('\n[AgentTest] Testing Telegram connection...');
  
  // First, verify bot token with getMe API
  console.log('[AgentTest] Verifying bot token with Telegram API...');
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;
  const apiBase = 'https://api.telegram.org/bot';
  
  try {
    const getMeResponse = await fetch(`${apiBase}${botToken}/getMe`);
    const getMeResult = await getMeResponse.text();
    
    if (!getMeResponse.ok) {
      console.error(`[AgentTest] ❌ Bot token verification failed: ${getMeResponse.status}`);
      console.error(`[AgentTest] Error details: ${getMeResult}`);
      console.log('\n🔴 The TELEGRAM_BOT_TOKEN appears to be invalid or incomplete.');
      console.log('Please verify your token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz');
      process.exit(1);
    }
    
    const botInfo = JSON.parse(getMeResult);
    console.log(`[AgentTest] ✓ Bot verified: @${botInfo.result.username} (ID: ${botInfo.result.id})`);
  } catch (error) {
    console.error('[AgentTest] ❌ Failed to verify bot token:', error);
    process.exit(1);
  }
  
  try {
    const success = await telegramGateway.sendToAdminChat(
      `<b>🤖 Agent System Connection Test</b>\n\n✅ Telegram bot is working correctly!\n\n<i>Time: ${new Date().toISOString()}</i>`
    );

    if (success) {
      console.log('[AgentTest] ✓ Telegram message sent successfully');
      console.log('\n✅ All connection tests passed!');
      console.log('Your agent system is ready to use.');
    } else {
      console.error('\n🔴 Telegram message failed to send (chat not found)');
      console.log('\n📝 To fix this, you need to START a conversation with your bot:');
      console.log('1. Open Telegram and search for your bot: @' + (process.env.TELEGRAM_BOT_TOKEN?.includes('AAEzBLwUT') ? 'Tariq_403123_bot' : 'your-bot-username'));
      console.log('2. Send /start or any message to the bot');
      console.log('3. Run npm run agents:get-chatid to get your correct chat ID');
      console.log('4. Update TELEGRAM_ADMIN_CHAT_ID in your .env file');
      console.log('\n💡 Or if using a group:');
      console.log('- Add the bot to your group as admin');
      console.log('- Send a message in the group');
      console.log('- Get the group chat ID from the getUpdates API');
      process.exit(1);
    }
  } catch (error) {
    console.error('[AgentTest] ❌ Telegram connection error:', error);
    process.exit(1);
  }
}

// Run tests
testConnection();