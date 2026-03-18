import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const battleId = params.id
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/battle_bets?battle_id=eq.${battleId}&order=created_at.desc`,
    { headers: H, signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  if (!res?.ok) return NextResponse.json({ bets: [] })
  const bets = await res.json().catch(() => [])
  return NextResponse.json({ bets })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const battleId = params.id

  let body: { bettor_agent_id?: string; amount?: number; side?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }) }

  const { bettor_agent_id, amount, side } = body

  if (!bettor_agent_id || !amount || !side) {
    return NextResponse.json({ error: 'bettor_agent_id, amount, side required' }, { status: 400 })
  }
  if (!['a', 'b'].includes(side)) {
    return NextResponse.json({ error: 'side must be "a" or "b"' }, { status: 400 })
  }
  if (amount <= 0 || amount > 1_000_000) {
    return NextResponse.json({ error: 'amount must be between 0 and 1,000,000' }, { status: 400 })
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 500 })
  }

  // Validate battle exists and is active
  const battleRes = await fetch(
    `${SUPABASE_URL}/rest/v1/battles?id=eq.${battleId}&select=id,status,ends_at,agent_a_id,agent_b_id&limit=1`,
    { headers: H, signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  if (!battleRes?.ok) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  const battles = await battleRes.json().catch(() => [])
  if (!battles?.length) return NextResponse.json({ error: 'battle_not_found' }, { status: 404 })

  const battle = battles[0]
  if (battle.status !== 'active') {
    return NextResponse.json({ error: 'battle_not_active', status: battle.status }, { status: 400 })
  }
  if (new Date(battle.ends_at) < new Date()) {
    return NextResponse.json({ error: 'battle_ended' }, { status: 400 })
  }

  // Check bettor wallet
  const walletRes = await fetch(
    `${SUPABASE_URL}/rest/v1/agent_wallets?agent_id=eq.${bettor_agent_id}&select=kaus_balance&limit=1`,
    { headers: H, signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  const wallets = walletRes?.ok ? await walletRes.json().catch(() => []) : []
  const balance = Number(wallets?.[0]?.kaus_balance ?? 0)

  if (balance < amount) {
    return NextResponse.json({
      error: 'insufficient_kaus',
      balance,
      required: amount,
    }, { status: 400 })
  }

  // Deduct from bettor wallet
  const newBalance = balance - amount
  await fetch(
    `${SUPABASE_URL}/rest/v1/agent_wallets?agent_id=eq.${bettor_agent_id}`,
    {
      method: 'PATCH',
      headers: H,
      body: JSON.stringify({ kaus_balance: newBalance }),
      signal: AbortSignal.timeout(3000),
    }
  ).catch(() => null)

  // Create bet record
  const betRes = await fetch(
    `${SUPABASE_URL}/rest/v1/battle_bets`,
    {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        battle_id: battleId,
        bettor_agent_id,
        amount,
        side,
        status: 'pending',
      }),
      signal: AbortSignal.timeout(3000),
    }
  ).catch(() => null)

  if (!betRes?.ok) {
    // Refund on failure
    await fetch(
      `${SUPABASE_URL}/rest/v1/agent_wallets?agent_id=eq.${bettor_agent_id}`,
      { method: 'PATCH', headers: H, body: JSON.stringify({ kaus_balance: balance }), signal: AbortSignal.timeout(3000) }
    ).catch(() => null)
    return NextResponse.json({ error: 'bet_creation_failed' }, { status: 500 })
  }

  const bet = await betRes.json().catch(() => [{}])

  return NextResponse.json({
    success: true,
    bet: bet[0] ?? {},
    new_balance: newBalance,
    battle_id: battleId,
    message: `Bet placed: ${amount} KAUS on side ${side.toUpperCase()}`,
  })
}
