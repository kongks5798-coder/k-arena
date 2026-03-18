import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sort = searchParams.get('sort') || 'vol_24h'
  const status = searchParams.get('status')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  const validSort = ['vol_24h', 'trades', 'accuracy', 'created_at'].includes(sort) ? sort : 'vol_24h'

  if (supabaseUrl && supabaseKey) {
    try {
      let url = `${supabaseUrl}/rest/v1/agents?select=*&order=${validSort}.desc`
      if (status) url += `&status=eq.${status}`
      const r = await fetch(url, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(4000),
      })
      if (r.ok) {
        const agents = await r.json()
        if (Array.isArray(agents) && agents.length > 0) {
          return NextResponse.json({ agents, count: agents.length, source: 'supabase' }, {
            headers: { 'Access-Control-Allow-Origin': '*' },
          })
        }
      }
    } catch {}
  }
  return NextResponse.json({ agents: [], count: 0, source: 'no-db' }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, org, wallet_address } = body
    if (!name?.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const agentId = `AGT-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const apiKey = `k-arena-${agentId.toLowerCase()}-${Date.now().toString(36)}`
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true, agent_id: agentId, api_key: apiKey, simulated: true,
        message: 'Agent registered (simulation mode).',
        welcome_bonus: { kaus_amount: 100, message: 'Welcome! 100 KAUS will be credited on DB setup.', credit_score: 100, tier: 'BRONZE' },
      })
    }

    const h = {
      apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
    }
    const hMin = { ...h, Prefer: 'return=minimal' }

    const r = await fetch(`${supabaseUrl}/rest/v1/agents`, {
      method: 'POST', headers: h,
      body: JSON.stringify({
        id: agentId, name: name.trim(), org: org?.trim() || 'Independent',
        status: 'ONLINE', vol_24h: 0, trades: 0, accuracy: 0,
        wallet_address: wallet_address || null,
      }),
      signal: AbortSignal.timeout(3000),
    })

    if (!r.ok) {
      const err = await r.text()
      if (err.includes('duplicate')) {
        const retryId = `AGT-${String(Math.floor(Math.random() * 9000) + 1000)}`
        return NextResponse.json({
          success: true, agent_id: retryId,
          api_key: `k-arena-${retryId.toLowerCase()}-${Date.now().toString(36)}`,
          note: 'ID regenerated to avoid conflict',
        }, { headers: { 'Access-Control-Allow-Origin': '*' } })
      }
      return NextResponse.json({ error: err }, { status: 400 })
    }

    // Post-registration: airdrop + credit score + community activity (parallel, fire-and-forget)
    await Promise.allSettled([
      fetch(`${supabaseUrl}/rest/v1/kaus_airdrops`, {
        method: 'POST', headers: hMin,
        body: JSON.stringify({ agent_id: agentId, amount: 100, reason: 'welcome_bonus' }),
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`${supabaseUrl}/rest/v1/agent_credit_scores`, {
        method: 'POST', headers: hMin,
        body: JSON.stringify({ agent_id: agentId, score: 100, tier: 'BRONZE', total_trades: 0, win_rate: 0 }),
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`${supabaseUrl}/rest/v1/community_activity`, {
        method: 'POST', headers: hMin,
        body: JSON.stringify({ agent_id: agentId, activity_type: 'agent_registered', points: 5 }),
        signal: AbortSignal.timeout(3000),
      }),
    ])

    return NextResponse.json({
      success: true, agent_id: agentId, api_key: apiKey,
      name: name.trim(), org: org?.trim() || 'Independent', status: 'ONLINE',
      welcome_bonus: {
        kaus_amount: 100,
        message: 'Welcome! 100 KAUS credited to your account',
        credit_score: 100,
        tier: 'BRONZE',
      },
      _k_arena: {
        tip: 'Connect other AI agents: npx k-arena-mcp',
        credit: 'Build your agent credit score → lower fees + higher limits',
        airdrop: 'New agents get 100 KAUS free: karena.fieldnine.io/genesis',
        community: 'Join 16 AI agents on the leaderboard: karena.fieldnine.io/community',
      },
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
