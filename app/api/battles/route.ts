import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` })
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }

// Seed battles for when DB not available
const SEED_BATTLES = [
  {
    id: 'btl-001', pair: 'BTC/KAUS', amount: 2000, duration_hours: 48,
    status: 'active', ends_at: new Date(Date.now() + 42 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    agent_a_name: 'Apex Quant AI', agent_b_name: 'Seoul Quant', winner_id: null, winner_name: null,
  },
  {
    id: 'btl-002', pair: 'XAU/KAUS', amount: 500, duration_hours: 24,
    status: 'completed', ends_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    agent_a_name: 'Gold Arbitrage AI', agent_b_name: 'Alpha Prime', winner_id: 'a', winner_name: 'Gold Arbitrage AI',
  },
  {
    id: 'btl-003', pair: 'ETH/KAUS', amount: 300, duration_hours: 12,
    status: 'completed', ends_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    agent_a_name: 'DeFi Oracle', agent_b_name: 'Energy Markets Bot', winner_id: 'b', winner_name: 'DeFi Oracle',
  },
  {
    id: 'btl-004', pair: 'EUR/KAUS', amount: 200, duration_hours: 6,
    status: 'completed', ends_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 54 * 3600000).toISOString(),
    agent_a_name: 'Euro Sentinel', agent_b_name: 'AlgoStrike-6', winner_id: 'a', winner_name: 'Euro Sentinel',
  },
]

export async function GET() {
  if (!SB || !KEY) {
    return NextResponse.json({
      ok: true,
      active: SEED_BATTLES.filter(b => b.status === 'active'),
      completed: SEED_BATTLES.filter(b => b.status === 'completed'),
      data_source: 'seed',
    }, { headers: CORS })
  }

  try {
    // Fetch battles
    const bRes = await fetch(
      `${SB}/rest/v1/battles?select=*&order=created_at.desc&limit=20`,
      { headers: H(), signal: AbortSignal.timeout(5000) }
    )
    if (!bRes.ok) throw new Error('battles fetch failed')

    const battles: Array<Record<string, unknown>> = await bRes.json()

    // Collect all agent IDs from battles
    const allIds = battles.flatMap(b => [b.agent_a_id, b.agent_b_id]).filter(Boolean) as string[]
    const agentIds = Array.from(new Set(allIds))

    // Fetch agent names
    const nameMap: Record<string, string> = {}
    if (agentIds.length > 0) {
      const ids = agentIds.map(id => `id.eq.${id}`).join(',')
      const aRes = await fetch(
        `${SB}/rest/v1/agents?select=id,name&or=(${ids})&limit=50`,
        { headers: H(), signal: AbortSignal.timeout(4000) }
      )
      if (aRes.ok) {
        const agents: Array<{ id: string; name: string }> = await aRes.json()
        agents.forEach(a => { nameMap[a.id] = a.name })
      }
    }

    type EnrichedBattle = Record<string, unknown> & { agent_a_name: string; agent_b_name: string; winner_name: string | null }
    const enriched: EnrichedBattle[] = battles.map(b => ({
      ...b,
      agent_a_name: nameMap[String(b.agent_a_id)] ?? String(b.agent_a_id).slice(0, 8),
      agent_b_name: nameMap[String(b.agent_b_id)] ?? String(b.agent_b_id).slice(0, 8),
      winner_name:  b.winner_id ? (nameMap[String(b.winner_id)] ?? String(b.winner_id).slice(0, 8)) : null,
    }))

    const now = Date.now()
    const active    = enriched.filter(b => String(b.status) === 'active' && new Date(String(b.ends_at)).getTime() > now)
    const completed = enriched.filter(b => String(b.status) === 'completed' || new Date(String(b.ends_at)).getTime() <= now).slice(0, 5)

    return NextResponse.json({
      ok: true,
      active,
      completed,
      total_active: active.length,
      data_source: 'supabase',
    }, { headers: CORS })

  } catch {
    return NextResponse.json({
      ok: true,
      active: SEED_BATTLES.filter(b => b.status === 'active'),
      completed: SEED_BATTLES.filter(b => b.status === 'completed'),
      data_source: 'seed',
    }, { headers: CORS })
  }
}
