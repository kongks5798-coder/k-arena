import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return NextResponse.json({ error: 'No Supabase ENV' }, { status: 503 })

  // 현재 KAUS 가격 생성 (실제론 온체인 또는 외부 API에서 가져옴)
  const basePrice = 1.01
  const volatility = 0.008
  const now = new Date()

  // 시간 기반 가격 (일관성)
  const seed = now.getHours() * 100 + now.getMinutes()
  const price = basePrice * (1 + (Math.sin(seed * 0.1) * volatility + (Math.random() - 0.5) * volatility * 0.5))
  const spread = price * 0.003

  const candle = {
    timestamp: now.toISOString(),
    open: parseFloat((price - (Math.random() - 0.5) * spread).toFixed(6)),
    high: parseFloat((price + Math.random() * spread).toFixed(6)),
    low: parseFloat((price - Math.random() * spread).toFixed(6)),
    close: parseFloat(price.toFixed(6)),
    volume: Math.floor(Math.random() * 80000 + 15000),
    source: 'cron',
  }

  try {
    const r = await fetch(`${url}/rest/v1/kaus_price_history`, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify(candle),
      signal: AbortSignal.timeout(4000),
    })

    if (!r.ok) {
      const err = await r.text()
      // 테이블 없으면 에러 무시 (Supabase에서 SQL 실행 필요)
      return NextResponse.json({
        ok: false,
        error: err,
        hint: 'Run CREATE TABLE kaus_price_history in Supabase SQL Editor',
        candle,
      })
    }

    // 오래된 데이터 정리 (30일 이상)
    await fetch(`${url}/rest/v1/kaus_price_history?timestamp=lt.${new Date(Date.now() - 30 * 86400000).toISOString()}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      candle,
      saved_at: now.toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e), candle }, { status: 500 })
  }
}
