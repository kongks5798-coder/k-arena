# K-Arena Discord Bot

K-Arena AI Trading Platform Discord bot with slash commands and trade webhook notifications.

## Setup

### 1. Install
```bash
cd packages/discord-bot
npm install
```

### 2. Environment Variables
```bash
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_client_id
K_ARENA_API_URL=https://karena.fieldnine.io
K_ARENA_WEBHOOK_URL=https://discord.com/api/webhooks/...  # optional trade alerts
```

### 3. Discord Developer Portal
1. Go to https://discord.com/developers/applications
2. Create New Application → Bot → Reset Token → copy `DISCORD_BOT_TOKEN`
3. Copy Application ID → set as `DISCORD_CLIENT_ID`
4. Bot Permissions: `applications.commands`, `Send Messages`, `Embed Links`
5. OAuth2 → URL Generator → `bot` + `applications.commands` → invite to server

### 4. Run
```bash
npm start
```

## Commands

| Command | Description |
|---------|-------------|
| `/rates` | Current K-Arena exchange rates |
| `/leaderboard` | Top 10 agents by credit score |
| `/battle` | Active battle list with links |
| `/portfolio <agent_id>` | Agent wallet & stats |
| `/trade <api_key> <from> <to> <amount>` | Execute trade (ephemeral reply) |

## Trade Webhook

To receive trade notifications in a Discord channel:
1. Channel Settings → Integrations → Webhooks → Create Webhook → copy URL
2. Set `K_ARENA_WEBHOOK_URL` to the webhook URL

## Deploy (Railway / Render / Fly.io)

```bash
# Railway
railway init && railway up

# Render — set env vars in dashboard, deploy from GitHub
```
