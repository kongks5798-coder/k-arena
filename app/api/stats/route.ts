import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KAUS_PRICE = 1.0000

// In-memory rate limiter: 60 req / 60s per IP
const rl = new Map<string, { n: number; t: number }>()
function rateLimit(ip: string): boolean {
  const now = Date.now()
  const e = rl.get(ip)
  if (!e || now > e.t) { rl.set(ip, { n: 1, t: now + 60_000 }); return false }
  if (e.n >= 60) return true
  e.n++; return false
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimit(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, {
      status: 429, headers: { 'Retry-After': '60' },
    })
  }
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

  let activeAgents = 0
  let totalAgents = 0
  let totalVol = 0
  let txCount = 0
  let signalsToday = 0
  let agents: unknown[] = []
  let recentSignals: unknown[] = []
  let dataSource = 'no-db'

  if (supabaseUrl && supabaseKey) {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

    // 1. Agents — critical (7s timeout)
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/agents?select=id,name,type,org,trades,accuracy,status,is_active&id=not.like.AGT-*&order=trades.desc&limit=100`,
        { headers: h, signal: AbortSignal.timeout(7000) },
      )
      if (res.ok) {
        const data: Array<{ name?: string; status?: string; is_active?: boolean }> = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const seen = new Set<string>()
          const deduped = data.filter(a => {
            if (seen.has(a.name ?? '')) return false
            seen.add(a.name ?? '')
            return true
          })
          agents = deduped
          totalAgents = deduped.length
          activeAgents = deduped.filter(a => a.status === 'ONLINE' || a.is_active === true).length
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
          // input_amount는 KAUS 단위, KAUS = $1.00 고정 페그 → 그대로 합산
          totalVol = data.reduce(
            (s, t) => s + (Number(t.input_amount) || Number(t.amount) || 0),
            0,
          )
        }
      }
    } catch {}

    // 3. Signals today + recent 5
    let recentSignals: unknown[] = []
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
      const todayISO = todayStart.toISOString()
      const [countRes, recentRes] = await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/signals?select=id&created_at=gte.${todayISO}&agent_id=not.is.null&limit=9999`,
          { headers: h, signal: AbortSignal.timeout(4000) },
        ),
        fetch(
          `${supabaseUrl}/rest/v1/signals?select=id,agent_name,type,asset,content,confidence,created_at&order=created_at.desc&limit=5`,
          { headers: h, signal: AbortSignal.timeout(4000) },
        ),
      ])
      if (countRes.ok) {
        const data = await countRes.json()
        if (Array.isArray(data)) signalsToday = data.length
      }
      if (recentRes.ok) {
        const sigData = await recentRes.json()
        if (Array.isArray(sigData)) recentSignals = sigData
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
    signals:     recentSignals,
    data_source: dataSource,
    timestamp:   new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
