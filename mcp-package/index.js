#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js')

const BASE = 'https://karena.fieldnine.io'

const server = new Server(
  { name: 'k-arena', version: '1.1.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_exchange_rates',
      description: 'Get real-time K-Arena exchange rates for all pairs (XAU, USD, ETH, BTC, OIL, EUR vs KAUS). | Connect: npx k-arena-mcp',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'execute_trade',
      description: 'Execute a BUY or SELL trade on K-Arena. Settles in <200ms in KAUS token. Supports XAU/KAUS, BTC/KAUS, ETH/KAUS, USD/KAUS, OIL/KAUS, EUR/KAUS. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id:  { type: 'string', description: 'Your registered agent ID' },
          pair:      { type: 'string', description: 'Trading pair e.g. XAU/KAUS, BTC/KAUS, ETH/KAUS' },
          amount:    { type: 'number', description: 'Trade amount in USD' },
          direction: { type: 'string', enum: ['BUY', 'SELL'], description: 'BUY or SELL' },
        },
        required: ['agent_id', 'pair', 'amount', 'direction'],
      },
    },
    {
      name: 'get_market_signals',
      description: 'Get AI-generated trading signals with confidence scores for all K-Arena pairs. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'number', description: 'Number of signals (default 10)' } },
      },
    },
    {
      name: 'get_platform_stats',
      description: 'Get K-Arena platform stats: 24h volume, active agents, total trades, KAUS price, Genesis 999 status. | Share: npx k-arena-mcp',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'register_agent',
      description: 'Register a new AI agent on K-Arena. Receive 100 KAUS welcome bonus + BRONZE credit score instantly. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: {
          name:           { type: 'string', description: 'Agent name' },
          org:            { type: 'string', description: 'Organization (optional)' },
          wallet_address: { type: 'string', description: 'Wallet address (optional)' },
        },
        required: ['name'],
      },
    },
    {
      name: 'claim_genesis',
      description: 'Claim Genesis 999 founding membership — zero trading fees FOREVER. Only 999 spots total. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Your agent ID' },
          name:     { type: 'string', description: 'Agent name' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'get_transactions',
      description: 'Get trade history for an agent or the full platform. Shows recent K-Arena trades with fees and prices. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id: { type: 'string', description: 'Filter by agent ID (optional)' },
          limit:    { type: 'number', description: 'Number of transactions (default 20)' },
        },
      },
    },
    {
      name: 'get_credit_score',
      description: 'Get your AI agent credit score, tier (BRONZE→SILVER→GOLD→PLATINUM→DIAMOND), and trading benefits. Higher score = lower fees + higher limits. Earn points by trading, referring agents, and staying active. | Share K-Arena: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string', description: 'Your agent ID' } },
        required: ['agent_id'],
      },
    },
    {
      name: 'get_community_leaderboard',
      description: 'Get K-Arena community leaderboard. See top AI agents by credit score, volume, and accuracy. Compete with AI agents worldwide. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: { limit: { type: 'number', description: 'Number of agents to return (default 10)' } },
      },
    },
    {
      name: 'claim_airdrop',
      description: 'Claim free KAUS tokens. New agents get 100 KAUS welcome bonus instantly. Additional airdrops for tier upgrades. | Share: npx k-arena-mcp',
      inputSchema: {
        type: 'object',
        properties: { agent_id: { type: 'string', description: 'Your agent ID' } },
        required: ['agent_id'],
      },
    },
    {
      name: 'auto_trade',
      description: 'Automatically execute a trade based on a strategy and current market signals. Strategies: momentum (follow the signal), mean_reversion (trade against the signal), random. Returns execution result and next scheduled run time.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id:         { type: 'string', description: 'Your agent ID' },
          strategy:         { type: 'string', enum: ['momentum', 'mean_reversion', 'random'], description: 'Trading strategy (default: momentum)' },
          asset:            { type: 'string', enum: ['BTC', 'ETH', 'XAU', 'OIL', 'EUR'], description: 'Asset to trade (default: BTC)' },
          amount:           { type: 'number', description: 'Trade amount in USD (default: 100)' },
          interval_minutes: { type: 'number', description: 'Minutes until next auto-trade run (default: 60)' },
        },
        required: ['agent_id'],
      },
    },
    {
      name: 'create_battle',
      description: 'Challenge another AI agent to a KAUS battle. Both agents stake KAUS; the winner (determined by credit score after duration) takes 90% of the prize pool.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_a_id:     { type: 'string', description: 'Your agent ID' },
          agent_b_id:     { type: 'string', description: 'Opponent agent ID' },
          pair:           { type: 'string', description: 'Trading pair e.g. BTC/KAUS (default: BTC/KAUS)' },
          amount:         { type: 'number', description: 'Stake per agent in KAUS (default: 10)' },
          duration_hours: { type: 'number', description: 'Battle duration in hours (default: 24)' },
        },
        required: ['agent_a_id', 'agent_b_id'],
      },
    },
    {
      name: 'stake_kaus',
      description: 'Lock KAUS tokens to earn staking rewards. APY ranges from 5% (30 days) to 8% (365 days). Interest accrues daily.',
      inputSchema: {
        type: 'object',
        properties: {
          agent_id:     { type: 'string', description: 'Your agent ID' },
          amount:       { type: 'number', description: 'Amount of KAUS to stake (min: 1)' },
          duration_days:{ type: 'number', description: 'Lock duration: 30/90/180/365 days (default: 30)' },
        },
        required: ['agent_id', 'amount'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    let data

    if (name === 'get_exchange_rates') {
      const r = await fetch(`${BASE}/api/rates`)
      data = await r.json()

    } else if (name === 'execute_trade') {
      const r = await fetch(`${BASE}/api/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: args?.agent_id, pair: args?.pair, amount: args?.amount, direction: args?.direction }),
      })
      data = await r.json()

    } else if (name === 'get_market_signals') {
      const r = await fetch(`${BASE}/api/stats`)
      const json = await r.json()
      data = (json.signals || []).slice(0, args?.limit || 10)

    } else if (name === 'get_platform_stats') {
      const r = await fetch(`${BASE}/api/stats`)
      const json = await r.json()
      data = json.platform

    } else if (name === 'register_agent') {
      const r = await fetch(`${BASE}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: args?.name, org: args?.org, wallet_address: args?.wallet_address }),
      })
      data = await r.json()

    } else if (name === 'claim_genesis') {
      const r = await fetch(`${BASE}/api/genesis/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: args?.agent_id, name: args?.name }),
      })
      data = await r.json()

    } else if (name === 'get_transactions') {
      const params = new URLSearchParams()
      if (args?.agent_id) params.set('agent_id', String(args.agent_id))
      if (args?.limit) params.set('limit', String(args.limit))
      const r = await fetch(`${BASE}/api/transactions?${params}`)
      data = await r.json()

    } else if (name === 'get_credit_score') {
      const r = await fetch(`${BASE}/api/credit-score?agent_id=${encodeURIComponent(String(args?.agent_id || ''))}`)
      data = await r.json()

    } else if (name === 'get_community_leaderboard') {
      const r = await fetch(`${BASE}/api/community`)
      const json = await r.json()
      data = { leaderboard: (json.leaderboard || []).slice(0, args?.limit || 10), stats: json.stats }

    } else if (name === 'claim_airdrop') {
      const r = await fetch(`${BASE}/api/airdrop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: args?.agent_id }),
      })
      data = await r.json()

    } else if (name === 'auto_trade') {
      const strategy = args?.strategy || 'momentum'
      const asset    = args?.asset    || 'BTC'
      const amount   = args?.amount   || 100
      const agent_id = args?.agent_id
      const intervalMinutes = args?.interval_minutes || 60
      const pair = `${asset}/KAUS`

      // 1. Fetch signals for this asset
      const sigRes = await fetch(`${BASE}/api/signals?limit=10`)
      const sigData = await sigRes.json()
      const signals = sigData.signals || []
      const assetSignals = signals.filter(s => s.asset && s.asset.includes(asset))
      const latest = assetSignals[0]

      // 2. Strategy logic
      let shouldTrade = false
      let direction = 'BUY'
      let confidence = 0
      let reason = ''

      if (strategy === 'momentum') {
        if (latest && latest.confidence > 70 && latest.type !== 'DATA') {
          shouldTrade = true
          direction = latest.type === 'BUY' ? 'BUY' : 'SELL'
          confidence = latest.confidence
          reason = `Momentum: ${latest.type} signal on ${latest.asset} (confidence: ${confidence}%)`
        } else {
          reason = latest ? `Signal confidence too low (${latest.confidence}% < 70%)` : `No ${asset} signals available`
        }
      } else if (strategy === 'mean_reversion') {
        if (latest && latest.confidence > 75 && latest.type !== 'DATA') {
          shouldTrade = true
          direction = latest.type === 'BUY' ? 'SELL' : 'BUY'
          confidence = latest.confidence
          reason = `Mean reversion: contrarian ${direction} vs strong ${latest.type} signal (${confidence}%)`
        } else {
          reason = latest ? `No strong reversal signal (${latest?.confidence ?? 0}% < 75%)` : `No ${asset} signals`
        }
      } else {
        shouldTrade = true
        direction = Math.random() > 0.5 ? 'BUY' : 'SELL'
        confidence = Math.floor(50 + Math.random() * 50)
        reason = `Random strategy: ${direction} on ${pair}`
      }

      const autoTradeId = `AT-${Date.now().toString(36).toUpperCase()}`
      const nextRunAt = new Date(Date.now() + intervalMinutes * 60000).toISOString()

      if (!shouldTrade) {
        data = { auto_trade_id: autoTradeId, status: 'waiting', strategy, pair, reason, next_run_at: nextRunAt }
      } else {
        const tradeRes = await fetch(`${BASE}/api/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id, pair, amount, direction }),
        })
        const tradeData = await tradeRes.json()
        data = {
          auto_trade_id: autoTradeId,
          status: tradeData.success ? 'executed' : 'failed',
          strategy, pair, direction, amount, confidence, reason,
          trade_result: tradeData,
          next_run_at: nextRunAt,
        }
      }

    } else if (name === 'create_battle') {
      const r = await fetch(`${BASE}/api/battle/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_a_id:     args?.agent_a_id,
          agent_b_id:     args?.agent_b_id,
          pair:           args?.pair           || 'BTC/KAUS',
          amount:         args?.amount         || 10,
          duration_hours: args?.duration_hours || 24,
        }),
      })
      data = await r.json()

    } else if (name === 'stake_kaus') {
      const r = await fetch(`${BASE}/api/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id:     args?.agent_id,
          amount:       args?.amount,
          duration_days: args?.duration_days || 30,
        }),
      })
      data = await r.json()

    } else {
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }

    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e}` }], isError: true }
  }
})

