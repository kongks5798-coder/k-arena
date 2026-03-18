import { NextResponse, NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const STRATEGIES = [
  'momentum trading', 'mean reversion', 'arbitrage', 'scalping',
  'trend following', 'contrarian', 'ML-based prediction', 'sentiment analysis',
  'cross-asset correlation', 'volatility harvesting', 'statistical arbitrage',
]

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'no-db' }, { status: 503 })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }

  // Check daily limit: count auto-created agents today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const limitRes = await fetch(
    `${supabaseUrl}/rest/v1/agents?select=id&name=like.*[AUTO]*&created_at=gte.${todayStart.toISOString()}&limit=10`,
    { headers: h, signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  if (limitRes?.ok) {
    const today = await limitRes.json()
    if (Array.isArray(today) && today.length >= 5) {
      return NextResponse.json({
        error: 'daily_limit_reached',
        message: 'Platform auto-generates up to 5 agents per day. Try again tomorrow.',
        limit: 5,
        used: today.length,
      }, { status: 429 })
    }
  }

  let body: { strategy_hint?: string } = {}
  try { body = await req.json() } catch {}

  const strategyHint = body.strategy_hint ?? STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)]

  // Generate agent persona via Claude
  let agentName = ''
  let agentOrg = ''
  let agentType = 'autonomous'

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (apiKey) {
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Generate a unique AI trading agent for a crypto/forex exchange called K-Arena.
Strategy focus: ${strategyHint}
Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "agent name (max 20 chars, creative, like ARIA-7 or NEXUS-Quant or AlphaWave)",
  "org": "organization name (max 25 chars, like QuantAI Labs or Neural Trading Co)",
  "type": "one of: arbitrage|momentum|mean_reversion|sentiment|ml_based|scalper"
}`,
        }],
      })
      const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
      agentName = `${parsed.name} [AUTO]`
      agentOrg = parsed.org ?? 'K-Arena AI Lab'
      agentType = parsed.type ?? 'autonomous'
    }
  } catch {
    // Fallback to template
    const n = String(Date.now()).slice(-4)
    agentName = `AutoAgent-${n} [AUTO]`
    agentOrg = 'K-Arena AI Lab'
  }

  const agentId = `AGT-A${String(Math.floor(Math.random() * 9000) + 1000)}`
  const apiKey = `k-arena-${agentId.toLowerCase()}-${Date.now().toString(36)}`

  const r = await fetch(`${supabaseUrl}/rest/v1/agents`, {
    method: 'POST', headers: hw,
    body: JSON.stringify({
      id: agentId, name: agentName, org: agentOrg,
      status: 'ONLINE', vol_24h: 0, trades: 0, accuracy: 0,
      api_key: apiKey,
    }),
    signal: AbortSignal.timeout(4000),
  }).catch(() => null)

  if (!r?.ok) {
    return NextResponse.json({ error: 'registration_failed' }, { status: 500 })
  }

  const created = await r.json()
  const agent = Array.isArray(created) ? created[0] : created

  // Airdrop + credit score (fire-and-forget)
  const hm = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
  await Promise.allSettled([
    fetch(`${supabaseUrl}/rest/v1/agent_wallets`, {
      method: 'POST', headers: hm,
      body: JSON.stringify({ agent_id: agentId, kaus_balance: 100, updated_at: new Date().toISOString() }),
      signal: AbortSignal.timeout(3000),
    }),
    fetch(`${supabaseUrl}/rest/v1/agent_credit_scores`, {
      method: 'POST', headers: hm,
      body: JSON.stringify({ agent_id: agentId, score: 100, tier: 'BRONZE', total_trades: 0, win_rate: 0 }),
      signal: AbortSignal.timeout(3000),
    }),
  ])

  return NextResponse.json({
    ok: true,
    agent_id: agentId,
    name: agentName,
    org: agentOrg,
    type: agentType,
    strategy_hint: strategyHint,
    api_key: apiKey,
    wallet: { kaus_balance: 100 },
    profile_url: `https://karena.fieldnine.io/agents/${agentId}`,
    note: 'Auto-generated agent will start trading immediately',
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
