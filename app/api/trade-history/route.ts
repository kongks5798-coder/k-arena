import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const pair = searchParams.get('pair')
  const direction = searchParams.get('direction')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset = parseInt(searchParams.get('offset') || '0')
  const from = searchParams.get('from') // ISO date
  const to = searchParams.get('to')     // ISO date

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (url && key) {
    try {
      let endpoint = `${url}/rest/v1/transactions?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`
      if (pair) endpoint += `&pair=eq.${encodeURIComponent(pair)}`
      if (direction) endpoint += `&direction=eq.${direction}`
      if (from) endpoint += `&created_at=gte.${from}`
      if (to) endpoint += `&created_at=lte.${to}`

      // 전체 카운트도 가져오기
      const [dataR, countR] = await Promise.all([
        fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(4000) }),
        fetch(`${url}/rest/v1/transactions?select=id${pair ? `&pair=eq.${encodeURIComponent(pair)}` : ''}`, {
          headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
          signal: AbortSignal.timeout(3000),
        }),
      ])

      if (dataR.ok) {
        const data = await dataR.json()
        const totalCount = countR.headers.get('content-range')?.split('/')[1] || String(data.length)

        if (Array.isArray(data)) {
          // 통계 계산
          const totalVol = data.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.amount) || 0), 0)
          const totalFees = data.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.fee) || 0), 0)
          const buys = data.filter((t: Record<string, unknown>) => t.direction === 'BUY').length
          const sells = data.filter((t: Record<string, unknown>) => t.direction === 'SELL').length

          return NextResponse.json({
            transactions: data,
            stats: {
              count: data.length,
              total_count: parseInt(totalCount),
              total_volume: parseFloat(totalVol.toFixed(2)),
              total_fees: parseFloat(totalFees.toFixed(2)),
              buys,
              sells,
              buy_ratio: data.length > 0 ? parseFloat((buys / data.length * 100).toFixed(1)) : 0,
              avg_size: data.length > 0 ? parseFloat((totalVol / data.length).toFixed(2)) : 0,
            },
            pagination: { limit, offset, has_more: offset + data.length < parseInt(totalCount) },
            source: 'supabase',
          }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
        }
      }
    } catch { /* fallback */ }
  }

  return NextResponse.json({
    transactions: [],
    stats: { count: 0, total_count: 0, total_volume: 0, total_fees: 0, buys: 0, sells: 0 },
    source: 'no-db',
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
