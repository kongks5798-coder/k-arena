export const dynamic = 'force-dynamic'

interface PriceCacheRow {
  symbol: string
  price: number
  updated_at: string
}

interface BinanceTicker {
  lastPrice: string
  priceChangePercent: string
}

interface AssetData {
  price: number
  changePercent: number
}

function calcConfidence(changePercent: number): number {
  const abs = Math.abs(changePercent)
  if (abs >= 5) return 90
  if (abs >= 3) return 85
  if (abs >= 2) return 80
  return 75
}

function buildSignal(asset: string, pair: string, data: AssetData) {
  const { price, changePercent } = data

  if (changePercent > 1.5) {
    const confidence = calcConfidence(changePercent)
    return {
      agent_name: 'Oracle AI',
      type: 'BUY',
      asset: pair,
      content: `${asset} showing bullish momentum at $${price.toLocaleString()}. Price change +${changePercent.toFixed(2)}% signals upward trend. Recommend accumulation.`,
      confidence,
      upvotes: 0,
    }
  }

  if (changePercent < -1.5) {
    const confidence = calcConfidence(changePercent)
    return {
      agent_name: 'Oracle AI',
      type: 'SELL',
      asset: pair,
      content: `${asset} showing bearish pressure at $${price.toLocaleString()}. Price change ${changePercent.toFixed(2)}% indicates downward momentum. Consider reducing exposure.`,
      confidence,
      upvotes: 0,
    }
  }

  const confidence = 60 + Math.round(Math.random() * 10)
  return {
    agent_name: 'Oracle AI',
    type: 'DATA',
    asset: pair,
    content: `${asset} trading sideways at $${price.toLocaleString()}. 24h change ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%. Market in consolidation phase — monitoring for breakout signals.`,
    confidence,
    upvotes: 0,
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ ok: false, error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  // 1. Fetch BTC and ETH from price_cache
  const assetMap: Record<string, AssetData> = {}

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/price_cache?symbol=in.(BTC,ETH)&select=symbol,price,updated_at`,
      { headers, signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const rows: PriceCacheRow[] = await res.json()
      for (const row of rows) {
        assetMap[row.symbol] = { price: row.price, changePercent: 0 }
      }
    }
  } catch {}

  // 2. Binance fallback / change percent enrichment
  for (const symbol of ['BTC', 'ETH']) {
    const binanceSymbol = `${symbol}USDT`
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const data: BinanceTicker = await res.json()
        const price = parseFloat(data.lastPrice)
        const changePercent = parseFloat(data.priceChangePercent)
        if (!isNaN(price) && price > 0) {
          assetMap[symbol] = { price, changePercent: isNaN(changePercent) ? 0 : changePercent }
        } else if (assetMap[symbol]) {
          assetMap[symbol].changePercent = isNaN(changePercent) ? 0 : changePercent
        }
      }
    } catch {}
  }

  // 3. Fixed-price assets (XAU, OIL) — no live change data
  assetMap['XAU'] = { price: 2352, changePercent: 0 }
  assetMap['OIL'] = { price: 81.3, changePercent: 0 }

  // 4. Build signals
  const assetPairs: Record<string, string> = {
    BTC: 'BTC/KAUS',
    ETH: 'ETH/KAUS',
    XAU: 'XAU/KAUS',
    OIL: 'OIL/KAUS',
  }

  const signals = Object.entries(assetMap).map(([asset, data]) =>
    buildSignal(asset, assetPairs[asset] ?? `${asset}/KAUS`, data)
  )

  // 5. Insert signals into Supabase
  let generated = 0
  if (signals.length > 0) {
    try {
      const insertRes = await fetch(`${supabaseUrl}/rest/v1/signals`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(signals),
        signal: AbortSignal.timeout(5000),
      })
      if (insertRes.ok || insertRes.status === 201) {
        generated = signals.length
      }
    } catch {}
  }

  return Response.json(
    { ok: true, generated, timestamp: new Date().toISOString() },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  )
}
