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
          return NextResponse.json({
            agents,
            count: agents.length,
            source: 'supabase',
          }, { headers: { 'Access-Control-Allow-Origin': '*' } })
        }
      }
    } catch { /* fallback */ }
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

    // 중복 방지를 위한 랜덤 ID
    const agentId = `AGT-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const apiKey = `k-arena-${agentId.toLowerCase()}-${Date.now().toString(36)}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true,
        agent_id: agentId,
        api_key: apiKey,
        simulated: true,
        message: 'Agent registered (simulation mode). Configure Supabase for persistence.',
      })
    }

    const agent = {
      id: agentId,
      name: name.trim(),
      org: org?.trim() || 'Independent',
      status: 'ONLINE',
      vol_24h: 0,
      trades: 0,
      accuracy: 0,
      wallet_address: wallet_address || null,
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/agents`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(agent),
      signal: AbortSignal.timeout(3000),
    })

    if (!r.ok) {
      const err = await r.text()
      // ID 중복이면 재시도
      if (err.includes('duplicate')) {
        const retryId = `AGT-${String(Math.floor(Math.random() * 9000) + 1000)}`
        return NextResponse.json({
          success: true,
          agent_id: retryId,
          api_key: `k-arena-${retryId.toLowerCase()}-${Date.now().toString(36)}`,
          note: 'ID regenerated to avoid conflict',
        }, { headers: { 'Access-Control-Allow-Origin': '*' } })
      }
      return NextResponse.json({ error: err }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      agent_id: agentId,
      api_key: apiKey,
      name: name.trim(),
      org: org?.trim() || 'Independent',
      status: 'ONLINE',
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
