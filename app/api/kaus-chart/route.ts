import { NextResponse, NextRequest } from 'next/server'

// 시간 기반 일관된 가격 시뮬레이션
function generatePriceHistory(hours = 24) {
  const now = Date.now()
  const history = []
  let price = 1.0041
  let trend = 0

  for (let i = hours; i >= 0; i--) {
    const ts = now - i * 3600000
    // 트렌드 랜덤워크
    trend += (Math.random() - 0.5) * 0.001
    trend = Math.max(-0.005, Math.min(0.005, trend)) // 트렌드 클리핑
    price += trend + (Math.random() - 0.5) * 0.003
    price = Math.max(0.95, Math.min(1.08, price)) // 가격 범위 제한

    history.push({
      timestamp: new Date(ts).toISOString(),
      time: Math.floor(ts / 1000),
      open: parseFloat(price.toFixed(4)),
      high: parseFloat((price * (1 + Math.random() * 0.005)).toFixed(4)),
      low: parseFloat((price * (1 - Math.random() * 0.005)).toFixed(4)),
      close: parseFloat((price + (Math.random() - 0.5) * 0.002).toFixed(4)),
      volume: Math.floor(Math.random() * 100000 + 20000),
    })
  }
  return history
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '24h'
  const hours = period === '7d' ? 168 : period === '30d' ? 720 : 24

  // Supabase에서 실제 가격 히스토리 시도
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (url && key) {
    try {
      const since = new Date(Date.now() - hours * 3600000).toISOString()
      const r = await fetch(`${url}/rest/v1/kaus_price_history?select=*&timestamp=gte.${since}&order=timestamp.asc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      })
      if (r.ok) {
        const data = await r.json()
        if (Array.isArray(data) && data.length > 10) {
          const current = data[data.length - 1]
          const open = data[0].close || data[0].open
          const change = parseFloat(((current.close - open) / open * 100).toFixed(2))
          return NextResponse.json({
            symbol: 'KAUS/USD',
            period,
            current_price: current.close,
            open_price: open,
            change_pct: change,
            high: Math.max(...data.map((d: {high:number}) => d.high)),
            low: Math.min(...data.map((d: {low:number}) => d.low)),
            history: data,
            source: 'supabase',
          }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
        }
      }
    } catch { /* fallback */ }
  }

  // 시뮬레이션 폴백
  const history = generatePriceHistory(hours)
  const current = history[history.length - 1].close
  const open = history[0].open
  const change = parseFloat(((current - open) / open * 100).toFixed(2))

  return NextResponse.json({
    symbol: 'KAUS/USD',
    period,
    current_price: current,
    open_price: open,
    change_pct: change,
    high: Math.max(...history.map(h => h.high)),
    low: Math.min(...history.map(h => h.low)),
    volume_24h: history.slice(-24).reduce((s, h) => s + h.volume, 0),
    history,
    source: 'simulation',
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
}
