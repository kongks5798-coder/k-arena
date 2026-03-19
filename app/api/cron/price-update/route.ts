import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''

const FALLBACK: Record<string, number> = {
  price_btc: 87420, price_eth: 3318, price_xau: 2352, price_oil: 81.3,
  price_eur: 1.085, price_usd: 1.0,
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const prices: Record<string, number> = { ...FALLBACK }

  // Fetch from CoinGecko
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,gold,crude-oil&vs_currencies=usd',
      { signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const d = await res.json()
      if (d.bitcoin?.usd)    prices.price_btc = d.bitcoin.usd
      if (d.ethereum?.usd)   prices.price_eth = d.ethereum.usd
      if (d.gold?.usd)       prices.price_xau = d.gold.usd
      if (d['crude-oil']?.usd) prices.price_oil = d['crude-oil'].usd
    }
  } catch {}

  const now = new Date().toISOString()

  if (SB && KEY) {
    const h = {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    }

    // Upsert into platform_stats
    const rows = Object.entries(prices).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: now,
    }))

    await fetch(`${SB}/rest/v1/platform_stats`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(rows),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)

    // Also upsert into price_cache for demo-trade compatibility
    const cacheRows = [
      { symbol: 'BTC', price: prices.price_btc, source: 'coingecko', updated_at: now },
      { symbol: 'ETH', price: prices.price_eth, source: 'coingecko', updated_at: now },
      { symbol: 'XAU', price: prices.price_xau, source: 'coingecko', updated_at: now },
      { symbol: 'WTI', price: prices.price_oil, source: 'coingecko', updated_at: now },
      { symbol: 'EUR', price: prices.price_eur, source: 'fixed', updated_at: now },
    ]
    await fetch(`${SB}/rest/v1/price_cache`, {
      method: 'POST',
      headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(cacheRows),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)
  }

  return NextResponse.json({ ok: true, prices, timestamp: now })
}
