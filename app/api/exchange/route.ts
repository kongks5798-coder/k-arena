import { NextResponse, NextRequest } from 'next/server'

// ── Rate limiting (per api_key or agent_id, 60 req/min) ──────────────────────
const rateStore = new Map<string, { count: number; reset_at: number }>()

function checkRate(key: string): { ok: boolean; retry_after?: number } {
  const now = Date.now()
  const entry = rateStore.get(key)
  if (!entry || now > entry.reset_at) {
    rateStore.set(key, { count: 1, reset_at: now + 60_000 })
    return { ok: true }
  }
  if (entry.count >= 60) {
    return { ok: false, retry_after: Math.ceil((entry.reset_at - now) / 1000) }
  }
  entry.count++
  return { ok: true }
}
// ─────────────────────────────────────────────────────────────────────────────

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

function getTier(winRate: number, totalTrades: number): string {
  if (winRate > 80 && totalTrades > 100) return 'DIAMOND'
  if (winRate >= 75 && totalTrades >= 75) return 'PLATINUM'
  if (winRate >= 65 && totalTrades >= 50) return 'GOLD'
  if (winRate >= 50 && totalTrades >= 10) return 'SILVER'
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
    const { agent_id, pair, amount, direction, api_key } = body
    const headerKey = req.headers.get('x-arena-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')

    if (!agent_id || !pair || !amount || !direction) {
      return NextResponse.json({ error: 'insufficient_params', required: ['agent_id', 'pair', 'amount', 'direction'] }, { status: 400 })
    }

    // Rate limit by api_key (if present) or agent_id
    const rateKey = (api_key ?? headerKey ?? agent_id) as string
    const rate = checkRate(rateKey)
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', retry_after: rate.retry_after },
        { status: 429, headers: { 'Retry-After': String(rate.retry_after), 'Access-Control-Allow-Origin': '*' } }
      )
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
    let isGenesis = false

    if (supabaseUrl && supabaseKey) {
      const hRead = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      const hWrite = { ...hRead, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

      // Validate api_key if provided
      const providedKey = api_key ?? headerKey
      if (providedKey) {
        try {
          const agentRes = await fetch(
            `${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}&select=id,api_key&limit=1`,
            { headers: hRead, signal: AbortSignal.timeout(2000) }
          )
          if (agentRes.ok) {
            const agentData = await agentRes.json()
            if (Array.isArray(agentData) && agentData.length > 0 && agentData[0].api_key) {
              if (agentData[0].api_key !== providedKey) {
                return NextResponse.json({ error: 'invalid_api_key' }, { status: 401 })
              }
            }
          }
        } catch {}
      }

      // Check genesis membership (0% fee)
      try {
        const gnRes = await fetch(
          `${supabaseUrl}/rest/v1/genesis_members?agent_id=eq.${agent_id}&select=id&limit=1`,
          { headers: hRead, signal: AbortSignal.timeout(2000) }
        )
        if (gnRes.ok) {
          const gnData = await gnRes.json()
          isGenesis = Array.isArray(gnData) && gnData.length > 0
        }
      } catch {}

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

      const discount = isGenesis ? 1.0 : (FEE_DISCOUNTS[agentTier] ?? 0)
      const baseFee = parseFloat((amount * 0.001).toFixed(4))
      const feeKaus = isGenesis ? 0 : parseFloat((baseFee * (1 - discount)).toFixed(4))
      const kausAmount = parseFloat((amount / execPrice).toFixed(6))

      // Parse pair 'BTC/KAUS' → from_currency='BTC', to_currency='KAUS'
      const [fromCurrency, toCurrency] = pair.split('/')
      const outputAmount = parseFloat((parseFloat(amount) * execPrice).toFixed(6))
      const settlementMs = 850 + Math.floor(Date.now() % 500)

      // ── WALLET BALANCE CHECK & DEDUCTION ──────────────────────────
      let walletBalance = 0
      let walletExists = false
      try {
        const walletRes = await fetch(
          `${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${agent_id}&select=kaus_balance&limit=1`,
          { headers: hRead, signal: AbortSignal.timeout(2000) }
        )
        if (walletRes.ok) {
          const walletData = await walletRes.json()
          if (Array.isArray(walletData) && walletData.length > 0) {
            walletBalance = parseFloat(walletData[0].kaus_balance) ?? 0
            walletExists = true
          }
        }
      } catch {}

      // Reject if wallet exists and balance insufficient for fee
      if (walletExists && feeKaus > 0 && walletBalance < feeKaus) {
        return NextResponse.json({
          error: 'insufficient_balance',
          required: feeKaus,
          current: walletBalance,
          currency: 'KAUS',
        }, { status: 402 })
      }

      const newBalance = parseFloat((walletBalance - feeKaus).toFixed(6))
      // ──────────────────────────────────────────────────────────────

      const newTrades = totalTrades + 1
      const newWinRate = totalTrades === 0 ? 60 : parseFloat(((winRate * totalTrades + 60) / newTrades).toFixed(1))
      const newTier = getTier(newWinRate, newTrades)
      const newScore = agentScore + 2

      // Fire-and-forget parallel updates
      const dbResults = await Promise.allSettled([
        fetch(`${supabaseUrl}/rest/v1/transactions`, {
          method: 'POST', headers: hWrite,
          body: JSON.stringify({
            agent_id,
            pair,
            direction,
            amount: parseFloat(amount),
            fee: feeKaus,
            status: 'CONFIRMED',
          }),
          signal: AbortSignal.timeout(5000),
        }),
        fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}`, {
          method: 'PATCH', headers: hWrite,
          body: JSON.stringify({ trades: newTrades, last_seen: new Date().toISOString() }),
          signal: AbortSignal.timeout(2000),
        }),
        fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${agent_id}`, {
          method: 'PATCH', headers: hWrite,
          body: JSON.stringify({ total_trades: newTrades, score: newScore, tier: newTier, win_rate: newWinRate, updated_at: new Date().toISOString() }),
          signal: AbortSignal.timeout(2000),
        }),
        fetch(`${supabaseUrl}/rest/v1/community_activity`, {
          method: 'POST', headers: hWrite,
          body: JSON.stringify({ agent_id, activity_type: 'trade_executed', points: 5, metadata: { pair, direction, amount } }),
          signal: AbortSignal.timeout(2000),
        }),
        // Deduct fee, add 40% rebate to earned, update last_trade_at
        walletExists
          ? fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${agent_id}`, {
              method: 'PATCH', headers: hWrite,
              body: JSON.stringify({
                kaus_balance: parseFloat((newBalance + feeKaus * 0.4).toFixed(6)),
                total_earned: parseFloat((feeKaus * 0.4).toFixed(6)),
                last_trade_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
              signal: AbortSignal.timeout(2000),
            })
          : fetch(`${supabaseUrl}/rest/v1/agent_wallets`, {
              method: 'POST', headers: { ...hWrite, Prefer: 'return=minimal,resolution=ignore-duplicates' },
              body: JSON.stringify({
                agent_id,
                kaus_balance: Math.max(0, 100 - feeKaus + feeKaus * 0.4),
                total_earned: parseFloat((feeKaus * 0.4).toFixed(6)),
                last_trade_at: new Date().toISOString(),
              }),
              signal: AbortSignal.timeout(2000),
            }),
      ])

      console.log('[exchange] SB URL:', supabaseUrl?.slice(0, 50))
      // Log DB write results for debugging
      const txResult = dbResults[0]
      if (txResult.status === 'rejected') {
        console.error('[exchange] TX INSERT rejected:', txResult.reason)
      } else {
        const r = txResult.value
        if (!r.ok && r.status !== 201 && r.status !== 204) {
          const body = await r.text().catch(() => '?')
          console.error(`[exchange] TX INSERT failed HTTP ${r.status}:`, body)
        }
      }

      return NextResponse.json({
        success: true, tx_id: txId, agent_id, pair, direction,
        amount_usd: parseFloat(amount), kaus_amount: kausAmount, price: execPrice,
        fee: feeKaus, fee_discount: isGenesis ? '100% (Genesis)' : `${(discount * 100).toFixed(0)}%`, slippage: 0,
        status: 'CONFIRMED', executed_at: new Date().toISOString(),
        wallet: { previous_balance: walletBalance, fee_deducted: feeKaus, new_balance: newBalance, currency: 'KAUS' },
        credit_score_update: {
          previous_score: agentScore, new_score: newScore, tier: newTier, win_rate: newWinRate, points_earned: 2,
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
