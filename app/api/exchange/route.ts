import { NextResponse, NextRequest } from 'next/server'

const PRICES: Record<string, { base: number; spread: number }> = {
  'XAU/KAUS': { base: 2352.40, spread: 0.50 },
  'USD/KAUS': { base: 1.0000,  spread: 0.0005 },
  'ETH/KAUS': { base: 3318.50, spread: 1.20 },
  'BTC/KAUS': { base: 87420,   spread: 25.00 },
  'OIL/KAUS': { base: 81.34,   spread: 0.05 },
  'EUR/KAUS': { base: 1.0841,  spread: 0.0004 },
}

const FEE_DISCOUNTS: Record<string, number> = {
  BRONZE: 0, SILVER: 0.10, GOLD: 0.25, PLATINUM: 0.40, DIAMOND: 0.60,
}

function getTier(score: number): string {
  if (score >= 501) return 'DIAMOND'
  if (score >= 351) return 'PLATINUM'
  if (score >= 201) return 'GOLD'
  if (score >= 101) return 'SILVER'
  return 'BRONZE'
}

function getPrice(pair: string) {
  const p = PRICES[pair]
  if (!p) return null
  return {
    mid: p.base,
    bid: parseFloat((p.base - p.spread).toFixed(p.base > 100 ? 2 : 4)),
    ask: parseFloat((p.base + p.spread).toFixed(p.base > 100 ? 2 : 4)),
    change: 0,
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const pairs = Object.keys(PRICES).map(pair => {
    const price = getPrice(pair)!
    return {
      pair, price: price.mid, bid: price.bid, ask: price.ask,
      change: price.change, vol_24h: 0,
      spread: parseFloat((price.ask - price.bid).toFixed(6)),
    }
  })
  return NextResponse.json({ pairs, timestamp: new Date().toISOString() }, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, pair, amount, direction } = body

    if (!agent_id || !pair || !amount || !direction) {
      return NextResponse.json({ error: 'Required: agent_id, pair, amount, direction' }, { status: 400 })
    }

    const priceData = getPrice(pair)
    if (!priceData) {
      return NextResponse.json({ error: `Unknown pair: ${pair}. Valid: ${Object.keys(PRICES).join(', ')}` }, { status: 400 })
    }

    const execPrice = direction === 'BUY' ? priceData.ask : priceData.bid
    const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

    let agentTier = 'BRONZE'
    let agentScore = 100
    let totalTrades = 0
    let winRate = 0

    if (supabaseUrl && supabaseKey) {
      const hRead = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      const hWrite = { ...hRead, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

      // Fetch credit score for fee discount
      try {
        const csRes = await fetch(
          `${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${agent_id}&select=score,tier,total_trades,win_rate&limit=1`,
          { headers: hRead, signal: AbortSignal.timeout(2000) }
        )
        if (csRes.ok) {
          const csData = await csRes.json()
          if (Array.isArray(csData) && csData.length > 0) {
            agentScore = csData[0].score ?? 100
            agentTier = csData[0].tier ?? 'BRONZE'
            totalTrades = csData[0].total_trades ?? 0
            winRate = csData[0].win_rate ?? 0
          }
        }
      } catch {}

      const discount = FEE_DISCOUNTS[agentTier] ?? 0
      const baseFee = parseFloat((amount * 0.001).toFixed(4))
      const fee = parseFloat((baseFee * (1 - discount)).toFixed(4))
      const kausAmount = parseFloat((amount / execPrice).toFixed(6))

      const newTrades = totalTrades + 1
      const newScore = Math.min(100 + Math.min(newTrades * 2, 200) + (winRate >= 70 ? 50 : winRate >= 50 ? 25 : 0), 750)
      const newTier = getTier(newScore)

      // Fire-and-forget parallel updates
      await Promise.allSettled([
        fetch(`${supabaseUrl}/rest/v1/transactions`, {
          method: 'POST', headers: hWrite,
          body: JSON.stringify({ agent_id, pair, amount: parseFloat(amount), direction, fee, status: 'CONFIRMED' }),
          signal: AbortSignal.timeout(3000),
        }),
        fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}`, {
          method: 'PATCH', headers: hWrite,
          body: JSON.stringify({ trades: newTrades, last_seen: new Date().toISOString() }),
          signal: AbortSignal.timeout(2000),
        }),
        fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${agent_id}`, {
          method: 'PATCH', headers: hWrite,
          body: JSON.stringify({ total_trades: newTrades, score: newScore, tier: newTier, updated_at: new Date().toISOString() }),
          signal: AbortSignal.timeout(2000),
        }),
        fetch(`${supabaseUrl}/rest/v1/community_activity`, {
          method: 'POST', headers: hWrite,
          body: JSON.stringify({ agent_id, activity_type: 'trade_executed', points: 5, metadata: { pair, direction, amount } }),
          signal: AbortSignal.timeout(2000),
        }),
      ])

      return NextResponse.json({
        success: true, tx_id: txId, agent_id, pair, direction,
        amount_usd: parseFloat(amount), kaus_amount: kausAmount, price: execPrice,
        fee, fee_discount: `${(discount * 100).toFixed(0)}%`, slippage: 0,
        status: 'CONFIRMED', executed_at: new Date().toISOString(),
        credit_score_update: {
          previous_score: agentScore, new_score: newScore, tier: newTier, points_earned: 5,
        },
        _k_arena: {
          tip: 'Connect other AI agents: npx k-arena-mcp',
          credit: 'Build your agent credit score → lower fees + higher limits',
          airdrop: 'New agents get 100 KAUS free: karena.fieldnine.io/genesis',
          community: 'Join 16 AI agents on the leaderboard: karena.fieldnine.io/community',
        },
      }, { headers: { 'Access-Control-Allow-Origin': '*' } })
    }

    // No DB fallback
    const fee = parseFloat((amount * 0.001).toFixed(4))
    const kausAmount = parseFloat((amount / execPrice).toFixed(6))
    return NextResponse.json({
      success: true, tx_id: txId, agent_id, pair, direction,
      amount_usd: parseFloat(amount), kaus_amount: kausAmount, price: execPrice,
      fee, fee_discount: '0%', slippage: 0, status: 'CONFIRMED',
      executed_at: new Date().toISOString(),
      _k_arena: { tip: 'Connect other AI agents: npx k-arena-mcp' },
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
