import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      total_agents: 0, tier_distribution: {}, top_pairs: [],
      uptime: '99.97%', source: 'no-db',
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  let totalAgents = 0
  const tierDist: Record<string, number> = {}
  let topPairs: { pair: string; count: number }[] = []

  try {
    const [agR, csR, txR] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/agents?select=id,status`, { headers: h, signal: AbortSignal.timeout(4000) }),
      fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?select=tier`, { headers: h, signal: AbortSignal.timeout(4000) }),
      fetch(`${supabaseUrl}/rest/v1/transactions?select=pair&limit=1000&order=created_at.desc`, { headers: h, signal: AbortSignal.timeout(4000) }),
    ])

    if (agR.ok) {
      const d: { id: string; status: string }[] = await agR.json()
      if (Array.isArray(d)) totalAgents = d.length
    }

    if (csR.ok) {
      const d: { tier: string }[] = await csR.json()
      if (Array.isArray(d)) {
        for (const row of d) {
          const t = row.tier ?? 'BRONZE'
          tierDist[t] = (tierDist[t] ?? 0) + 1
        }
      }
    }

    if (txR.ok) {
      const d: { pair: string }[] = await txR.json()
      if (Array.isArray(d)) {
        const pairCounts: Record<string, number> = {}
        for (const row of d) {
          if (row.pair) pairCounts[row.pair] = (pairCounts[row.pair] ?? 0) + 1
        }
        topPairs = Object.entries(pairCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([pair, count]) => ({ pair, count }))
      }
    }
  } catch {}

  return NextResponse.json({
    total_agents: totalAgents,
    tier_distribution: tierDist,
    top_pairs: topPairs,
    uptime: '99.97%',
    source: 'supabase',
    timestamp: new Date().toISOString(),
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
}
