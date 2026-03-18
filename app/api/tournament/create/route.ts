import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SK = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H = () => ({ apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

const ROUND_PRIZES: Record<number, number> = { 1: 50, 2: 100, 3: 200, 4: 500 }

// Pick 16 agents by highest credit score
async function pickAgents(): Promise<string[]> {
  const res = await fetch(
    `${SB}/rest/v1/agent_credit_scores?order=score.desc&limit=16&select=agent_id`,
    { headers: H(), signal: AbortSignal.timeout(3000) }
  ).catch(() => null)
  if (!res?.ok) return []
  const rows = await res.json().catch(() => [])
  return rows.map((r: { agent_id: string }) => r.agent_id)
}

// Seed bracket: pair agents so rank 1 vs 16, 2 vs 15, etc.
function seedBracket(agents: string[]): { a: string; b: string }[] {
  const pairs: { a: string; b: string }[] = []
  const n = agents.length
  for (let i = 0; i < n / 2; i++) {
    pairs.push({ a: agents[i], b: agents[n - 1 - i] })
  }
  return pairs
}

async function airdropKaus(agentId: string, amount: number) {
  const wRes = await fetch(
    `${SB}/rest/v1/agent_wallets?agent_id=eq.${agentId}&select=kaus_balance`,
    { headers: H(), signal: AbortSignal.timeout(2000) }
  ).catch(() => null)
  if (!wRes?.ok) return
  const wallets = await wRes.json().catch(() => [])
  const balance = Number(wallets?.[0]?.kaus_balance ?? 0)
  await fetch(
    `${SB}/rest/v1/agent_wallets?agent_id=eq.${agentId}`,
    { method: 'PATCH', headers: H(), body: JSON.stringify({ kaus_balance: balance + amount }), signal: AbortSignal.timeout(2000) }
  ).catch(() => null)
}

export async function POST(req: NextRequest) {
  if (!SB || !SK) return NextResponse.json({ error: 'db_not_configured' }, { status: 500 })

  let body: { name?: string; prize_pool?: number } = {}
  try { body = await req.json() } catch {}

  const agents = await pickAgents()
  if (agents.length < 2) {
    return NextResponse.json({ error: 'need_at_least_2_agents', agents_found: agents.length }, { status: 400 })
  }

  // Pad to 16 (or nearest power of 2) by repeating
  let participants = [...agents]
  while (participants.length < 16 && participants.length < 2 * agents.length) {
    participants = [...participants, ...agents]
  }
  participants = participants.slice(0, 16)

  const totalPrize = body.prize_pool ?? 2000

  // Create tournament
  const tRes = await fetch(`${SB}/rest/v1/tournaments`, {
    method: 'POST',
    headers: H(),
    body: JSON.stringify({
      name: body.name ?? `K-Arena Tournament #${Date.now()}`,
      status: 'active',
      participants: participants,
      prize_pool: totalPrize,
    }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => null)

  if (!tRes?.ok) return NextResponse.json({ error: 'tournament_creation_failed' }, { status: 500 })
  const tournaments = await tRes.json().catch(() => [])
  const tournament = tournaments[0]

  // Create round 1 matches
  const pairs = seedBracket(participants)
  const matchInserts = pairs.map((p, i) => ({
    tournament_id: tournament.id,
    round: 1,
    match_num: i + 1,
    agent_a_id: p.a,
    agent_b_id: p.b,
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 60_000).toISOString(), // starts in 1 minute
  }))

  const mRes = await fetch(`${SB}/rest/v1/tournament_matches`, {
    method: 'POST',
    headers: H(),
    body: JSON.stringify(matchInserts),
    signal: AbortSignal.timeout(4000),
  }).catch(() => null)

  if (!mRes?.ok) return NextResponse.json({ error: 'match_creation_failed' }, { status: 500 })

  // Airdrop ROUND_PRIZES[1] to all participants (R16 participation bonus)
  await Promise.all(participants.map(id => airdropKaus(id, ROUND_PRIZES[1])))

  return NextResponse.json({
    success: true,
    tournament,
    matches_created: matchInserts.length,
    participants: participants.length,
    message: `Tournament created! ${matchInserts.length} Round of 16 matches scheduled.`,
    prizes: ROUND_PRIZES,
    airdrop: `${ROUND_PRIZES[1]} KAUS sent to all ${participants.length} participants`,
  })
}
