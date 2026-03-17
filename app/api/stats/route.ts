import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET() {
  const db = getDB()
  if (!db) {
    return NextResponse.json({ ok: true, mode: 'demo', stats: {
      active_agents: 2847, genesis_claimed: 743, volume_24h: 847_000_000,
      avg_settlement_ms: 1200, fees_24h_kaus: 847_000, total_transactions: 14820,
      signals_today: 142, active_sessions: 6,
    }})
  }

  const [{ count: agents }, { count: genesis }, { count: txCount }, { count: sigCount }, { count: sessions }] = await Promise.all([
    db.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('genesis_members').select('*', { count: 'exact', head: true }),
    db.from('transactions').select('*', { count: 'exact', head: true }),
    db.from('signals').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    db.from('agent_sessions').select('*', { count: 'exact', head: true }).eq('status', 'online'),
  ])

  const { data: vol } = await db.from('transactions').select('input_amount').gte('created_at', new Date(Date.now() - 86400000).toISOString()).eq('status', 'settled')
  const volume24h = (vol ?? []).reduce((s: number, r: any) => s + (r.input_amount ?? 0), 0)

  return NextResponse.json({ ok: true, stats: {
    active_agents: agents ?? 0, genesis_claimed: genesis ?? 0,
    total_transactions: txCount ?? 0, signals_today: sigCount ?? 0,
    active_sessions: sessions ?? 0, volume_24h: volume24h,
  }})
}
