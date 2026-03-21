import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KAUS_PRICE = 1.0000

export async function GET() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

  let activeAgents = 0
  let totalAgents = 0
  let totalVol = 0
  let txCount = 0
  let signalsToday = 0
  let agents: unknown[] = []
  let dataSource = 'no-db'

  if (supabaseUrl && supabaseKey) {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

    // 1. Agents — critical (7s timeout)
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/agents?select=id,name,type,org,trades,accuracy,status,is_active&order=trades.desc&limit=100`,
        { headers: h, signal: AbortSignal.timeout(7000) },
      )
      if (res.ok) {
        const data: Array<{ status?: string; is_active?: boolean }> = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          agents = data
          totalAgents = data.length
          activeAgents = data.filter(a => a.status === 'ONLINE' || a.is_active === true).length
          dataSource = 'supabase'
        }
      }
    } catch {}

    // 2. Transactions 24h — critical (7s timeout)
    try {
      const since24h = new Date(Date.now() - 86400000).toISOString()
      const res = await fetch(
        `${supabaseUrl}/rest/v1/transactions?select=id,input_amount,rate,amount,created_at&created_at=gte.${since24h}&limit=9999`,
        { headers: h, signal: AbortSignal.timeout(7000) },
      )
      if (res.ok) {
        const data: Array<{ input_amount?: number; amount?: number; rate?: number }> = await res.json()
        if (Array.isArray(data)) {
          txCount = data.length
          totalVol = data.reduce(
            (s, t) => {
              const vol = Number(t.input_amount) || Number(t.amount) || 0
              return s + vol * (Number(t.rate) > 0 ? Number(t.rate) : 1)
            },
            0,
          )
        }
      }
    } catch {}

    // 3. Signals today
    try {
      const today = new Date(); today.setUTCHours(0,0,0,0)
      const res = await fetch(
        `${supabaseUrl}/rest/v1/signals?select=id&created_at=gte.${today.toISOString()}&limit=9999`,
        { headers: h, signal: AbortSignal.timeout(4000) },
      )
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) signalsToday = data.length
      }
    } catch {}
  }

  const FIXED_PAIRS = [
    { pair: 'XAU/KAUS', price: 2352.00, change: 0 },
    { pair: 'USD/KAUS', price: 1.0000,  change: 0 },
    { pair: 'ETH/KAUS', price: 3318.00, change: 0 },
    { pair: 'BTC/KAUS', price: 87420,   change: 0 },
    { pair: 'OIL/KAUS', price: 81.30,   change: 0 },
    { pair: 'EUR/KAUS', price: 1.0840,  change: 0 },
  ]

  return NextResponse.json({
    ok: true,
    platform: {
      total_volume_24h:  parseFloat(totalVol.toFixed(2)),
      active_agents:     activeAgents,
      total_agents:      totalAgents,
      total_trades_24h:  txCount,
      signals_today:     signalsToday,
      genesis_sold:      0,
      genesis_total:     999,
      kaus_price:        KAUS_PRICE,
      kaus_change_24h:   0.00,
      uptime:            '99.97%',
    },
    pairs:       FIXED_PAIRS,
    agents,
    signals:     [],
    data_source: dataSource,
    timestamp:   new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
