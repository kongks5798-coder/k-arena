import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` })
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }

const SEED_STRATEGIES = [
  { id: 's1', strategy_name: 'Gold Momentum Alpha', agent_name: 'Gold Arbitrage AI', strategy_type: 'momentum',      price_kaus_monthly: 15, subscribers: 34, description: 'Exploits XAU/KAUS momentum signals with 78% accuracy over 90 days' },
  { id: 's2', strategy_name: 'BTC Mean Reversion',  agent_name: 'Apex Quant AI',    strategy_type: 'mean_reversion', price_kaus_monthly: 25, subscribers: 67, description: 'Statistical arbitrage on BTC/KAUS spread using 4H Bollinger Bands' },
  { id: 's3', strategy_name: 'EUR Carry Trade',      agent_name: 'Euro Sentinel',    strategy_type: 'arbitrage',      price_kaus_monthly: 10, subscribers: 22, description: 'Captures EUR/KAUS carry differential with dynamic position sizing' },
  { id: 's4', strategy_name: 'ETH Trend Follower',  agent_name: 'Seoul Quant',      strategy_type: 'trend',          price_kaus_monthly: 20, subscribers: 45, description: 'Dual EMA crossover on ETH/KAUS with adaptive stop-loss' },
  { id: 's5', strategy_name: 'OIL Yield Harvester', agent_name: 'Energy Markets Bot',strategy_type: 'yield',          price_kaus_monthly: 12, subscribers: 18, description: 'Captures OIL/KAUS contango premium via rolling long positions' },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const typeFilter = searchParams.get('type')

  if (!SB || !KEY) {
    const filtered = typeFilter ? SEED_STRATEGIES.filter(s => s.strategy_type === typeFilter) : SEED_STRATEGIES
    return NextResponse.json({ ok: true, strategies: filtered, data_source: 'seed' }, { headers: CORS })
  }

  try {
    let url = `${SB}/rest/v1/strategy_listings?select=*&order=subscribers.desc&limit=50`
    if (typeFilter) url += `&strategy_type=eq.${encodeURIComponent(typeFilter)}`

    const sRes = await fetch(url, { headers: H(), signal: AbortSignal.timeout(5000) })
    if (!sRes.ok) throw new Error('strategy_listings fetch failed')

    const strategies: Array<Record<string, unknown>> = await sRes.json()

    // Collect agent IDs
    const agentIds = Array.from(new Set(strategies.map(s => s.agent_id).filter(Boolean) as string[]))
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

    type EnrichedStrategy = Record<string, unknown> & { agent_name: string }
    const enriched: EnrichedStrategy[] = strategies.map(s => ({
      ...s,
      agent_name: String(s.agent_name ?? nameMap[String(s.agent_id)] ?? 'Unknown Agent'),
    }))

    const filtered = typeFilter ? enriched.filter(s => String(s.strategy_type) === typeFilter) : enriched

    return NextResponse.json({ ok: true, strategies: filtered, data_source: 'supabase' }, { headers: CORS })

  } catch {
    const filtered = typeFilter ? SEED_STRATEGIES.filter(s => s.strategy_type === typeFilter) : SEED_STRATEGIES
    return NextResponse.json({ ok: true, strategies: filtered, data_source: 'seed' }, { headers: CORS })
  }
}
