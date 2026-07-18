#!/usr/bin/env node

/**
 * Telegram Chat ID Fetcher Script
 * Run this script to get your Telegram Chat ID for the bot.
 * Simply send any message to your bot after starting this script.
 */

import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = 'https://api.telegram.org/bot';

async function getChatId(): Promise<void> {
  if (!BOT_TOKEN) {
    console.error('[ChatID] Error: TELEGRAM_BOT_TOKEN not configured in .env');
    console.log('\nPlease add TELEGRAM_BOT_TOKEN to your .env file:');
    console.log('TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather');
    process.exit(1);
  }

  console.log('[ChatID] Fetching recent updates from Telegram...');
  console.log('[ChatID] Please send a message to your bot now.');
  console.log('[ChatID] Press Ctrl+C to exit when done.\n');

  try {
    const response = await fetch(`${API_BASE}${BOT_TOKEN}/getUpdates`);
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`[ChatID] API Error: ${response.status} - ${error}`);
      process.exit(1);
    }

    const data = await response.json() as { ok: boolean; result: Array<{ message?: { chat: { id: number; first_name?: string; username?: string } } }> };
    
    if (!data.ok) {
      console.error('[ChatID] Failed to fetch updates');
      process.exit(1);
    }

    if (data.result.length === 0) {
      console.log('[ChatID] No messages found. Please send a message to your bot and run again.');
    } else {
      console.log('[ChatID] Found the following chats:\n');
      
      for (const update of data.result) {
        if (update.message?.chat) {
          const chat = update.message.chat;
          console.log(`  Chat ID: ${chat.id}`);
          console.log(`  Name: ${chat.first_name || 'N/A'}`);
          console.log(`  Username: @${chat.username || 'N/A'}`);
          console.log('  ---');
        }
      }
      
      const latestChat = data.result[data.result.length - 1]?.message?.chat;
      if (latestChat) {
        console.log(`\n[ChatID] Your TELEGRAM_ADMIN_CHAT_ID should be: ${latestChat.id}`);
      }
    }
  } catch (error) {
    console.error('[ChatID] Error:', error);
    process.exit(1);
  }
}

// Run the fetcher
getChatId();