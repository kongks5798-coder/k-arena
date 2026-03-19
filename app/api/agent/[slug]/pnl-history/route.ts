import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` })
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Generate seed chart data for fallback
function seedData(initialBalance: number, pnl: number, points = 24) {
  const now = Date.now()
  const data = []
  const finalBalance = initialBalance * (1 + pnl / 100)
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 3600000).toISOString()
    const progress = (points - 1 - i) / (points - 1)
    const noise = 1 + (Math.sin(i * 2.1 + 0.3) * 0.02)
    const balance = initialBalance + (finalBalance - initialBalance) * progress * noise
    data.push({ snapshotted_at: t, kaus_balance: parseFloat(balance.toFixed(4)), pnl_percent: parseFloat(((balance - initialBalance) / initialBalance * 100).toFixed(2)) })
  }
  return data
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { slug } = params

  if (!SB || !KEY) {
    return NextResponse.json({ ok: true, data: seedData(100, 50), data_source: 'seed' }, { headers: CORS })
  }

  try {
    // 1. Find agent by slug (match name → slug)
    const agRes = await fetch(
      `${SB}/rest/v1/agents?select=id,name,initial_balance,pnl_percent&limit=100`,
      { headers: H(), signal: AbortSignal.timeout(4000) }
    )
    if (!agRes.ok) throw new Error('agents fetch failed')

    const agents: Array<{ id: string; name: string; initial_balance: number; pnl_percent: number }> = await agRes.json()
    const agent = agents.find(a => toSlug(a.name) === slug)

    if (!agent) {
      return NextResponse.json({ ok: false, error: 'agent_not_found' }, { status: 404, headers: CORS })
    }

    // 2. Fetch pnl_snapshots for this agent (last 7 days, max 200 points)
    const since = new Date(Date.now() - 7 * 24 * 3600000).toISOString()
    const snapRes = await fetch(
      `${SB}/rest/v1/pnl_snapshots?agent_id=eq.${agent.id}&snapshotted_at=gte.${since}&select=kaus_balance,pnl_percent,snapshotted_at&order=snapshotted_at.asc&limit=200`,
      { headers: H(), signal: AbortSignal.timeout(5000) }
    )

    if (!snapRes.ok) throw new Error('pnl_snapshots fetch failed')

    const snaps: Array<{ kaus_balance: number; pnl_percent: number; snapshotted_at: string }> = await snapRes.json()

    if (!Array.isArray(snaps) || snaps.length < 2) {
      // Not enough data — return seed chart based on real PnL
      const init = agent.initial_balance ?? 100
      const pnl  = agent.pnl_percent ?? 0
      return NextResponse.json({
        ok: true,
        agent_name: agent.name,
        data: seedData(init, pnl),
        data_source: 'seed',
      }, { headers: CORS })
    }

    const cleaned = snaps.map(s => ({
      snapshotted_at: s.snapshotted_at,
      kaus_balance:   parseFloat(String(s.kaus_balance)),
      pnl_percent:    parseFloat(String(s.pnl_percent)),
    }))

    return NextResponse.json({
      ok: true,
      agent_name: agent.name,
      data: cleaned,
      data_source: 'supabase',
    }, { headers: CORS })

  } catch {
    return NextResponse.json({ ok: true, data: seedData(100, 50), data_source: 'seed' }, { headers: CORS })
  }
}
