import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

// 30일 이상 된 트랜잭션 삭제 — DB 무한 성장 방지
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = SB(); const key = KEY()
  if (!sb || !key) return NextResponse.json({ ok: false, reason: 'no-db' })

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // 삭제 전 카운트
    const countRes = await fetch(
      `${sb}/rest/v1/transactions?created_at=lt.${cutoff}&select=id`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      }
    )
    const countHeader = countRes.headers.get('content-range') ?? '0'
    const total = parseInt(countHeader.split('/')[1] ?? '0', 10)

    if (total === 0) {
      return NextResponse.json({ ok: true, deleted: 0, reason: 'nothing-to-clean', cutoff })
    }

    // 삭제 실행
    const delRes = await fetch(
      `${sb}/rest/v1/transactions?created_at=lt.${cutoff}`,
      {
        method: 'DELETE',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=minimal',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      }
    )

    if (!delRes.ok && delRes.status !== 204) {
      return NextResponse.json({ ok: false, reason: 'delete-failed', status: delRes.status })
    }

    return NextResponse.json({
      ok: true,
      deleted: total,
      cutoff,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
