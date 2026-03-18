import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FALLBACK: Record<string, number> = {
  BTC: 87420, ETH: 3318, XAU: 2352, EUR: 1.084, WTI: 81.3,
}

interface PriceRow { symbol: string; price: number; source: string }

async function upsertPriceCache(rows: PriceRow[], supabaseUrl: string, supabaseKey: string) {
  const h = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  }
  await fetch(`${supabaseUrl}/rest/v1/price_cache`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(rows.map(r => ({
      symbol: r.symbol,
      price: r.price,
      source: r.source,
      updated_at: new Date().toISOString(),
    }))),
    signal: AbortSignal.timeout(5000),
  })
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  const prices: Record<string, { value: number; source: string }> = {}

  // 1. Binance — BTC + ETH (primary)
  try {
    const [btcRes, ethRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(4000) }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { signal: AbortSignal.timeout(4000) }),
    ])
    if (btcRes.ok) { const d = await btcRes.json(); if (d.price) prices.BTC = { value: parseFloat(d.price), source: 'binance' } }
    if (ethRes.ok) { const d = await ethRes.json(); if (d.price) prices.ETH = { value: parseFloat(d.price), source: 'binance' } }
  } catch {}

  // 2. CoinGecko fallback for BTC/ETH if Binance failed
  if (!prices.BTC || !prices.ETH) {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const d = await res.json()
        if (d.bitcoin?.usd && !prices.BTC)  prices.BTC = { value: d.bitcoin.usd,  source: 'coingecko' }
        if (d.ethereum?.usd && !prices.ETH) prices.ETH = { value: d.ethereum.usd, source: 'coingecko' }
      }
    } catch {}
  }

  // 3. XAU (metals.live)
  try {
    const res = await fetch('https://api.metals.live/v1/spot/gold', { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const d = await res.json()
      const goldPrice = Array.isArray(d) ? d[0]?.price : d?.price
      if (goldPrice) prices.XAU = { value: goldPrice, source: 'metals-live' }
    }
  } catch {}

  // 4. EUR (ExchangeRate-API)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const d = await res.json()
      if (d.rates?.EUR) prices.EUR = { value: parseFloat((1 / d.rates.EUR).toFixed(4)), source: 'exchangerate' }
    }
  } catch {}

  // Apply fallbacks for missing symbols
  for (const [sym, fallback] of Object.entries(FALLBACK)) {
    if (!prices[sym]) prices[sym] = { value: fallback, source: 'fallback' }
  }

  const rows: PriceRow[] = Object.entries(prices).map(([symbol, { value, source }]) => ({ symbol, price: value, source }))

  if (supabaseUrl && supabaseKey) {
    try {
      await upsertPriceCache(rows, supabaseUrl, supabaseKey)
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    updated: rows.length,
    prices: Object.fromEntries(rows.map(r => [r.symbol, { price: r.price, source: r.source }])),
    timestamp: new Date().toISOString(),
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
