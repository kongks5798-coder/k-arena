/**
 * K-Arena Telegram Bot
 * Env: TELEGRAM_BOT_TOKEN, K_ARENA_API_URL
 *
 * Commands: /start /rates /leaderboard /battle /help
 * Webhook endpoint: POST /api/telegram/notify (called by K-Arena backend)
 */

const TelegramBot = require('node-telegram-bot-api')
const http = require('http')

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BASE = process.env.K_ARENA_API_URL ?? 'https://karena.fieldnine.io'
const WEBHOOK_PORT = parseInt(process.env.PORT ?? '3001', 10)

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set')
  process.exit(1)
}

const bot = new TelegramBot(TOKEN, { polling: true })
console.log('✅ K-Arena Telegram Bot started')

// ── Helpers ───────────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

function escape(text) {
  return String(text ?? '').replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&')
}

// ── /start ─────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const chat = msg.chat.id
  bot.sendMessage(chat, `
*K-Arena AI Trading Platform*

Commands:
/rates — Live exchange rates
/leaderboard — Top agents
/battle — Active battles
/help — This message

🔗 [karena.fieldnine.io](${BASE})
  `, { parse_mode: 'Markdown', disable_web_page_preview: true })
})

// ── /help ──────────────────────────────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, `
*K-Arena Bot Help*

/rates — Current BTC, ETH, XAU, EUR prices
/leaderboard — Top 10 agents by credit score
/battle — Active battles with watchlinks
/help — Show this message

To get trade alerts, register your agent on K-Arena and set up webhook notifications in your account settings.
  `, { parse_mode: 'Markdown' })
})

// ── /rates ─────────────────────────────────────────────────────────────────
bot.onText(/\/rates/, async (msg) => {
  const chat = msg.chat.id
  try {
    const data = await apiFetch('/api/rates')
    const rates = data.rates ?? []
    const lines = rates
      .filter(r => ['BTC', 'ETH', 'XAU', 'EUR'].includes(r.symbol))
      .map(r => `*${r.symbol}/KAUS*: ${r.price_kaus?.toLocaleString() ?? '--'} KAUS ($${r.price_usd?.toLocaleString() ?? '--'})`)
    bot.sendMessage(chat, `📊 *K-Arena Rates*\n\n${lines.join('\n')}\n\n_KAUS = $1.00 USD_`, { parse_mode: 'Markdown' })
  } catch (e) {
    bot.sendMessage(chat, `❌ Failed: ${e.message}`)
  }
})

// ── /leaderboard ──────────────────────────────────────────────────────────
bot.onText(/\/leaderboard/, async (msg) => {
  const chat = msg.chat.id
  try {
    const data = await apiFetch('/api/leaderboard?limit=10')
    const agents = data.leaderboard ?? data.agents ?? []
    const medals = ['🥇', '🥈', '🥉']
    const lines = agents.slice(0, 10).map((a, i) =>
      `${medals[i] ?? `${i + 1}.`} ${escape(a.name ?? 'Unknown')} — ${a.score ?? '--'} pts`
    )
    bot.sendMessage(chat, `🏆 *K-Arena Leaderboard*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' })
  } catch (e) {
    bot.sendMessage(chat, `❌ Failed: ${e.message}`)
  }
})

// ── /battle ────────────────────────────────────────────────────────────────
bot.onText(/\/battle/, async (msg) => {
  const chat = msg.chat.id
  try {
    const data = await apiFetch('/api/battle/active')
    const battles = data.battles ?? []
    if (!battles.length) {
      return bot.sendMessage(chat, '⚔️ No active battles right now.')
    }
    const lines = battles.slice(0, 5).map(b => {
      const ends = b.ends_at ? new Date(b.ends_at).toLocaleTimeString() : '--'
      return `⚔️ *${escape(b.pair ?? 'KAUS')}* — ${b.amount} KAUS · ends ${ends}\n[Watch](${BASE}/battle/${b.id})`
    })
    bot.sendMessage(chat, `⚔️ *Active Battles*\n\n${lines.join('\n\n')}`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    })
  } catch (e) {
    bot.sendMessage(chat, `❌ Failed: ${e.message}`)
  }
})

// ── Webhook notification server ─────────────────────────────────────────────
// K-Arena backend calls POST /notify with { chat_id, type, data }
// Types: trade_executed, tier_upgrade, battle_result, airdrop

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/notify') {
    res.writeHead(404); res.end('Not Found'); return
  }

  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    try {
      const { chat_id, type, data } = JSON.parse(body)
      if (!chat_id) { res.writeHead(400); res.end('chat_id required'); return }

      let msg = ''
      switch (type) {
        case 'trade_executed':
          msg = `✅ *Trade Executed*\n${escape(data.from)}→${escape(data.to)} · ${data.amount} ${escape(data.from)}\nFee: ${data.fee_kaus} KAUS\n[View](${BASE}/agents/${data.agent_id})`
          break
        case 'tier_upgrade':
          msg = `🎉 *Tier Upgrade!*\n${escape(data.agent_name)} is now *${escape(data.new_tier)}*!\nCredit Score: ${data.score}`
          break
        case 'battle_result':
          msg = `⚔️ *Battle Result*\n🏆 ${escape(data.winner_name)} wins ${data.prize} KAUS!\n[View](${BASE}/battle/${data.battle_id})`
          break
        case 'airdrop':
          msg = `💰 *Airdrop Received!*\n+${data.amount} KAUS sent to ${escape(data.agent_name)}\nReason: ${escape(data.reason)}`
          break
        default:
          msg = `📣 *K-Arena Alert*\n${escape(JSON.stringify(data))}`
      }

      bot.sendMessage(chat_id, msg, { parse_mode: 'Markdown', disable_web_page_preview: true })
        .then(() => { res.writeHead(200); res.end(JSON.stringify({ ok: true })) })
        .catch(e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })) })
    } catch (e) {
      res.writeHead(400); res.end(JSON.stringify({ error: 'invalid_json' }))
    }
  })
})

server.listen(WEBHOOK_PORT, () => {
  console.log(`✅ Telegram webhook server on port ${WEBHOOK_PORT}`)
  console.log(`   POST http://localhost:${WEBHOOK_PORT}/notify`)
})

// ── Error handling ─────────────────────────────────────────────────────────
bot.on('polling_error', (e) => console.error('Polling error:', e.message))
process.on('uncaughtException', (e) => console.error('Uncaught:', e))
