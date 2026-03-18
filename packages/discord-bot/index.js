/**
 * K-Arena Discord Bot
 * Commands: /rates /trade /portfolio /leaderboard /battle
 * Env: DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, K_ARENA_API_URL, K_ARENA_WEBHOOK_URL
 */

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js')

const TOKEN = process.env.DISCORD_BOT_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const BASE_URL = process.env.K_ARENA_API_URL ?? 'https://karena.fieldnine.io'

if (!TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN not set')
  process.exit(1)
}

// ── Slash command definitions ──────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('rates')
    .setDescription('Get current K-Arena exchange rates')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top 10 K-Arena agents by credit score')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Show active K-Arena battles')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('portfolio')
    .setDescription('Get portfolio summary for an agent')
    .addStringOption(o =>
      o.setName('agent_id').setDescription('Agent ID to look up').setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Execute a trade on K-Arena')
    .addStringOption(o => o.setName('api_key').setDescription('Your K-Arena API key').setRequired(true))
    .addStringOption(o => o.setName('from').setDescription('From currency (e.g. USD)').setRequired(true))
    .addStringOption(o => o.setName('to').setDescription('To currency (e.g. EUR)').setRequired(true))
    .addNumberOption(o => o.setName('amount').setDescription('Amount to trade').setRequired(true))
    .toJSON(),
]

// ── Register slash commands ────────────────────────────────────────────────
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN)
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
    console.log('✅ Slash commands registered')
  } catch (e) {
    console.error('Failed to register commands:', e.message)
  }
}

// ── API helpers ────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    signal: AbortSignal.timeout(8000),
    ...options,
  })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

function kausEmbed(title, color = 0x22c55e) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setFooter({ text: 'K-Arena · karena.fieldnine.io' })
    .setTimestamp()
}

// ── Command handlers ────────────────────────────────────────────────────────
async function handleRates(interaction) {
  await interaction.deferReply()
  const data = await apiFetch('/api/rates').catch(e => ({ error: e.message }))

  if (data.error) {
    return interaction.editReply(`❌ Failed to fetch rates: ${data.error}`)
  }

  const embed = kausEmbed('📊 K-Arena Exchange Rates')
  const rates = data.rates ?? {}
  const pairs = Object.entries(rates).slice(0, 8)

  if (pairs.length) {
    embed.addFields(pairs.map(([pair, rate]) => ({
      name: pair,
      value: typeof rate === 'number' ? rate.toFixed(4) : String(rate),
      inline: true,
    })))
  } else {
    embed.setDescription('No rate data available')
  }

  interaction.editReply({ embeds: [embed] })
}

async function handleLeaderboard(interaction) {
  await interaction.deferReply()
  const data = await apiFetch('/api/leaderboard?limit=10').catch(e => ({ error: e.message }))

  if (data.error) return interaction.editReply(`❌ ${data.error}`)

  const embed = kausEmbed('🏆 K-Arena Leaderboard')
  const agents = data.leaderboard ?? data.agents ?? []

  if (!agents.length) {
    embed.setDescription('No agents found')
  } else {
    const medals = ['🥇', '🥈', '🥉']
    const lines = agents.slice(0, 10).map((a, i) => {
      const medal = medals[i] ?? `\`${i + 1}\``
      return `${medal} **${a.name ?? a.agent_id ?? 'Unknown'}** — Score: ${a.score ?? a.credit_score ?? '--'} | Trades: ${a.trades ?? '--'}`
    })
    embed.setDescription(lines.join('\n'))
  }

  interaction.editReply({ embeds: [embed] })
}

async function handleBattle(interaction) {
  await interaction.deferReply()
  const data = await apiFetch('/api/battle/active').catch(e => ({ error: e.message }))

  if (data.error) return interaction.editReply(`❌ ${data.error}`)

  const embed = kausEmbed('⚔️ Active Battles', 0xf59e0b)
  const battles = data.battles ?? []

  if (!battles.length) {
    embed.setDescription('No active battles right now')
  } else {
    const lines = battles.slice(0, 5).map(b => {
      const endsAt = b.ends_at ? new Date(b.ends_at).toLocaleTimeString() : '--'
      return `⚔️ **${b.pair ?? 'KAUS/USD'}** — ${b.amount} KAUS each · ends ${endsAt}\n[Watch](${BASE_URL}/battle/${b.id})`
    })
    embed.setDescription(lines.join('\n\n'))
  }

  interaction.editReply({ embeds: [embed] })
}

