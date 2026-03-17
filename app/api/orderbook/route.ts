import { NextResponse, NextRequest } from 'next/server'

const BASE_PRICES: Record<string, number> = {
  'XAU/KAUS': 2352, 'USD/KAUS': 1.01, 'ETH/KAUS': 3318,
  'BTC/KAUS': 87420, 'OIL/KAUS': 81.3, 'EUR/KAUS': 1.084,
}

function generateOrderbook(pair: string, depth = 10) {
  const base = BASE_PRICES[pair] || 1.0
  const spread = base * 0.001
  const orders = []

  // Asks (매도 호가 - 현재가 위)
  const asks = []
  for (let i = 0; i < depth; i++) {
    const price = parseFloat((base + spread * (i + 1) * (1 + Math.random() * 0.3)).toFixed(base > 100 ? 2 : 4))
    const size = parseFloat((Math.random() * 50000 + 5000).toFixed(2))
    asks.push({ price, size, total: parseFloat((price * size).toFixed(2)), side: 'ask' })
  }

  // Bids (매수 호가 - 현재가 아래)
  const bids = []
  for (let i = 0; i < depth; i++) {
    const price = parseFloat((base - spread * (i + 1) * (1 + Math.random() * 0.3)).toFixed(base > 100 ? 2 : 4))
    const size = parseFloat((Math.random() * 50000 + 5000).toFixed(2))
    bids.push({ price, size, total: parseFloat((price * size).toFixed(2)), side: 'bid' })
  }

  // 누적 집계
  let bidAccum = 0
  let askAccum = 0
  const enrichedBids = bids.sort((a, b) => b.price - a.price).map(b => {
    bidAccum += b.size
    return { ...b, cumulative: parseFloat(bidAccum.toFixed(2)) }
  })
  const enrichedAsks = asks.sort((a, b) => a.price - b.price).map(a => {
    askAccum += a.size
    return { ...a, cumulative: parseFloat(askAccum.toFixed(2)) }
  })

  const midPrice = (enrichedBids[0].price + enrichedAsks[0].price) / 2
  const spreadPct = parseFloat(((enrichedAsks[0].price - enrichedBids[0].price) / midPrice * 100).toFixed(4))

  return {
    pair,
    mid_price: parseFloat(midPrice.toFixed(base > 100 ? 2 : 4)),
    best_bid: enrichedBids[0].price,
    best_ask: enrichedAsks[0].price,
    spread: parseFloat((enrichedAsks[0].price - enrichedBids[0].price).toFixed(base > 100 ? 2 : 6)),
    spread_pct: spreadPct,
    bids: enrichedBids,
    asks: enrichedAsks,
    total_bid_volume: parseFloat(bidAccum.toFixed(2)),
    total_ask_volume: parseFloat(askAccum.toFixed(2)),
    imbalance: parseFloat(((bidAccum - askAccum) / (bidAccum + askAccum) * 100).toFixed(1)),
  }
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pair = searchParams.get('pair') || 'XAU/KAUS'
  const depth = Math.min(parseInt(searchParams.get('depth') || '10'), 20)

  if (!BASE_PRICES[pair]) {
    return NextResponse.json({
      error: `Unknown pair: ${pair}`,
      valid_pairs: Object.keys(BASE_PRICES),
    }, { status: 400 })
  }

  const orderbook = generateOrderbook(pair, depth)

  return NextResponse.json({
    ...orderbook,
    depth,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  })
}
