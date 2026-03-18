import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KAUS_PRICE = 1.0000 // 고정 페그 — 거래소 상장 전

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return NextResponse.json({ error: 'No Supabase ENV' }, { status: 503 })

  const now = new Date()

  // 실거래 기반 volume 집계 (가짜 랜덤 없음)
  let volume = 0
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 지난 1시간
    const txR = await fetch(
      `${url}/rest/v1/transactions?select=amount&created_at=gte.${since}&pair=eq.USD/KAUS`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      }
    )
    if (txR.ok) {
      const txs = await txR.json()
      if (Array.isArray(txs)) volume = txs.reduce((s: number, t: { amount: number }) => s + (t.amount || 0), 0)
    }
  } catch { /* volume = 0 유지 */ }

  const candle = {
    timestamp: now.toISOString(),
    open: KAUS_PRICE,
    high: KAUS_PRICE,
    low: KAUS_PRICE,
    close: KAUS_PRICE,
    volume: Math.floor(volume),
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
      return NextResponse.json({
        ok: false,
        error: err,
        hint: 'Run CREATE TABLE kaus_price_history in Supabase SQL Editor',
        candle,
      })
    }

    // 30일 이상 오래된 데이터 정리
    await fetch(
      `${url}/rest/v1/kaus_price_history?timestamp=lt.${new Date(Date.now() - 30 * 86400000).toISOString()}`,
      {
        method: 'DELETE',
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }
    ).catch(() => {})

    return NextResponse.json({ ok: true, candle, saved_at: now.toISOString() })
  } catch (e) {
    return NextResponse.json({ error: String(e), candle }, { status: 500 })
  }
}
