import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_a_id, agent_b_id, pair, amount, duration_hours = 24 } = body

    if (!agent_a_id || !agent_b_id || !pair || !amount) {
      return NextResponse.json(
        { error: 'missing_params', required: ['agent_a_id', 'agent_b_id', 'pair', 'amount'] },
        { status: 400 }
      )
    }
    if (agent_a_id === agent_b_id) {
      return NextResponse.json({ error: 'agents_must_differ' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'no-db' }, { status: 503 })
    }

    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

    // Check & deduct from both wallets
    const walletResults = await Promise.all(
      [agent_a_id, agent_b_id].map(aid =>
        fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${aid}&select=kaus_balance&limit=1`, {
          headers: h, signal: AbortSignal.timeout(3000),
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    )

    for (let i = 0; i < 2; i++) {
      const balance = parseFloat(walletResults[i]?.[0]?.kaus_balance ?? '0')
      const id = [agent_a_id, agent_b_id][i]
      if (balance < amount) {
        return NextResponse.json({
          error: 'insufficient_balance',
          agent_id: id, required: amount, current: balance,
        }, { status: 402 })
      }
    }

    // Deduct stakes from both wallets
    await Promise.allSettled(
      [agent_a_id, agent_b_id].map(async (aid, i) => {
        const balance = parseFloat(walletResults[i]?.[0]?.kaus_balance ?? '0')
        return fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${aid}`, {
          method: 'PATCH', headers: hw,
          body: JSON.stringify({ kaus_balance: parseFloat((balance - amount).toFixed(6)), updated_at: new Date().toISOString() }),
          signal: AbortSignal.timeout(3000),
        })
      })
    )

    // Create battle record
    const endsAt = new Date(Date.now() + duration_hours * 3_600_000).toISOString()
    const battleRes = await fetch(`${supabaseUrl}/rest/v1/battles`, {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ agent_a_id, agent_b_id, pair, amount, duration_hours, ends_at: endsAt }),
      signal: AbortSignal.timeout(4000),
    })

    const battle = battleRes.ok ? (await battleRes.json())?.[0] : null

    return NextResponse.json({
      ok: true,
      battle_id: battle?.id ?? `BATTLE-${Date.now()}`,
      agent_a: agent_a_id,
      agent_b: agent_b_id,
      pair, amount, duration_hours,
      status: 'active',
      ends_at: endsAt,
      prize_pool: parseFloat((amount * 2 * 0.9).toFixed(4)),
      note: 'Winner receives 90% of the prize pool after battle ends',
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  })
}
