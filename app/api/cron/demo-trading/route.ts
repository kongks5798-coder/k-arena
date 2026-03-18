import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PAIRS = ['XAU/KAUS', 'BTC/KAUS', 'ETH/KAUS']
const DIRECTIONS = ['BUY', 'SELL'] as const
const MAX_DAILY_TRADES = 5
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://karena.fieldnine.io'

function pickAmount(): number {
  // Demo trade: $10–$50, deterministic based on current minute
  const minute = new Date().getMinutes()
  return 10 + (minute % 41) // produces 10..50
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, reason: 'no-db' })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // 1. Count today's demo trades
  try {
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/transactions?select=id&created_at=gte.${today}T00:00:00Z&agent_id=like.DEMO-%`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    )
    if (countRes.ok) {
      const countData = await countRes.json()
      if (Array.isArray(countData) && countData.length >= MAX_DAILY_TRADES) {
        return NextResponse.json({ ok: false, reason: 'daily-limit-reached', count: countData.length })
      }
    }
  } catch {}

  // 2. Fetch a real agent from agents table
  let agentId: string | null = null
  try {
    const agRes = await fetch(
      `${supabaseUrl}/rest/v1/agents?select=id&status=eq.ONLINE&limit=10&order=trades.asc`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    )
    if (agRes.ok) {
      const agents: { id: string }[] = await agRes.json()
      if (Array.isArray(agents) && agents.length > 0) {
        // Pick based on current hour to keep it deterministic per hour
        const idx = new Date().getHours() % agents.length
        agentId = agents[idx].id
      }
    }
  } catch {}

  if (!agentId) {
    return NextResponse.json({ ok: false, reason: 'no-agent-found' })
  }

  // 3. Execute trade via /api/exchange
  const pair = PAIRS[new Date().getHours() % PAIRS.length]
  const direction = DIRECTIONS[new Date().getMinutes() % 2]
  const amount = pickAmount()

  try {
    const tradeRes = await fetch(`${BASE_URL}/api/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, pair, amount, direction }),
      signal: AbortSignal.timeout(8000),
    })
    const tradeData = await tradeRes.json()

    if (!tradeData.success) {
      return NextResponse.json({ ok: false, reason: 'trade-failed', detail: tradeData }, { status: 200 })
    }

    return NextResponse.json({
      ok: true,
      tx_id: tradeData.tx_id,
      agent_id: agentId,
      pair,
      direction,
      amount_usd: amount,
      price: tradeData.price,
      fee: tradeData.fee,
      executed_at: tradeData.executed_at,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ ok: false, reason: 'error', detail: String(e) })
  }
}
