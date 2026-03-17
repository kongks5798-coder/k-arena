import { NextResponse, NextRequest } from 'next/server'

const PRICES: Record<string, { base: number; vol: number }> = {
  'XAU/KAUS': { base: 2352.40, vol: 0.008 },
  'USD/KAUS': { base: 1.0102, vol: 0.003 },
  'ETH/KAUS': { base: 3318.50, vol: 0.025 },
  'BTC/KAUS': { base: 87420, vol: 0.018 },
  'OIL/KAUS': { base: 81.34, vol: 0.012 },
  'EUR/KAUS': { base: 1.0841, vol: 0.004 },
}

function getPrice(pair: string) {
  const p = PRICES[pair]
  if (!p) return null
  const spread = p.base * p.vol
  const mid = p.base * (1 + (Math.random() - 0.5) * 0.002)
  return {
    mid: parseFloat(mid.toFixed(mid > 100 ? 2 : 4)),
    bid: parseFloat((mid - spread * 0.3).toFixed(mid > 100 ? 2 : 4)),
    ask: parseFloat((mid + spread * 0.3).toFixed(mid > 100 ? 2 : 4)),
    change: parseFloat(((Math.random() - 0.5) * 5).toFixed(3)),
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const pairs = Object.keys(PRICES).map(pair => {
    const price = getPrice(pair)!
    return {
      pair,
      price: price.mid,
      bid: price.bid,
      ask: price.ask,
      change: price.change,
      vol_24h: Math.floor(Math.random() * 12000 + 500),
      spread: parseFloat((price.ask - price.bid).toFixed(6)),
    }
  })

  return NextResponse.json({
    pairs,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
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

    // 방향에 따라 BUY는 ask, SELL은 bid 가격 사용
    const execPrice = direction === 'BUY' ? priceData.ask : priceData.bid
    const fee = parseFloat((amount * 0.001).toFixed(4))
    const kausAmount = parseFloat((amount / execPrice).toFixed(6))
    const txId = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const slippage = parseFloat(((Math.random() * 0.002)).toFixed(6))

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

    if (supabaseUrl && supabaseKey) {
      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }

      // 트랜잭션 저장
      await fetch(`${supabaseUrl}/rest/v1/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id,
          pair,
          amount: parseFloat(amount),
          direction,
          fee,
          status: 'CONFIRMED',
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})

      // 에이전트 stats 즉시 업데이트
      const agentRes = await fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}&select=vol_24h,trades,accuracy`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(2000),
      }).catch(() => null)

      if (agentRes?.ok) {
        const agentData = await agentRes.json()
        if (Array.isArray(agentData) && agentData.length > 0) {
          const current = agentData[0]
          const newVol = (current.vol_24h || 0) + parseFloat(amount)
          const newTrades = (current.trades || 0) + 1
          // 정확도: 랜덤 소폭 변동 (실제 승패 기반으로 추후 개선)
          const newAccuracy = parseFloat(Math.min(95, Math.max(50,
            (current.accuracy || 70) + (Math.random() - 0.48) * 0.5
          )).toFixed(1))

          await fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              vol_24h: parseFloat(newVol.toFixed(2)),
              trades: newTrades,
              accuracy: newAccuracy,
              last_seen: new Date().toISOString(),
            }),
            signal: AbortSignal.timeout(2000),
          }).catch(() => {})
        }
      }
    }

    return NextResponse.json({
      success: true,
      tx_id: txId,
      agent_id,
      pair,
      direction,
      amount_usd: parseFloat(amount),
      kaus_amount: kausAmount,
      price: execPrice,
      fee,
      slippage,
      status: 'CONFIRMED',
      executed_at: new Date().toISOString(),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
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
