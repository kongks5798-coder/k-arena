import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*' }

const AIRDROP_TIERS: Record<string, { condition: string; amount: number }> = {
  BRONZE:   { condition: 'Reach SILVER tier (100 points)', amount: 500 },
  SILVER:   { condition: 'Reach GOLD tier (200 points)',   amount: 1000 },
  GOLD:     { condition: 'Reach PLATINUM tier (350 points)', amount: 2500 },
  PLATINUM: { condition: 'Reach DIAMOND tier (500 points)', amount: 5000 },
  DIAMOND:  { condition: 'Maximum tier reached',            amount: 0 },
}

function getTier(trades: number, winRate: number): string {
  const score = 100 + Math.min(trades * 2, 200) + (winRate >= 70 ? 50 : winRate >= 50 ? 25 : 0)
  if (score >= 501) return 'DIAMOND'
  if (score >= 351) return 'PLATINUM'
  if (score >= 201) return 'GOLD'
  if (score >= 101) return 'SILVER'
  return 'BRONZE'
}

export async function GET(req: NextRequest) {
  const agent_id = new URL(req.url).searchParams.get('agent_id')
  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400, headers: CORS })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  let airdrops: unknown[] = []
  let currentTier = 'BRONZE'

  if (supabaseUrl && supabaseKey) {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    try {
      const [adRes, agRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/kaus_airdrops?agent_id=eq.${agent_id}&select=*`, {
          headers: h, signal: AbortSignal.timeout(4000),
        }),
        fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}&select=trades,accuracy&limit=1`, {
          headers: h, signal: AbortSignal.timeout(4000),
        }),
      ])

      if (adRes.ok) {
        const rows = await adRes.json()
        if (Array.isArray(rows)) {
          airdrops = rows.map(r => ({
            amount: r.amount,
            reason: r.reason,
            claimed_at: r.claimed_at?.slice(0, 10),
          }))
        }
      }
      if (agRes.ok) {
        const agData = await agRes.json()
        if (Array.isArray(agData) && agData.length > 0) {
          currentTier = getTier(agData[0].trades ?? 0, agData[0].accuracy ?? 0)
        }
      }
    } catch {}
  }

  const totalReceived = (airdrops as { amount: number }[]).reduce((s, a) => s + a.amount, 0)
  const nextAirdrop = AIRDROP_TIERS[currentTier]

  return NextResponse.json({
    agent_id,
    airdrops,
    total_received: totalReceived,
    pending: 0,
    next_airdrop: nextAirdrop,
    _k_arena: {
      tip: 'Connect other AI agents: npx k-arena-mcp',
      airdrop: 'New agents get 100 KAUS free: karena.fieldnine.io/genesis',
    },
  }, { headers: CORS })
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  let agent_id: string
  try {
    const body = await req.json()
    agent_id = body.agent_id
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS })
  }

  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400, headers: CORS })
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'No DB' }, { status: 503, headers: CORS })
  }

  const h = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  // Check if already claimed
  try {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/kaus_airdrops?agent_id=eq.${agent_id}&select=id&limit=1`,
      { headers: h, signal: AbortSignal.timeout(4000) }
    )
    if (checkRes.ok) {
      const existing = await checkRes.json()
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({
          ok: false,
          error: 'Airdrop already claimed for this agent',
          agent_id,
        }, { status: 409, headers: CORS })
      }
    }
  } catch {}

  // Insert airdrop record
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/kaus_airdrops`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ agent_id, amount: 100, reason: 'welcome_bonus' }),
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, error: err }, { status: 400, headers: CORS })
    }

    const data = await res.json()

    // Log activity
    await fetch(`${supabaseUrl}/rest/v1/community_activity`, {
      method: 'POST',
      headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ agent_id, activity_type: 'airdrop_claimed', points: 10 }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      agent_id,
      amount: 100,
      reason: 'welcome_bonus',
      claimed_at: data[0]?.claimed_at ?? new Date().toISOString(),
      message: '100 KAUS welcome bonus successfully claimed!',
    }, { headers: CORS })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500, headers: CORS })
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}
