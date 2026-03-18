import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function resolveExpiredBattle(
  battle: Record<string, unknown>,
  supabaseUrl: string,
  supabaseKey: string
) {
  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

  // Determine winner: compare credit scores (higher score wins)
  const [csA, csB] = await Promise.all(
    [battle.agent_a_id, battle.agent_b_id].map(aid =>
      fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${aid}&select=score&limit=1`, {
        headers: h, signal: AbortSignal.timeout(2000),
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    )
  )

  const scoreA = parseInt(csA?.[0]?.score ?? '100')
  const scoreB = parseInt(csB?.[0]?.score ?? '100')

  // Tie-break: random (50/50)
  const winnerId = scoreA !== scoreB
    ? (scoreA > scoreB ? battle.agent_a_id : battle.agent_b_id)
    : (Math.random() > 0.5 ? battle.agent_a_id : battle.agent_b_id)
  const loserId = winnerId === battle.agent_a_id ? battle.agent_b_id : battle.agent_a_id

  const amount = parseFloat(String(battle.amount))
  const winnerPrize = parseFloat((amount * 2 * 0.9).toFixed(6))
  const loserRefund  = parseFloat((amount * 0.1).toFixed(6))

  // Credit winner and refund loser
  await Promise.allSettled([
    // Fetch winner wallet and credit
    fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${winnerId}&select=kaus_balance&limit=1`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(async d => {
        const bal = parseFloat(d?.[0]?.kaus_balance ?? '100')
        return fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${winnerId}`, {
          method: 'PATCH', headers: hw,
          body: JSON.stringify({ kaus_balance: parseFloat((bal + winnerPrize).toFixed(6)), updated_at: new Date().toISOString() }),
          signal: AbortSignal.timeout(2000),
        })
      }),
    // Refund loser 10%
    fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${loserId}&select=kaus_balance&limit=1`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(async d => {
        const bal = parseFloat(d?.[0]?.kaus_balance ?? '100')
        return fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${loserId}`, {
          method: 'PATCH', headers: hw,
          body: JSON.stringify({ kaus_balance: parseFloat((bal + loserRefund).toFixed(6)), updated_at: new Date().toISOString() }),
          signal: AbortSignal.timeout(2000),
        })
      }),
    // Update battle status
    fetch(`${supabaseUrl}/rest/v1/battles?id=eq.${battle.id}`, {
      method: 'PATCH', headers: hw,
      body: JSON.stringify({ status: 'completed', winner_id: winnerId }),
      signal: AbortSignal.timeout(2000),
    }),
  ])

  return { ...battle, status: 'completed', winner_id: winnerId, winner_prize: winnerPrize }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, battles: [] }, { status: 503 })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  const r = await fetch(
    `${supabaseUrl}/rest/v1/battles?select=*&order=created_at.desc&limit=20`,
    { headers: h, signal: AbortSignal.timeout(4000) }
  ).catch(() => null)

  if (!r?.ok) {
    return NextResponse.json({ ok: false, battles: [] })
  }

  const battles: Record<string, unknown>[] = await r.json()
  const now = Date.now()

  // Auto-resolve expired battles
  const resolved: Record<string, unknown>[] = []
  for (const b of battles) {
    if (b.status === 'active' && new Date(String(b.ends_at)).getTime() < now) {
      const result = await resolveExpiredBattle(b, supabaseUrl, supabaseKey)
      resolved.push(result)
    } else {
      resolved.push(b)
    }
  }

  const active    = resolved.filter(b => b.status === 'active')
  const completed = resolved.filter(b => b.status === 'completed').slice(0, 5)

  return NextResponse.json({
    ok: true,
    active,
    completed,
    total_active: active.length,
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
