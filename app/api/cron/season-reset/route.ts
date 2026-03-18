import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'no-db' })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

  // 1. Get current season
  const seasonRes = await fetch(
    `${supabaseUrl}/rest/v1/season_history?select=*&order=season_number.desc&limit=1`,
    { headers: h, signal: AbortSignal.timeout(5000) }
  ).catch(() => null)
  const seasons = seasonRes?.ok ? await seasonRes.json() : []
  const current = seasons?.[0]
  if (!current) return NextResponse.json({ ok: false, error: 'no_season' })

  // 2. Get top 3 by volume (leaderboard for ALL time, this season)
  const since = current.started_at
  const txRes = await fetch(
    `${supabaseUrl}/rest/v1/transactions?select=agent_id,input_amount&created_at=gte.${encodeURIComponent(since)}&status=eq.settled`,
    { headers: h, signal: AbortSignal.timeout(5000) }
  ).catch(() => null)

  const txs: Array<{ agent_id: string; input_amount: number }> = txRes?.ok ? await txRes.json() : []
  const volMap: Record<string, number> = {}
  for (const tx of txs) {
    if (!tx.agent_id) continue
    volMap[tx.agent_id] = (volMap[tx.agent_id] ?? 0) + (tx.input_amount ?? 0)
  }
  const sorted = Object.entries(volMap).sort((a, b) => b[1] - a[1])
  const [top1, top2, top3] = sorted.map(e => e[0])

  // 3. Award KAUS to top 3
  const REWARDS = [500, 200, 100]
  const winners = [top1, top2, top3].filter(Boolean)
  await Promise.allSettled(
    winners.map(async (wid, i) => {
      const walRes = await fetch(
        `${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${wid}&select=kaus_balance&limit=1`,
        { headers: h, signal: AbortSignal.timeout(2000) }
      ).catch(() => null)
      const wal = walRes?.ok ? await walRes.json() : null
      const bal = parseFloat(wal?.[0]?.kaus_balance ?? '100')
      return fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${wid}`, {
        method: 'PATCH', headers: hw,
        body: JSON.stringify({ kaus_balance: parseFloat((bal + REWARDS[i]).toFixed(6)), updated_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(2000),
      })
    })
  )

  // 4. Close current season
  await fetch(`${supabaseUrl}/rest/v1/season_history?id=eq.${current.id}`, {
    method: 'PATCH', headers: hw,
    body: JSON.stringify({ ended_at: new Date().toISOString(), top1_agent_id: top1 ?? null, top2_agent_id: top2 ?? null, top3_agent_id: top3 ?? null }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => null)

  // 5. Start new season
  await fetch(`${supabaseUrl}/rest/v1/season_history`, {
    method: 'POST', headers: { ...hw, Prefer: 'return=minimal' },
    body: JSON.stringify({ season_number: current.season_number + 1, started_at: new Date().toISOString() }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => null)

  return NextResponse.json({
    ok: true,
    closed_season: current.season_number,
    new_season: current.season_number + 1,
    winners: { rank1: top1 ?? null, rank2: top2 ?? null, rank3: top3 ?? null },
    rewards_paid: REWARDS.slice(0, winners.length),
  })
}