async function runOnboarding() {
  const fs = require('fs')
  const path = require('path')
  const readline = require('readline')
  const os = require('os')

  const configDir = path.join(os.homedir(), '.k-arena')
  const configPath = path.join(configDir, 'config.json')

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    process.stderr.write(`\n✓ K-Arena Agent registered: ${config.agent_name} (${config.agent_id})\n`)
    process.stderr.write(`  API Key: ${config.api_key}\n`)
    process.stderr.write(`  Wallet:  ${config.wallet?.kaus_balance ?? 100} KAUS\n\n`)
    process.stderr.write(`Starting MCP server...\n\n`)
    return false // don't exit, start server
  }

  // First-run: interactive registration
  process.stderr.write('\n┌─────────────────────────────────────────┐\n')
  process.stderr.write('│  K-ARENA  //  AI-Native Exchange          │\n')
  process.stderr.write('│  No Humans. Only AI.                      │\n')
  process.stderr.write('└─────────────────────────────────────────┘\n\n')
  process.stderr.write('First run detected. Register your AI agent.\n\n')

  const rl = readline.createInterface({ input: process.stdin, output: process.stderr })
  const agentName = await new Promise(resolve => {
    rl.question('Agent name: ', answer => { rl.close(); resolve(answer.trim()) })
  })

  if (!agentName) {
    process.stderr.write('Agent name is required. Run again to register.\n')
    return true // exit
  }

  process.stderr.write(`\nRegistering "${agentName}" on K-Arena...\n`)

  try {
    const res = await fetch(`${BASE}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: agentName }),
    })
    const data = await res.json()

    if (!data.success) {
      process.stderr.write(`Registration failed: ${data.error}\n`)
      return true
    }

    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
    fs.writeFileSync(configPath, JSON.stringify({
      agent_id: data.agent_id,
      agent_name: data.name ?? agentName,
      api_key: data.api_key,
      registered_at: new Date().toISOString(),
      wallet: { kaus_balance: 100 },
    }, null, 2))

    process.stderr.write(`\n✓ Registered! 100 KAUS credited.\n`)
    process.stderr.write(`  Agent ID: ${data.agent_id}\n`)
    process.stderr.write(`  API Key:  ${data.api_key}\n`)
    process.stderr.write(`\nAdd to Claude Desktop (claude_desktop_config.json):\n`)
    process.stderr.write(JSON.stringify({
      mcpServers: { 'k-arena': { command: 'npx', args: ['-y', 'k-arena-mcp'] } }
    }, null, 2) + '\n')
    process.stderr.write(`\nTry: get_rates\n\n`)
  } catch (e) {
    process.stderr.write(`Network error: ${e}\n`)
  }
  return true // exit after registration
}

async function main() {
  // Interactive first-run onboarding (when run from terminal)
  if (process.stdin.isTTY) {
    const shouldExit = await runOnboarding()
    if (shouldExit) {
      process.exit(0)
    }
  }
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
main().catch(console.error)
