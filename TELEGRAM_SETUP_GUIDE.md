# Telegram Bot Setup Guide

## How to Create a Telegram Bot

Follow these steps to create your Telegram Bot:

1. **Open Telegram** on your phone or computer
2. **Search for @BotFather** (the official bot creation bot)
3. **Start a conversation** with BotFather and send `/start`
4. **Create a new bot** by sending `/newbot`
5. **Follow BotFather's prompts**:
   - Choose a name for your bot (e.g., "LaunchPilot Agent")
   - Choose a username ending in `bot` (e.g., "LaunchPilotAgent_bot")
6. **Get your token**: BotFather will provide a token like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz-YourBotToken
   ```

## Configure Your Bot Token

Once you have your token, update the `.env` file:

```
TELEGRAM_BOT_TOKEN=your-actual-token-here
TELEGRAM_ADMIN_CHAT_ID=your-telegram-chat-id
```

## Get Your Telegram Chat ID

1. **Start a conversation** with your newly created bot
2. **Send any message** (e.g., "Hello")
3. **Visit** (replace YOUR_TOKEN with your actual token):
   ```
   https://api.telegram.org/botYOUR_TOKEN/getUpdates
   ```
4. **Find your chat ID** in the JSON response (look for `"chat":{"id":YOUR_CHAT_ID}`)
5. **Update .env** with your chat ID

## Quick Test

After updating `.env`, run:
```bash
npm run agents:test-connection
```

You should see:
```
✅ All connection tests passed!
Your agent system is ready to use.
```

## Agent System Features

The Multi-Agent System includes 15 agents:
- **AGT-ORCH**: Orchestrator (central coordination)
- **AGT-ARCH**: System Architect (system health)
- **AGT-DATA**: Data Aggregator (tool data collection)
- **AGT-MKTG**: Market Intelligence (competitive analysis)
- **AGT-EDIT**: Content Editor (content generation)
- **AGT-SEO**: SEO Optimizer (search optimization)
- **AGT-MONET**: Monetization (revenue optimization)
- **AGT-TECH**: Technical Sentinel (code quality & security)
- **AGT-CONV**: Conversion (conversion rate optimization)
- **AGT-GROWTH**: Growth (user engagement)
- **AGT-CLEAN**: Database Cleanup (data integrity)
- **AGT-SEC**: Security (security audits)
- **AGT-FEEDBACK**: Feedback Analyst (sentiment analysis)
- **AGT-STRAT**: Content Strategist (content planning)
- **AGT-LANG**: Language (internationalization)

Each agent will send approval requests via Telegram for automated actions.