async function handlePortfolio(interaction) {
  await interaction.deferReply()
  const agentId = interaction.options.getString('agent_id')
  const data = await apiFetch(`/api/portfolio?agent_id=${encodeURIComponent(agentId)}`).catch(e => ({ error: e.message }))

  if (data.error) return interaction.editReply(`❌ ${data.error}`)

  const embed = kausEmbed(`💼 Portfolio: ${data.agent_name ?? agentId}`)
  embed.addFields([
    { name: 'KAUS Balance', value: String(data.kaus_balance ?? data.balance ?? '--'), inline: true },
    { name: 'Total Trades', value: String(data.total_trades ?? '--'), inline: true },
    { name: 'Win Rate', value: data.win_rate ? `${data.win_rate}%` : '--', inline: true },
    { name: 'Credit Score', value: String(data.credit_score ?? '--'), inline: true },
    { name: 'Tier', value: data.tier ?? '--', inline: true },
  ])

  interaction.editReply({ embeds: [embed] })
}

async function handleTrade(interaction) {
  await interaction.deferReply({ ephemeral: true })
  const apiKey = interaction.options.getString('api_key')
  const from = interaction.options.getString('from').toUpperCase()
  const to = interaction.options.getString('to').toUpperCase()
  const amount = interaction.options.getNumber('amount')

  const data = await apiFetch('/api/exchange', {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: JSON.stringify({ from_currency: from, to_currency: to, amount }),
  }).catch(e => ({ error: e.message }))

  if (data.error) return interaction.editReply(`❌ Trade failed: ${data.error}`)

  const embed = kausEmbed('✅ Trade Executed', 0x22c55e)
  embed.addFields([
    { name: 'Pair', value: `${from}/${to}`, inline: true },
    { name: 'Amount', value: String(amount), inline: true },
    { name: 'Output', value: String(data.output_amount ?? data.to_amount ?? '--'), inline: true },
    { name: 'Fee (KAUS)', value: String(data.fee_kaus ?? data.fee ?? '--'), inline: true },
    { name: 'Rate', value: String(data.rate ?? '--'), inline: true },
    { name: 'TX ID', value: data.transaction_id ? `\`${data.transaction_id.slice(0, 12)}...\`` : '--', inline: true },
  ])

  interaction.editReply({ embeds: [embed] })
}

// ── Client setup ────────────────────────────────────────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once('ready', () => {
  console.log(`✅ K-Arena Bot logged in as ${client.user.tag}`)
  client.user.setActivity('K-Arena battles', { type: 3 /* WATCHING */ })
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  try {
    switch (interaction.commandName) {
      case 'rates':       return handleRates(interaction)
      case 'leaderboard': return handleLeaderboard(interaction)
      case 'battle':      return handleBattle(interaction)
      case 'portfolio':   return handlePortfolio(interaction)
      case 'trade':       return handleTrade(interaction)
    }
  } catch (e) {
    console.error('Command error:', e)
    const msg = `❌ Error: ${e.message}`
    if (interaction.deferred) interaction.editReply(msg).catch(() => {})
    else interaction.reply({ content: msg, ephemeral: true }).catch(() => {})
  }
})

// ── Webhook notification helper (exported for use by K-Arena backend) ──────
async function notifyTradeWebhook(webhookUrl, trade) {
  if (!webhookUrl) return
  const embed = {
    title: '🔔 Trade Executed on K-Arena',
    color: 0x22c55e,
    fields: [
      { name: 'Pair', value: trade.pair ?? `${trade.from}/${trade.to}`, inline: true },
      { name: 'Amount', value: String(trade.amount), inline: true },
      { name: 'Agent', value: trade.agent_name ?? trade.agent_id ?? 'Unknown', inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'K-Arena · karena.fieldnine.io' },
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  }).catch(e => console.error('Webhook error:', e.message))
}

module.exports = { notifyTradeWebhook }

// ── Start ───────────────────────────────────────────────────────────────────
if (CLIENT_ID) registerCommands()
client.login(TOKEN)
