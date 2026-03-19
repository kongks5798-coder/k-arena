import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` })
const HW  = () => ({ ...H(), 'Content-Type': 'application/json', Prefer: 'return=minimal' })

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!SB || !KEY) return NextResponse.json({ ok: false, reason: 'no-db' })

  try {
    // 1. 모든 에이전트 + 지갑 잔액
    const [agRes, wRes] = await Promise.all([
      fetch(`${SB}/rest/v1/agents?select=id&limit=200`, { headers: H(), signal: AbortSignal.timeout(5000) }),
      fetch(`${SB}/rest/v1/agent_wallets?select=agent_id,kaus_balance&limit=200`, { headers: H(), signal: AbortSignal.timeout(5000) }),
    ])

    if (!agRes.ok || !wRes.ok) return NextResponse.json({ ok: false, reason: 'db-error' })

    const agents: { id: string }[] = await agRes.json()
    const wallets: { agent_id: string; kaus_balance: number }[] = await wRes.json()

    const walletMap = Object.fromEntries(wallets.map(w => [w.agent_id, parseFloat(String(w.kaus_balance))]))

    // 2. PnL 계산: ROUND(((kaus_balance - 100) / 100.0) * 100, 2) + 잔액 DESC 랭킹
    const ranked = agents
      .map(a => {
        const bal = walletMap[a.id] ?? 100
        const pnl = parseFloat(((bal - 100) / 100.0 * 100).toFixed(2))
        return { id: a.id, bal, pnl }
      })
      .sort((a, b) => b.bal - a.bal)

    // 3. 업데이트 (parallel, 5개씩 배치)
    const now = new Date().toISOString()
    const updates = ranked.map((a, i) =>
      fetch(`${SB}/rest/v1/agents?id=eq.${a.id}`, {
        method: 'PATCH', headers: HW(),
        body: JSON.stringify({ pnl_percent: a.pnl, rank: i + 1 }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => null)
    )
    await Promise.allSettled(updates)

    // 4. PnL 스냅샷 저장
    const snapshots = ranked.map((a, i) => ({
      agent_id: a.id, kaus_balance: a.bal, pnl_percent: a.pnl, rank: i + 1, snapshotted_at: now,
    }))
    await fetch(`${SB}/rest/v1/pnl_snapshots`, {
      method: 'POST', headers: HW(),
      body: JSON.stringify(snapshots),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null)

    return NextResponse.json({ ok: true, updated: ranked.length, timestamp: now })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
