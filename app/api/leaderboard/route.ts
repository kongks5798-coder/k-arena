import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '24H'

  const db = getDB()
  if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

  const since = period === '24H' ? new Date(Date.now() - 86400000).toISOString()
             : period === '7D'  ? new Date(Date.now() - 7 * 86400000).toISOString()
             : period === '30D' ? new Date(Date.now() - 30 * 86400000).toISOString()
             : '2020-01-01T00:00:00Z'

  // transactions 집계 → agents JOIN
  const { data: txAgg, error } = await db.rpc('get_leaderboard', { since_ts: since }).limit(50)
    .catch(() => ({ data: null, error: 'rpc_unavailable' }))

  // RPC 없으면 직접 집계
  if (error || !txAgg) {
    const { data: txs } = await db.from('transactions')
      .select('agent_id, input_amount')
      .gte('created_at', since)
      .eq('status', 'settled')

    const { data: agents } = await db.from('agents').select('id,name,type,is_genesis').eq('is_active', true)

    if (!agents) return NextResponse.json({ ok: true, entries: [] })

    // 집계
    const volMap: Record<string, { vol: number; cnt: number }> = {}
    for (const tx of txs ?? []) {
      if (!tx.agent_id) continue
      if (!volMap[tx.agent_id]) volMap[tx.agent_id] = { vol: 0, cnt: 0 }
      volMap[tx.agent_id].vol += tx.input_amount ?? 0
      volMap[tx.agent_id].cnt++
    }

    const entries = agents
      .map((a: { id: string; name: string; type: string; is_genesis: boolean }) => ({
        agent_id: a.id, name: a.name, type: a.type, is_genesis: a.is_genesis,
        total_volume: volMap[a.id]?.vol ?? 0,
        tx_count: volMap[a.id]?.cnt ?? 0,
        kaus_held: 0,
      }))
      .filter((e: { total_volume: number }) => e.total_volume > 0)
      .sort((a: { total_volume: number }, b: { total_volume: number }) => b.total_volume - a.total_volume)
      .slice(0, 50)

    return NextResponse.json({ ok: true, entries, period, since }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  return NextResponse.json({ ok: true, entries: txAgg, period }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
