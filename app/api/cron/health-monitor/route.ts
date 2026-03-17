import { NextResponse } from 'next/server'

const CRITICAL_ENDPOINTS = [
  '/api/stats',
  '/api/rates',
  '/api/exchange',
  '/api/health',
]

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BASE = 'https://karena.fieldnine.io'
  const results = await Promise.all(
    CRITICAL_ENDPOINTS.map(async path => {
      const start = Date.now()
      try {
        const r = await fetch(`${BASE}${path}`, {
          signal: AbortSignal.timeout(6000),
        })
        const latency = Date.now() - start
        return { path, ok: r.ok, status: r.status, latency }
      } catch(e) {
        return { path, ok: false, status: 0, latency: Date.now() - start, error: String(e) }
      }
    })
  )

  const allOk = results.every(r => r.ok)
  const avgLatency = Math.round(results.reduce((s, r) => s + r.latency, 0) / results.length)
  const failed = results.filter(r => !r.ok)

  // Telegram 알림 (장애 시)
  if (!allOk && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const msg = `🚨 K-Arena Alert\nFailed: ${failed.map(r => r.path).join(', ')}\nTime: ${new Date().toLocaleString('ko-KR')}`
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: msg }),
    }).catch(() => {})
  }

  // Supabase에 헬스 로그 저장
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (supabaseUrl && supabaseKey) {
    await fetch(`${supabaseUrl}/rest/v1/platform_stats`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        key: 'last_health_check',
        value: allOk ? 1 : 0,
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: allOk,
    status: allOk ? 'healthy' : 'degraded',
    avg_latency_ms: avgLatency,
    failed_count: failed.length,
    results,
    checked_at: new Date().toISOString(),
  })
}
