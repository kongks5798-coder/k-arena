import { NextResponse } from 'next/server'

// 폴백 가격 (외부 API 실패 시 — 실제 시장가 기준 고정값, 랜덤 없음)
const FALLBACK: Record<string, number> = {
  BTC: 87420,
  ETH: 3318,
  XAU: 2352, // per oz
  EUR: 1.084,
  WTI: 81.3,  // WTI Crude Oil — 무료 실시간 API 없어 고정
  USD: 1.000,
}

const KAUS_PRICE = 1.0000 // KAUS 페그 (아직 실거래소 미상장)

export const dynamic = 'force-dynamic'

export async function GET() {
  const prices: Record<string, number> = { ...FALLBACK }
  const sources: string[] = []

  // BTC + ETH 실시간 (CoinGecko 무료)
  try {
    const cg = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      { signal: AbortSignal.timeout(4000) }
    )
    if (cg.ok) {
      const d = await cg.json()
      if (d.bitcoin?.usd)  { prices.BTC = d.bitcoin.usd;  sources.push('coingecko') }
      if (d.ethereum?.usd) { prices.ETH = d.ethereum.usd; sources.push('coingecko-eth') }
    }
  } catch { /* 폴백 유지 */ }

  // EUR 환율 실시간 (ExchangeRate-API 무료)
  try {
    const er = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { signal: AbortSignal.timeout(4000) }
    )
    if (er.ok) {
      const d = await er.json()
      if (d.rates?.EUR) { prices.EUR = parseFloat((1 / d.rates.EUR).toFixed(4)); sources.push('exchangerate') }
    }
  } catch { /* 폴백 유지 */ }

  // XAU 금 실시간 (metals.live 무료)
  try {
    const xau = await fetch(
      'https://api.metals.live/v1/spot/gold',
      { signal: AbortSignal.timeout(4000) }
    )
    if (xau.ok) {
      const d = await xau.json()
      const goldPrice = Array.isArray(d) ? d[0]?.price : d?.price
      if (goldPrice) { prices.XAU = goldPrice; sources.push('metals-live') }
    }
  } catch { /* 폴백 유지 */ }

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
    return {
      pair: `${a.symbol}/KAUS`,
      symbol: a.symbol,
      name: a.name,
      price_usd: priceUsd,
      price_kaus: parseFloat((priceUsd / KAUS_PRICE).toFixed(priceUsd > 100 ? 2 : 4)),
      change_24h: 0,   // 실데이터 없으면 0 표시 (가짜 생성 안 함)
      unit: a.unit,
      is_live: sources.some(s => s.toLowerCase().includes(a.symbol.toLowerCase())),
    }
  })

  // KAUS/USD
  rates.push({
    pair: 'KAUS/USD',
    symbol: 'KAUS',
    name: 'KAUS Token',
    price_usd: KAUS_PRICE,
    price_kaus: 1.0,
    change_24h: 0,
    unit: 'KAUS',
    is_live: false, // 거래소 미상장
  })

  return NextResponse.json({
    rates,
    kaus_price: KAUS_PRICE,
    data_sources: sources.length > 0 ? sources : ['fallback'],
    wti_note: 'WTI price is a reference value (no free real-time API)',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  })
}
