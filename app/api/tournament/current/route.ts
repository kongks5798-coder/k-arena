import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SK = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H = () => ({ apikey: SK, Authorization: `Bearer ${SK}` })

export async function GET() {
  if (!SB || !SK) return NextResponse.json({ error: 'db_not_configured' }, { status: 500 })

  // Get latest active or upcoming tournament
  const tRes = await fetch(
    `${SB}/rest/v1/tournaments?order=created_at.desc&limit=1`,
    { headers: H(), signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  if (!tRes?.ok) return NextResponse.json({ error: 'db_error' }, { status: 500 })
  const tournaments = await tRes.json().catch(() => [])
  if (!tournaments?.length) return NextResponse.json({ tournament: null, message: 'No tournament yet. POST /api/tournament/create to start one.' })

  const tournament = tournaments[0]

  // Get all matches for this tournament
  const mRes = await fetch(
    `${SB}/rest/v1/tournament_matches?tournament_id=eq.${tournament.id}&order=round.asc,match_num.asc`,
    { headers: H(), signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  const matches = mRes?.ok ? await mRes.json().catch(() => []) : []

  // Get agent names for all participants
  const allIds = [
    ...matches.map((m: Record<string, unknown>) => m.agent_a_id),
    ...matches.map((m: Record<string, unknown>) => m.agent_b_id),
  ].filter(Boolean)
  const agentIds = allIds.filter((id, i) => allIds.indexOf(id) === i)

  let agentNames: Record<string, string> = {}
  if (agentIds.length) {
    const ids = agentIds.map(id => `id=eq.${id}`).join(',')
    const aRes = await fetch(
      `${SB}/rest/v1/agents?or=(${ids})&select=id,name&limit=16`,
      { headers: H(), signal: AbortSignal.timeout(3000) }
    ).catch(() => null)
    if (aRes?.ok) {
      const agents = await aRes.json().catch(() => [])
      agentNames = Object.fromEntries(agents.map((a: { id: string; name: string }) => [a.id, a.name]))
    }
  }

  // Enrich matches with agent names
  const enriched = matches.map((m: Record<string, unknown>) => ({
    ...m,
    agent_a_name: agentNames[m.agent_a_id as string] ?? String(m.agent_a_id).slice(0, 8),
    agent_b_name: agentNames[m.agent_b_id as string] ?? String(m.agent_b_id).slice(0, 8),
    winner_name: m.winner_id ? (agentNames[m.winner_id as string] ?? String(m.winner_id).slice(0, 8)) : null,
  }))

  // Group by round
  const byRound: Record<number, typeof enriched> = {}
  for (const m of enriched) {
    const r = Number(m.round)
    if (!byRound[r]) byRound[r] = []
    byRound[r].push(m)
  }

  const ROUND_NAMES: Record<number, string> = { 1: 'ROUND OF 16', 2: 'QUARTER-FINALS', 3: 'SEMI-FINALS', 4: 'FINAL' }
  const roundsData = Object.entries(byRound).map(([r, ms]) => ({
    round: Number(r),
    name: ROUND_NAMES[Number(r)] ?? `ROUND ${r}`,
    matches: ms,
  }))

  return NextResponse.json({
    tournament,
    rounds: roundsData,
    total_matches: matches.length,
    completed_matches: matches.filter((m: Record<string, unknown>) => m.status === 'completed').length,
  })
}
