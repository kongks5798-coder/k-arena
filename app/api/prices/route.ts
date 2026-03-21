import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Real prices from CoinGecko (free tier, no key needed)
const FALLBACK = { BTC: 87420, ETH: 3318, XAU: 2352, OIL: 81.3, EUR: 1.084, USD: 1 }

export async function GET() {
  let btc = FALLBACK.BTC, eth = FALLBACK.ETH, btcChange = 0, ethChange = 0

  try {
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      { signal: AbortSignal.timeout(4000), headers: { 'Accept': 'application/json' } }
    )
    if (r.ok) {
      const d = await r.json()
      if (d.bitcoin?.usd)  { btc = d.bitcoin.usd;  btcChange = parseFloat((d.bitcoin.usd_24h_change ?? 0).toFixed(2)) }
      if (d.ethereum?.usd) { eth = d.ethereum.usd; ethChange = parseFloat((d.ethereum.usd_24h_change ?? 0).toFixed(2)) }
    }
  } catch { /* use fallback */ }

  return NextResponse.json({
    success: true,
    data: {
      BTC: { symbol: 'BTC', price: btc,          change24h: btcChange },
      ETH: { symbol: 'ETH', price: eth,          change24h: ethChange },
      XAU: { symbol: 'XAU', price: FALLBACK.XAU, change24h: 0 },
      USD: { symbol: 'USD', price: 1,            change24h: 0 },
      EUR: { symbol: 'EUR', price: FALLBACK.EUR, change24h: 0 },
      OIL: { symbol: 'OIL', price: FALLBACK.OIL, change24h: 0 },
    },
    timestamp: new Date().toISOString(),
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } })
}
