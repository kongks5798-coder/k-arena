import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

// In-memory rate limiter: IP → { count, resetAt }
const rl = new Map<string, { n: number; t: number }>()
const LIMIT = 30       // 30 req
const WINDOW = 60_000  // per 60s

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rl.get(ip)
  if (!entry || now > entry.t) {
    rl.set(ip, { n: 1, t: now + WINDOW })
    return false
  }
  if (entry.n >= LIMIT) return true
  entry.n++
  return false
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, reason: 'rate_limited', retry_after: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '24H'
  const sb = SB(); const key = KEY()
  if (!sb || !key) return NextResponse.json({ ok: false, reason: 'no-db' })

  const headers = { apikey: key, Authorization: `Bearer ${key}` }
  const noCache = { cache: 'no-store' as const }

  try {
    // 1. agents 테이블에서 직접 가져오기 (UUID만, rank 순)
    const agRes = await fetch(
      `${sb}/rest/v1/agents?select=id,name,type,org,trades,accuracy,status,pnl_percent,rank,initial_balance,vol_24h&order=rank.asc&limit=100`,
      { headers, signal: AbortSignal.timeout(6000), ...noCache }
    )
    if (!agRes.ok) return NextResponse.json({ ok: false, reason: 'agents-failed' })
    const rawAgents: any[] = await agRes.json()
    if (!Array.isArray(rawAgents) || rawAgents.length === 0)
      return NextResponse.json({ ok: false, reason: 'no-agents' })

    // 2. UUID 형식만 필터 (AGT- 포맷 완전 제외)
    const agents = rawAgents.filter(a =>
      typeof a.id === 'string' && !a.id.startsWith('AGT-')
    )

    // 3. agent_wallets 가져오기
    const wRes = await fetch(
      `${sb}/rest/v1/agent_wallets?select=agent_id,kaus_balance,total_earned,last_trade_at&limit=100`,
      { headers, signal: AbortSignal.timeout(5000), ...noCache }
    )
    const wallets: any[] = wRes.ok ? await wRes.json() : []
    const walletMap: Record<string, any> = {}
    if (Array.isArray(wallets)) wallets.forEach(w => { walletMap[w.agent_id] = w })

    // 4. 24H 거래 볼륨
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const txRes = await fetch(
      `${sb}/rest/v1/transactions?select=agent_id,input_amount,rate&created_at=gte.${since}&limit=9999`,
      { headers, signal: AbortSignal.timeout(6000), ...noCache }
    )
    const txData: any[] = txRes.ok ? await txRes.json() : []
    const volMap: Record<string, number> = {}
    if (Array.isArray(txData)) {
      txData.forEach(t => {
        const vol = Number(t.input_amount) || 0
        const rate = Number(t.rate) > 1 ? Number(t.rate) : 1
        volMap[t.agent_id] = (volMap[t.agent_id] || 0) + vol * rate
      })
    }

    // 5. 결합
    const result = agents.map(a => {
      const w = walletMap[a.id] || {}
      return {
        rank:           a.rank ?? 99,
        name:           a.name,
        type:           a.type ?? 'AI Trading Agent',
        org:            a.org ?? 'K-Arena Network',
        kaus_balance:   Number(w.kaus_balance ?? a.initial_balance ?? 100),
        initial_balance:Number(a.initial_balance ?? 100),
        pnl_percent:    Number(a.pnl_percent ?? 0),
        total_earned:   Number(w.total_earned ?? 0),
        vol_24h:        volMap[a.id] ?? 0,
        trades:         a.trades ?? 0,
        accuracy:       Number(a.accuracy ?? 0),
        status:         a.status ?? 'ONLINE',
        last_trade_at:  w.last_trade_at ?? null,
      }
    })

    const totalVol = result.reduce((s, a) => s + a.vol_24h, 0)

    return NextResponse.json({
      ok: true,
      agents: result,
      total_agents: result.length,
      total_volume: totalVol,
      data_source: 'supabase',
      period,
      updated_at: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
