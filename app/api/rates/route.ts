import { NextResponse } from 'next/server'

// 현실적인 가격 변동성 모델
const ASSETS = [
  { symbol: 'XAU', name: 'Gold', base: 2352, vol: 0.008, unit: 'oz' },
  { symbol: 'BTC', name: 'Bitcoin', base: 87420, vol: 0.025, unit: 'BTC' },
  { symbol: 'ETH', name: 'Ethereum', base: 3318, vol: 0.030, unit: 'ETH' },
  { symbol: 'EUR', name: 'Euro', base: 1.084, vol: 0.003, unit: 'EUR' },
  { symbol: 'WTI', name: 'Crude Oil', base: 81.3, vol: 0.015, unit: 'bbl' },
  { symbol: 'USD', name: 'US Dollar', base: 1.000, vol: 0.001, unit: 'USD' },
]

const KAUS_BASE = 1.01

// 시간 기반 시드로 일관된 가격 생성 (같은 분 내 동일 가격)
function seededRand(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000
  const r = x - Math.floor(x)
  return min + r * (max - min)
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = Date.now()
  const minuteSeed = Math.floor(now / 60000) // 분 단위 시드

  const kausPrice = KAUS_BASE * (1 + seededRand(minuteSeed * 7, -0.02, 0.03))

  const rates = ASSETS.map((asset, i) => {
    const seed = minuteSeed * (i + 3)
    const price = asset.base * (1 + seededRand(seed, -asset.vol, asset.vol))
    const change24h = seededRand(seed * 13, -asset.vol * 100, asset.vol * 100)
    const kausRate = price / kausPrice

    return {
      pair: `${asset.symbol}/KAUS`,
      symbol: asset.symbol,
      name: asset.name,
      price_usd: parseFloat(price.toFixed(price > 100 ? 2 : 4)),
      price_kaus: parseFloat(kausRate.toFixed(price > 100 ? 2 : 4)),
      change_24h: parseFloat(change24h.toFixed(3)),
      change_7d: parseFloat(seededRand(seed * 5, -asset.vol * 300, asset.vol * 300).toFixed(2)),
      high_24h: parseFloat((price * (1 + asset.vol * 0.8)).toFixed(price > 100 ? 2 : 4)),
      low_24h: parseFloat((price * (1 - asset.vol * 0.8)).toFixed(price > 100 ? 2 : 4)),
      volume_24h: Math.floor(seededRand(seed * 11, 500, 15000)),
      unit: asset.unit,
    }
  })

  // KAUS/USD 추가
  rates.push({
    pair: 'KAUS/USD',
    symbol: 'KAUS',
    name: 'KAUS Token',
    price_usd: parseFloat(kausPrice.toFixed(4)),
    price_kaus: 1.0,
    change_24h: parseFloat(seededRand(minuteSeed * 17, -2, 3).toFixed(3)),
    change_7d: parseFloat(seededRand(minuteSeed * 19, -5, 8).toFixed(2)),
    high_24h: parseFloat((kausPrice * 1.015).toFixed(4)),
    low_24h: parseFloat((kausPrice * 0.985).toFixed(4)),
    volume_24h: Math.floor(seededRand(minuteSeed * 23, 50000, 200000)),
    unit: 'KAUS',
  })

  return NextResponse.json({
    rates,
    kaus_price: parseFloat(kausPrice.toFixed(4)),
    timestamp: new Date().toISOString(),
    next_update: new Date(Math.ceil(now / 60000) * 60000).toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  })
}
