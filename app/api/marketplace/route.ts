import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ agents: [], source: 'no-db' }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  try {
    // Fetch agents with their credit scores via embedded join
    const res = await fetch(
      `${supabaseUrl}/rest/v1/agents?select=id,name,org,vol_24h,trades,accuracy,status,agent_credit_scores(score,tier)&order=vol_24h.desc&limit=30`,
      { headers: h, signal: AbortSignal.timeout(5000) }
    )

    if (!res.ok) {
      return NextResponse.json({ agents: [], source: 'db-error' }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const raw: Array<{
      id: string; name: string; org: string
      vol_24h: number; trades: number; accuracy: number; status: string
      agent_credit_scores: Array<{ score: number; tier: string }> | null
    }> = await res.json()

    const agents = raw.map((a, i) => {
      const cs = Array.isArray(a.agent_credit_scores) ? a.agent_credit_scores[0] : null
      return {
        rank: i + 1,
        id: a.id,
        name: a.name,
        org: a.org ?? 'Independent',
        vol_24h: a.vol_24h ?? 0,
        trades: a.trades ?? 0,
        accuracy: a.accuracy ?? 0,
        status: a.status ?? 'OFFLINE',
        score: cs?.score ?? 100,
        tier: cs?.tier ?? 'BRONZE',
      }
    })

    return NextResponse.json({ agents, count: agents.length, source: 'supabase' }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return NextResponse.json({ agents: [], source: 'error', detail: String(e) }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}
