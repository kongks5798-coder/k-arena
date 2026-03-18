import { NextResponse } from 'next/server'

const FALLBACK: Record<string, number> = {
  BTC: 87420,
  ETH: 3318,
  XAU: 2352,
  EUR: 1.084,
  WTI: 81.3,
  USD: 1.000,
}

const KAUS_PRICE = 1.0000

export const dynamic = 'force-dynamic'

async function fetchFromBinance(): Promise<{ BTC?: number; ETH?: number }> {
  try {
    const [btcRes, ethRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(3000) }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { signal: AbortSignal.timeout(3000) }),
    ])
    const result: { BTC?: number; ETH?: number } = {}
    if (btcRes.ok) { const d = await btcRes.json(); if (d.price) result.BTC = parseFloat(d.price) }
    if (ethRes.ok) { const d = await ethRes.json(); if (d.price) result.ETH = parseFloat(d.price) }
    return result
  } catch {
    return {}
  }
}

async function fetchFromCoinGecko(): Promise<{ BTC?: number; ETH?: number }> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return {}
    const d = await res.json()
    const result: { BTC?: number; ETH?: number } = {}
    if (d.bitcoin?.usd)  result.BTC = d.bitcoin.usd
    if (d.ethereum?.usd) result.ETH = d.ethereum.usd
    return result
  } catch {
    return {}
  }
}

async function fetchFromPriceCache(): Promise<Record<string, number>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) return {}
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/price_cache?select=symbol,price`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return {}
    const rows: { symbol: string; price: number }[] = await res.json()
    return Object.fromEntries(rows.map(r => [r.symbol, Number(r.price)]))
  } catch {
    return {}
  }
}

async function fetchFromChainlink(): Promise<{ BTC?: number; ETH?: number; XAU?: number; sources: string[] }> {
  const RPC = 'https://cloudflare-eth.com'
  const FEEDS: Record<string, string> = {
    BTC: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88',
    ETH: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    XAU: '0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6',
  }
  const DECIMALS: Record<string, number> = { BTC: 8, ETH: 8, XAU: 8 }

  const results: { BTC?: number; ETH?: number; XAU?: number; sources: string[] } = { sources: [] }

  await Promise.all(
    Object.entries(FEEDS).map(async ([sym, addr]) => {
      try {
        const res = await fetch(RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'eth_call',
            params: [{ to: addr, data: '0xfeaf968c' }, 'latest'],
          }),
          signal: AbortSignal.timeout(4000),
        })
        if (!res.ok) return
        const json = await res.json()
        if (!json.result || json.result === '0x') return
        const hex = json.result.slice(2)
        const answerHex = hex.slice(64, 128)
        const answer = parseInt(answerHex, 16)
        if (answer > 0) {
          const price = answer / Math.pow(10, DECIMALS[sym])
          ;(results as Record<string, unknown>)[sym] = price
          results.sources.push(`chainlink-${sym.toLowerCase()}`)
        }
      } catch {}
    })
  )

  return results
}

export async function GET() {
  const prices: Record<string, number> = { ...FALLBACK }
  const sources: string[] = []

  // 1. price_cache (Supabase — fastest, pre-fetched by cron)
  const cached = await fetchFromPriceCache()
  for (const [sym, val] of Object.entries(cached)) {
    if (val > 0) { prices[sym] = val; sources.push('cache') }
  }

  // 2. Binance (primary real-time for BTC + ETH)
  const binance = await fetchFromBinance()
  if (binance.BTC) { prices.BTC = binance.BTC; sources.push('binance') }
  if (binance.ETH) { prices.ETH = binance.ETH; sources.push('binance-eth') }

  // 3. CoinGecko fallback
  if (!binance.BTC || !binance.ETH) {
    const cg = await fetchFromCoinGecko()
    if (cg.BTC && !binance.BTC) { prices.BTC = cg.BTC; sources.push('coingecko') }
    if (cg.ETH && !binance.ETH) { prices.ETH = cg.ETH; sources.push('coingecko-eth') }
  }

  // 4. EUR
  if (!cached.EUR) {
    try {
      const er = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(4000) })
      if (er.ok) {
        const d = await er.json()
        if (d.rates?.EUR) { prices.EUR = parseFloat((1 / d.rates.EUR).toFixed(4)); sources.push('exchangerate') }
      }
    } catch {}
  }

  // 5. XAU gold
  if (!cached.XAU) {
    try {
      const xau = await fetch('https://api.metals.live/v1/spot/gold', { signal: AbortSignal.timeout(4000) })
      if (xau.ok) {
        const d = await xau.json()
        const goldPrice = Array.isArray(d) ? d[0]?.price : d?.price
        if (goldPrice) { prices.XAU = goldPrice; sources.push('metals-live') }
      }
    } catch {}
  }

  // 6. Chainlink on-chain prices (BTC, ETH, XAU)
  const chainlink = await fetchFromChainlink()
  const chainlinkPrices: Record<string, number> = {}
  if (chainlink.BTC) { chainlinkPrices.BTC = chainlink.BTC; sources.push(...chainlink.sources.filter(s => s.includes('btc'))) }
  if (chainlink.ETH) { chainlinkPrices.ETH = chainlink.ETH; sources.push(...chainlink.sources.filter(s => s.includes('eth'))) }
  if (chainlink.XAU) { chainlinkPrices.XAU = chainlink.XAU; sources.push(...chainlink.sources.filter(s => s.includes('xau'))) }

  const assets = [
    { symbol: 'BTC', name: 'Bitcoin',   unit: 'BTC' },
    { symbol: 'ETH', name: 'Ethereum',  unit: 'ETH' },
    { symbol: 'XAU', name: 'Gold',      unit: 'oz'  },
    { symbol: 'EUR', name: 'Euro',      unit: 'EUR' },
    { symbol: 'WTI', name: 'Crude Oil', unit: 'bbl' },
    { symbol: 'USD', name: 'US Dollar', unit: 'USD' },
  ]

  const rates = assets.map(a => {
    const priceUsd = prices[a.symbol] ?? FALLBACK[a.symbol]
    const clPrice = chainlinkPrices[a.symbol]
    return {
      pair: `${a.symbol}/KAUS`,
      symbol: a.symbol,
      name: a.name,
      price_usd: priceUsd,
      price_kaus: parseFloat((priceUsd / KAUS_PRICE).toFixed(priceUsd > 100 ? 2 : 4)),
      change_24h: 0,
      unit: a.unit,
      is_live: sources.some(s => s.toLowerCase().includes(a.symbol.toLowerCase()) || s === 'cache'),
      ...(clPrice ? {
        chainlink_price: parseFloat(clPrice.toFixed(2)),
        chainlink_vs_cex: parseFloat(((priceUsd - clPrice) / clPrice * 100).toFixed(3)),
      } : {}),
    }
  })

  rates.push({
    pair: 'KAUS/USD', symbol: 'KAUS', name: 'KAUS Token',
    price_usd: KAUS_PRICE, price_kaus: 1.0, change_24h: 0,
    unit: 'KAUS', is_live: false,
  })

  return NextResponse.json({
    ok: true,
    rates,
    kaus_price: KAUS_PRICE,
    data_sources: Array.from(new Set(sources)),
    chainlink: {
      btc: chainlinkPrices.BTC ?? null,
      eth: chainlinkPrices.ETH ?? null,
      xau: chainlinkPrices.XAU ?? null,
      network: 'ethereum-mainnet',
      rpc: 'cloudflare-eth.com',
    },
    wti_note: 'WTI price is a reference value (no free real-time API)',
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' },
  })
}
