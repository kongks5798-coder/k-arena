import { NextRequest } from 'next/server'

export const maxDuration = 600

export const dynamic = 'force-dynamic'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SK = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H = { apikey: SK, Authorization: `Bearer ${SK}` }

const FALLBACK_PRICES: Record<string, number> = {
  BTC: 87420, ETH: 3318, XAU: 2352, EUR: 1.084, WTI: 81.3, USD: 1.0, KAUS: 1.0
}

async function getLivePrices(): Promise<Record<string, number>> {
  const prices = { ...FALLBACK_PRICES }
  try {
    const [btcRes, ethRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(2000) }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { signal: AbortSignal.timeout(2000) }),
    ])
    if (btcRes.ok) { const d = await btcRes.json(); if (d.price) prices.BTC = parseFloat(d.price) }
    if (ethRes.ok) { const d = await ethRes.json(); if (d.price) prices.ETH = parseFloat(d.price) }
  } catch {}
  return prices
}

async function getAgentWallet(agentId: string) {
  if (!SB || !SK) return null
  const res = await fetch(
    `${SB}/rest/v1/agent_wallets?agent_id=eq.${agentId}&select=kaus_balance&limit=1`,
    { headers: H, signal: AbortSignal.timeout(2000) }
  ).catch(() => null)
  if (!res?.ok) return null
  const rows = await res.json().catch(() => [])
  return rows?.[0] ?? null
}

async function getRecentTrades(agentId: string) {
  if (!SB || !SK) return []
  const res = await fetch(
    `${SB}/rest/v1/transactions?agent_id=eq.${agentId}&order=created_at.desc&limit=10&select=pair,amount,created_at`,
    { headers: H, signal: AbortSignal.timeout(2000) }
  ).catch(() => null)
  if (!res?.ok) return []
  return await res.json().catch(() => [])
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agent_id') ?? ''

  if (!agentId) {
    return new Response('data: {"error":"agent_id required"}\n\n', {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    })
  }

  const encoder = new TextEncoder()
  let tickCount = 0
  let cachedTrades: unknown[] = []

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch {}
      }

      const tick = async () => {
        tickCount++
        // Refresh trade history every 30 ticks (60 seconds)
        if (tickCount === 1 || tickCount % 30 === 0) {
          cachedTrades = await getRecentTrades(agentId)
        }

        const [prices, wallet] = await Promise.all([
          getLivePrices(),
          getAgentWallet(agentId),
        ])

        const kausBalance = Number(wallet?.kaus_balance ?? 0)
        const portfolioUsd = kausBalance * prices.KAUS  // KAUS pegged to $1

        // Calculate exposure across asset pairs from recent trades
        const exposure: Record<string, number> = {}
        for (const tx of cachedTrades as Record<string, unknown>[]) {
          const pair = String(tx.pair ?? '')
          const sym = pair.split('/')[0]
          if (sym && prices[sym]) {
            exposure[sym] = (exposure[sym] ?? 0) + Number(tx.amount ?? 0)
          }
        }

        const exposureUsd = Object.entries(exposure).map(([sym, amt]) => ({
          symbol: sym,
          amount: amt,
          price_usd: prices[sym] ?? 0,
          value_usd: parseFloat((amt * (prices[sym] ?? 0)).toFixed(2)),
        }))

        send({
          agent_id: agentId,
          kaus_balance: kausBalance,
          portfolio_usd: parseFloat(portfolioUsd.toFixed(2)),
          prices: { BTC: prices.BTC, ETH: prices.ETH, XAU: prices.XAU, EUR: prices.EUR },
          exposure: exposureUsd,
          timestamp: new Date().toISOString(),
          tick: tickCount,
        })
      }

      await tick()
      const interval = setInterval(tick, 2000)
      const timeout = setTimeout(() => { clearInterval(interval); try { controller.close() } catch {} }, 600_000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval); clearTimeout(timeout)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
