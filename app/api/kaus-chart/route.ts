import { NextResponse, NextRequest } from 'next/server'

// KAUS = $1.00 고정 페그 — 가짜 시뮬레이션 없음
function buildFlatHistory(hours: number) {
  const now = Date.now()
  const history = []
  for (let i = hours; i >= 0; i--) {
    const ts = now - i * 3600000
    history.push({
      timestamp: new Date(ts).toISOString(),
      time: Math.floor(ts / 1000),
      open: 1.0000, high: 1.0000, low: 1.0000, close: 1.0000, volume: 0,
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

  // 폴백: 고정 $1.00 페그 데이터 (가짜 시뮬레이션 없음)
  const history = buildFlatHistory(hours)

  return NextResponse.json({
    symbol: 'KAUS/USD',
    period,
    current_price: 1.0000,
    open_price: 1.0000,
    change_pct: 0,
    high: 1.0000,
    low: 1.0000,
    volume_24h: 0,
    history,
    source: 'peg',
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
}
