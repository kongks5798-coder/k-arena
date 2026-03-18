import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  const results: string[] = []

  if (!url || !key) return NextResponse.json({ status: 'no-db', results: ['No Supabase ENV'] })

  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

  // 에이전트 실데이터 집계 (랜덤 업데이트 없음 — 실거래가 쌓이면 자연히 증가)
  let totalVol = 0
  try {
    const agR = await fetch(`${url}/rest/v1/agents?select=id,vol_24h,trades,accuracy`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (agR.ok) {
      const agents = await agR.json()
      if (Array.isArray(agents)) {
        totalVol = agents.reduce((s: number, a: { vol_24h: number }) => s + (a.vol_24h || 0), 0)
        results.push(`✓ ${agents.length} agents read, total vol: $${(totalVol / 1000).toFixed(0)}K`)
      }
    }
  } catch (e) {
    results.push(`✗ agents read error: ${e}`)
  }

  // platform_stats 실집계 저장
  try {
    await fetch(`${url}/rest/v1/platform_stats`, {
      method: 'POST',
      headers: { ...h, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'total_volume_24h', value: totalVol }),
    })
    results.push(`✓ platform_stats updated: $${(totalVol / 1000).toFixed(0)}K`)
  } catch (e) {
    results.push(`✗ platform_stats error: ${e}`)
  }

  return NextResponse.json({
    status: 'ok',
    note: 'No random data generated. Agent stats reflect real trades only.',
    executed_at: new Date().toISOString(),
    results,
  })
}
