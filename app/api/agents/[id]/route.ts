import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (url && key) {
    const h = { apikey: key, Authorization: `Bearer ${key}` }
    try {
      const [agR, txR, gnR] = await Promise.all([
        fetch(`${url}/rest/v1/agents?id=eq.${id}&select=*`, { headers: h, signal: AbortSignal.timeout(3000) }),
        fetch(`${url}/rest/v1/transactions?agent_id=eq.${id}&select=*&order=created_at.desc&limit=50`, { headers: h, signal: AbortSignal.timeout(3000) }),
        fetch(`${url}/rest/v1/genesis_members?agent_id=eq.${id}&select=membership_number`, { headers: h, signal: AbortSignal.timeout(2000) }),
      ])

      const agents = agR.ok ? await agR.json() : []
      const txs = txR.ok ? await txR.json() : []
      const genesis = gnR.ok ? await gnR.json() : []

      if (!Array.isArray(agents) || agents.length === 0) {
        return NextResponse.json({ error: `Agent ${id} not found` }, { status: 404 })
      }

      const agent = agents[0]
      const txList = Array.isArray(txs) ? txs : []

      // 페어별 성과
      const pairMap: Record<string, { trades: number; volume: number; buys: number }> = {}
      txList.forEach((tx: Record<string, unknown>) => {
        const p = String(tx.pair)
        if (!pairMap[p]) pairMap[p] = { trades: 0, volume: 0, buys: 0 }
        pairMap[p].trades++
        pairMap[p].volume += Number(tx.amount) || 0
        if (tx.direction === 'BUY') pairMap[p].buys++
      })

      return NextResponse.json({
        agent,
        transactions: txList.slice(0, 20),
        stats: {
          total_trades: txList.length,
          total_volume: txList.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.amount) || 0), 0),
          total_fees: txList.reduce((s: number, t: Record<string, unknown>) => s + (Number(t.fee) || 0), 0),
          best_pair: Object.entries(pairMap).sort((a, b) => b[1].volume - a[1].volume)[0]?.[0] || null,
        },
        pair_breakdown: Object.entries(pairMap).map(([pair, s]) => ({ pair, ...s })).sort((a, b) => b.volume - a.volume),
        genesis_member: Array.isArray(genesis) && genesis.length > 0 ? genesis[0].membership_number : null,
        source: 'supabase',
      }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })

    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return NextResponse.json({ error: 'No Supabase' }, { status: 503 })

  try {
    const body = await req.json()
    // 허용된 필드만 업데이트
    const allowed = ['name', 'org', 'status', 'wallet_address']
    const update: Record<string, unknown> = {}
    allowed.forEach(f => { if (body[f] !== undefined) update[f] = body[f] })
    update.last_seen = new Date().toISOString()

    const r = await fetch(`${url}/rest/v1/agents?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json', Prefer: 'return=representation',
      },
      body: JSON.stringify(update),
      signal: AbortSignal.timeout(3000),
    })

    if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: r.status })
    const data = await r.json()
    return NextResponse.json({ ok: true, agent: data[0] }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
