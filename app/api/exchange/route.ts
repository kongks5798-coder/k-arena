import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const SB  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

async function sbFetch(path: string) {
  const r = await fetch(`${SB}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  })
  if (!r.ok) return []
  return r.json()
}

const FALLBACKS: Record<string, number> = {
  'XAU/KAUS': 2352.4, 'USD/KAUS': 1.0, 'ETH/KAUS': 3318.5,
  'BTC/KAUS': 87420, 'OIL/KAUS': 81.34, 'EUR/KAUS': 1.0841,
}

export async function GET() {
  try {
    const [stats, recent] = await Promise.all([
      sbFetch('pair_stats_24h?select=pair,trades_24h,vol_24h,avg_price,high_24h,low_24h,change_pct_24h'),
      sbFetch('transactions?select=pair,from_currency,rate&status=eq.CONFIRMED&order=created_at.desc&limit=80'),
    ])

    const sm: Record<string, any> = {}
    if (Array.isArray(stats)) stats.forEach((s: any) => { sm[s.pair] = s })

    const pm: Record<string, number> = {}
    if (Array.isArray(recent)) {
      recent.forEach((tx: any) => {
        const k = `${tx.from_currency}/KAUS`
        if (!pm[k]) pm[k] = parseFloat(tx.rate)
      })
    }

    const pairs = Object.entries(FALLBACKS).map(([pair, fb]) => {
      const price = pm[pair] ?? fb
      const spread = price < 2 ? price * 0.0004 : price < 100 ? price * 0.0003 : price < 5000 ? 2.4 : 50
      const s = sm[pair]
      return {
        pair,
        price: parseFloat(price.toFixed(price < 2 ? 4 : 2)),
        bid: parseFloat((price - spread / 2).toFixed(price < 2 ? 4 : 2)),
        ask: parseFloat((price + spread / 2).toFixed(price < 2 ? 4 : 2)),
        change: s ? parseFloat(parseFloat(s.change_pct_24h ?? 0).toFixed(2)) : 0,
        vol_24h: s ? parseFloat(parseFloat(s.vol_24h ?? 0).toFixed(2)) : 0,
        trades_24h: s ? parseInt(s.trades_24h ?? 0) : 0,
        high_24h: s ? parseFloat(parseFloat(s.high_24h ?? price).toFixed(price < 2 ? 4 : 2)) : price,
        low_24h: s ? parseFloat(parseFloat(s.low_24h ?? price).toFixed(price < 2 ? 4 : 2)) : price,
        spread: parseFloat(spread.toFixed(price < 2 ? 4 : 2)),
      }
    })

    return NextResponse.json({ pairs, timestamp: new Date().toISOString() })
  } catch {
    const pairs = Object.entries(FALLBACKS).map(([pair, price]) => ({
      pair, price, bid: price * 0.9998, ask: price * 1.0002,
      change: 0, vol_24h: 0, trades_24h: 0, high_24h: price, low_24h: price, spread: price * 0.0004,
    }))
    return NextResponse.json({ pairs, timestamp: new Date().toISOString() })
  }
}
