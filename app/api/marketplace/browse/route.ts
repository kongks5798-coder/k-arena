import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const strategy_type = searchParams.get('type')
  const sort = searchParams.get('sort') ?? 'subscribers'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, listings: [] }, { status: 503 })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  const validSort = ['subscribers', 'price_kaus_monthly', 'created_at'].includes(sort) ? sort : 'created_at'
  let url = `${supabaseUrl}/rest/v1/strategy_listings?select=*&is_active=eq.true&order=${validSort}.desc&limit=50`
  if (strategy_type) url += `&strategy_type=eq.${encodeURIComponent(strategy_type)}`

  const [listRes, subRes] = await Promise.all([
    fetch(url, { headers: h, signal: AbortSignal.timeout(4000) }).catch(() => null),
    fetch(`${supabaseUrl}/rest/v1/strategy_subscriptions?select=strategy_id`, {
      headers: h, signal: AbortSignal.timeout(3000),
    }).catch(() => null),
  ])

  if (!listRes?.ok) return NextResponse.json({ ok: false, listings: [] })

  const listings = await listRes.json()

  // Count subscribers per strategy
  const subCounts: Record<string, number> = {}
  if (subRes?.ok) {
    const subs = await subRes.json()
    if (Array.isArray(subs)) {
      for (const s of subs) {
        subCounts[s.strategy_id] = (subCounts[s.strategy_id] ?? 0) + 1
      }
    }
  }

  // Enrich with agent names
  const agentIds = Array.from(new Set((listings as Record<string, unknown>[]).map(l => l.agent_id)))
  let agentNames: Record<string, string> = {}
  if (agentIds.length) {
    const agRes = await fetch(
      `${supabaseUrl}/rest/v1/agents?id=in.(${agentIds.join(',')})&select=id,name`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    ).catch(() => null)
    if (agRes?.ok) {
      const ags = await agRes.json()
      if (Array.isArray(ags)) agentNames = Object.fromEntries(ags.map((a: { id: string; name: string }) => [a.id, a.name]))
    }
  }

  const enriched = (listings as Record<string, unknown>[]).map(l => ({
    ...l,
    subscribers: subCounts[String(l.id)] ?? 0,
    agent_name: agentNames[String(l.agent_id)] ?? 'Unknown',
  }))

  return NextResponse.json({
    ok: true, listings: enriched, count: enriched.length,
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
