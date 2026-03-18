const PAIRS = ['XAU/KAUS', 'BTC/KAUS', 'ETH/KAUS']
const DIRECTIONS = ['BUY', 'SELL'] as const
const MAX_DAILY_TRADES = 5
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://karena.fieldnine.io'

function pickAmount(seed: number): number {
  return 10 + (seed % 41) // $10–$50 deterministic
}

export async function runDemoTrade() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) return { ok: false, reason: 'no-db' }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const hWrite = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }
  const today = new Date().toISOString().slice(0, 10)

  // 1. Check demo_trades daily limit
  try {
    const countRes = await fetch(
      `${supabaseUrl}/rest/v1/demo_trades?select=id&created_at=gte.${today}T00:00:00Z`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    )
    if (countRes.ok) {
      const rows = await countRes.json()
      if (Array.isArray(rows) && rows.length >= MAX_DAILY_TRADES)
        return { ok: false, reason: 'daily-limit-reached', count: rows.length }
    }
  } catch {}

  // 2. Pick a real ONLINE agent
  let agentId: string | null = null
  try {
    const agRes = await fetch(
      `${supabaseUrl}/rest/v1/agents?select=id&status=eq.ONLINE&limit=10&order=trades.asc`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    )
    if (agRes.ok) {
      const agents: { id: string }[] = await agRes.json()
      if (Array.isArray(agents) && agents.length > 0) {
        const now = new Date()
        agentId = agents[(now.getHours() * 60 + now.getMinutes()) % agents.length].id
      }
    }
  } catch {}

  if (!agentId) return { ok: false, reason: 'no-agent-found' }

  const now = new Date()
  const pair = PAIRS[now.getHours() % PAIRS.length]
  const direction = DIRECTIONS[now.getMinutes() % 2]
  const amount = pickAmount(now.getMinutes())

  // 3. Execute trade
  try {
    const tradeRes = await fetch(`${BASE_URL}/api/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, pair, amount, direction }),
      signal: AbortSignal.timeout(8000),
    })
    const tradeData = await tradeRes.json()

    if (!tradeData.success) return { ok: false, reason: 'trade-failed', detail: tradeData }

    // 4. Record in demo_trades
    fetch(`${supabaseUrl}/rest/v1/demo_trades`, {
      method: 'POST', headers: hWrite,
      body: JSON.stringify({ agent_id: agentId, pair, direction, amount }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {})

    return {
      ok: true,
      tx_id: tradeData.tx_id,
      agent_id: agentId, pair, direction,
      amount_usd: amount,
      price: tradeData.price,
      fee: tradeData.fee,
      fee_discount: tradeData.fee_discount,
      executed_at: tradeData.executed_at,
    }
  } catch (e) {
    return { ok: false, reason: 'error', detail: String(e) }
  }
}
