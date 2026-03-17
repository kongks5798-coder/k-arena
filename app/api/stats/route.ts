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
  if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

  const since24h = new Date(Date.now() - 86400000).toISOString()

  const [
    { count: totalAgents },
    { count: genesis },
    { count: totalTx },
    { count: signals24h },
    { count: sessions },
    { data: vol24hRows },
    { data: avgSettle },
  ] = await Promise.all([
    db.from('agents').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('agents').select('*', { count: 'exact', head: true }).eq('is_genesis', true),
    db.from('transactions').select('*', { count: 'exact', head: true }),
    db.from('signals').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
    db.from('agent_sessions').select('*', { count: 'exact', head: true }).eq('status', 'online'),
    db.from('transactions').select('input_amount').gte('created_at', since24h).eq('status', 'settled'),
    db.from('transactions').select('settlement_ms').gte('created_at', since24h).limit(100),
  ])

  const volume24h = (vol24hRows ?? []).reduce((s: number, r: { input_amount: number }) => s + (r.input_amount ?? 0), 0)
  const settleArr = (avgSettle ?? []).map((r: { settlement_ms: number }) => r.settlement_ms).filter(Boolean)
  const avgSettleMs = settleArr.length > 0 ? Math.round(settleArr.reduce((a: number, b: number) => a + b, 0) / settleArr.length) : 0

  return NextResponse.json({
    ok: true,
    stats: {
      active_agents: totalAgents ?? 0,
      genesis_claimed: genesis ?? 0,
      genesis_remaining: 999 - (genesis ?? 0),
      total_transactions: totalTx ?? 0,
      volume_24h: volume24h,
      signals_today: signals24h ?? 0,
      active_sessions: sessions ?? 0,
      avg_settlement_ms: avgSettleMs,
      fee_rate: '0.1%',
    },
    ts: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'public, s-maxage=15', 'Access-Control-Allow-Origin': '*' } })
}
