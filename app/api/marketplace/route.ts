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
    // Fetch agents and credit scores in parallel (no embedded join needed)
    const [agR, csR] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/agents?select=id,name,org,vol_24h,trades,accuracy,status&order=vol_24h.desc&limit=30`, {
        headers: h, signal: AbortSignal.timeout(5000),
      }),
      fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?select=agent_id,score,tier`, {
        headers: h, signal: AbortSignal.timeout(5000),
      }),
    ])

    if (!agR.ok) {
      return NextResponse.json({ agents: [], source: 'db-error', detail: agR.status }, {
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    const agData: Array<{
      id: string; name: string; org: string
      vol_24h: number; trades: number; accuracy: number; status: string
    }> = await agR.json()

    // Build a map of credit scores keyed by agent_id
    const csMap: Record<string, { score: number; tier: string }> = {}
    if (csR.ok) {
      const csData: Array<{ agent_id: string; score: number; tier: string }> = await csR.json()
      if (Array.isArray(csData)) {
        for (const row of csData) csMap[row.agent_id] = { score: row.score ?? 100, tier: row.tier ?? 'BRONZE' }
      }
    }

    const agents = (Array.isArray(agData) ? agData : []).map((a, i) => ({
      rank: i + 1,
      id: a.id,
      name: a.name ?? 'Unknown Agent',
      org: a.org ?? 'Independent',
      vol_24h: a.vol_24h ?? 0,
      trades: a.trades ?? 0,
      accuracy: a.accuracy ?? 0,
      status: a.status ?? 'OFFLINE',
      score: csMap[a.id]?.score ?? 100,
      tier: csMap[a.id]?.tier ?? 'BRONZE',
    }))

    return NextResponse.json({ agents, count: agents.length, source: 'supabase' }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return NextResponse.json({ agents: [], source: 'error', detail: String(e) }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  }
}
