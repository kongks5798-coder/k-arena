import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

interface PriceRow {
  recorded_at: string
  price_usd: number
  asset?: string
}

function momentum(prices: number[]): number[] {
  // BUY when 3-day moving average crosses above 5-day; SELL otherwise
  const positions: number[] = []
  let held = false
  let entryPrice = 0
  let pnl = 0

  for (let i = 5; i < prices.length; i++) {
    const ma3 = (prices[i - 1] + prices[i - 2] + prices[i - 3]) / 3
    const ma5 = (prices[i - 1] + prices[i - 2] + prices[i - 3] + prices[i - 4] + prices[i - 5]) / 5

    if (!held && ma3 > ma5) {
      held = true; entryPrice = prices[i]
    } else if (held && ma3 < ma5) {
      pnl += (prices[i] - entryPrice) / entryPrice * 100
      held = false
    }
    positions.push(pnl + (held ? (prices[i] - entryPrice) / entryPrice * 100 : 0))
  }
  if (held && prices.length > 5) {
    // Close at last price
    pnl += (prices[prices.length - 1] - entryPrice) / entryPrice * 100
    positions[positions.length - 1] = pnl
  }
  return positions
}

function meanReversion(prices: number[]): number[] {
  // BUY when price drops >2% from 5-day avg; SELL when back to avg
  const positions: number[] = []
  let held = false
  let entryPrice = 0
  let pnl = 0

  for (let i = 5; i < prices.length; i++) {
    const avg = prices.slice(i - 5, i).reduce((a, b) => a + b, 0) / 5
    const dev = (prices[i] - avg) / avg

    if (!held && dev < -0.02) {
      held = true; entryPrice = prices[i]
    } else if (held && prices[i] >= avg) {
      pnl += (prices[i] - entryPrice) / entryPrice * 100
      held = false
    }
    positions.push(pnl + (held ? (prices[i] - entryPrice) / entryPrice * 100 : 0))
  }
  return positions
}

function randomBuy(prices: number[]): number[] {
  // Baseline: buy and hold
  const start = prices[0] || 1
  return prices.slice(5).map(p => (p - start) / start * 100)
}

function calcMetrics(pnlSeries: number[]) {
  if (!pnlSeries.length) return { total_return: 0, sharpe: 0, max_drawdown: 0, win_rate: 0, trades: 0 }

  const final = pnlSeries[pnlSeries.length - 1] ?? 0
  const returns = pnlSeries.map((v, i) => i === 0 ? v : v - pnlSeries[i - 1])
  const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1)
  const std = Math.sqrt(returns.map(r => (r - mean) ** 2).reduce((a, b) => a + b, 0) / (returns.length || 1))
  const sharpe = std > 0 ? parseFloat(((mean / std) * Math.sqrt(252)).toFixed(2)) : 0

  let peak = pnlSeries[0]
  let maxDD = 0
  for (const v of pnlSeries) {
    if (v > peak) peak = v
    const dd = peak - v
    if (dd > maxDD) maxDD = dd
  }

  const wins = returns.filter(r => r > 0).length
  const winRate = returns.length > 0 ? parseFloat(((wins / returns.length) * 100).toFixed(1)) : 0

  return {
    total_return: parseFloat(final.toFixed(2)),
    sharpe,
    max_drawdown: parseFloat(maxDD.toFixed(2)),
    win_rate: winRate,
    trades: returns.filter(r => Math.abs(r) > 0.01).length,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const strategy = searchParams.get('strategy') ?? 'momentum'
  const asset = searchParams.get('asset') ?? 'BTC'
  const days = Math.min(365, Math.max(7, parseInt(searchParams.get('days') ?? '30', 10)))

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 500 })
  }

  // Fetch price history
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/kaus_price_history?recorded_at=gte.${since}&order=recorded_at.asc&limit=1000`,
    { headers: H, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)

  let priceData: PriceRow[] = []
  if (res?.ok) {
    const raw = await res.json().catch(() => [])
    priceData = Array.isArray(raw) ? raw : []
  }

  if (priceData.length < 10) {
    return NextResponse.json({
      error: 'insufficient_data',
      message: 'Need at least 10 price points. Run /api/cron/price-history to generate data.',
      days_available: priceData.length,
    }, { status: 400 })
  }

  const prices = priceData.map(r => Number(r.price_usd) || 1)
  const dates = priceData.map(r => r.recorded_at?.slice(0, 10) ?? '').slice(5)

  // Run strategies
  const stratMap: Record<string, (p: number[]) => number[]> = {
    momentum,
    mean_reversion: meanReversion,
    buy_hold: randomBuy,
  }

  const runStrategy = stratMap[strategy] ?? momentum
  const pnlA = runStrategy(prices)
  const pnlB = meanReversion(prices) // always compare against mean_reversion
  const pnlBH = randomBuy(prices)    // always include buy-hold baseline

  const metrics = calcMetrics(pnlA)
  const seriesLength = Math.min(pnlA.length, pnlB.length, pnlBH.length, dates.length)

  const chart = Array.from({ length: seriesLength }, (_, i) => ({
    date: dates[i] ?? '',
    strategy: parseFloat((pnlA[i] ?? 0).toFixed(2)),
    mean_reversion: parseFloat((pnlB[i] ?? 0).toFixed(2)),
    buy_hold: parseFloat((pnlBH[i] ?? 0).toFixed(2)),
  }))

  return NextResponse.json({
    strategy,
    asset,
    days,
    data_points: priceData.length,
    metrics,
    chart,
    available_strategies: ['momentum', 'mean_reversion', 'buy_hold'],
  })
}
