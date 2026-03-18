import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// APY rate table by duration
function getAPY(days: number): number {
  if (days >= 365) return 8.0
  if (days >= 180) return 6.5
  if (days >= 90)  return 5.5
  return 5.0
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agent_id')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, positions: [] }, { status: 503 })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  let url = `${supabaseUrl}/rest/v1/staking_positions?select=*&order=created_at.desc&limit=50`
  if (agentId) url += `&agent_id=eq.${encodeURIComponent(agentId)}`

  const r = await fetch(url, { headers: h, signal: AbortSignal.timeout(4000) }).catch(() => null)
  if (!r?.ok) return NextResponse.json({ ok: false, positions: [] })

  const positions: Record<string, unknown>[] = await r.json()
  const now = Date.now()

  // Compute current interest for each active position
  const enriched = positions.map(p => {
    const elapsed = now - new Date(String(p.started_at)).getTime()
    const elapsedDays = elapsed / 86_400_000
    const apy = Number(p.apy)
    const amount = Number(p.amount)
    const currentInterest = parseFloat((amount * (apy / 100) * (elapsedDays / 365)).toFixed(6))
    const daysRemaining = Math.max(0, Number(p.duration_days) - elapsedDays)
    const totalInterest  = parseFloat((amount * (apy / 100) * (Number(p.duration_days) / 365)).toFixed(6))
    return { ...p, current_interest: currentInterest, days_remaining: Math.ceil(daysRemaining), total_interest: totalInterest }
  })

  const totalStaked = enriched.filter(p => (p as Record<string, unknown>).status === 'active').reduce((s, p) => s + Number((p as Record<string, unknown>).amount), 0)
  const totalInterest = enriched.filter(p => (p as Record<string, unknown>).status === 'active').reduce((s, p) => s + Number(p.current_interest), 0)

  return NextResponse.json({
    ok: true, positions: enriched,
    stats: { total_staked: parseFloat(totalStaked.toFixed(6)), total_earned: parseFloat(totalInterest.toFixed(6)) },
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, amount, duration_days = 30 } = body

    if (!agent_id || !amount) {
      return NextResponse.json({ error: 'missing_params', required: ['agent_id', 'amount'] }, { status: 400 })
    }
    if (amount < 1) return NextResponse.json({ error: 'min_stake_1_kaus' }, { status: 400 })
    if (duration_days < 1 || duration_days > 365) {
      return NextResponse.json({ error: 'duration_must_be_1_to_365_days' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'no-db' }, { status: 503 })

    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

    // Check wallet balance
    const walletRes = await fetch(
      `${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${agent_id}&select=kaus_balance&limit=1`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    ).catch(() => null)

    if (!walletRes?.ok) return NextResponse.json({ error: 'wallet_not_found' }, { status: 404 })
    const walletData = await walletRes.json()
    const balance = parseFloat(walletData?.[0]?.kaus_balance ?? '0')

    if (balance < amount) {
      return NextResponse.json({ error: 'insufficient_balance', required: amount, current: balance }, { status: 402 })
    }

    const apy = getAPY(duration_days)
    const endsAt = new Date(Date.now() + duration_days * 86_400_000).toISOString()
    const expectedInterest = parseFloat((amount * (apy / 100) * (duration_days / 365)).toFixed(6))

    await Promise.allSettled([
      // Deduct from wallet
      fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${agent_id}`, {
        method: 'PATCH', headers: hw,
        body: JSON.stringify({ kaus_balance: parseFloat((balance - amount).toFixed(6)), updated_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(3000),
      }),
      // Create staking position
      fetch(`${supabaseUrl}/rest/v1/staking_positions`, {
        method: 'POST', headers: { ...hw, Prefer: 'return=minimal' },
        body: JSON.stringify({ agent_id, amount, duration_days, apy, ends_at: endsAt }),
        signal: AbortSignal.timeout(3000),
      }),
    ])

    return NextResponse.json({
      ok: true, agent_id, amount, duration_days, apy,
      ends_at: endsAt,
      expected_interest: expectedInterest,
      total_return: parseFloat((amount + expectedInterest).toFixed(6)),
      note: `Staking ${amount} KAUS for ${duration_days} days at ${apy}% APY`,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
