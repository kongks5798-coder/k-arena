import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getNextMonday(): Date {
  const d = new Date()
  const day = d.getUTCDay()
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7
  const next = new Date(d)
  next.setUTCDate(d.getUTCDate() + daysUntilMonday)
  next.setUTCHours(0, 0, 0, 0)
  return next
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  const nextReset = getNextMonday()
  const msRemaining = nextReset.getTime() - Date.now()
  const daysRemaining  = Math.floor(msRemaining / 86_400_000)
  const hoursRemaining = Math.floor((msRemaining % 86_400_000) / 3_600_000)

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      ok: true,
      season: { season_number: 1, started_at: new Date().toISOString() },
      next_reset: nextReset.toISOString(),
      days_remaining: daysRemaining,
      hours_remaining: hoursRemaining,
      rewards: { rank1: 500, rank2: 200, rank3: 100 },
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  const r = await fetch(
    `${supabaseUrl}/rest/v1/season_history?select=*&order=season_number.desc&limit=1`,
    { headers: h, signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  const seasons = r?.ok ? await r.json() : []
  const current = seasons?.[0] ?? { season_number: 1, started_at: new Date().toISOString() }

  return NextResponse.json({
    ok: true,
    season: current,
    next_reset: nextReset.toISOString(),
    days_remaining: daysRemaining,
    hours_remaining: hoursRemaining,
    rewards: { rank1: 500, rank2: 200, rank3: 100 },
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
