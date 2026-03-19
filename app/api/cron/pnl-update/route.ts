import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (!SB || !KEY) return NextResponse.json({ ok: false, reason: 'no-db' })

  const h = {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }

  try {
    // 1. RPC: update_pnl_rankings() — SECURITY DEFINER로 anon key도 실행 가능
    const rpcRes = await fetch(`${SB}/rest/v1/rpc/update_pnl_rankings`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(8000),
    })

    const now = new Date().toISOString()

    if (!rpcRes.ok) {
      const err = await rpcRes.text()
      return NextResponse.json({ ok: false, reason: 'rpc-failed', detail: err, timestamp: now })
    }

    const rpcData = await rpcRes.json()

    // 2. PnL 스냅샷 저장 (선택적)
    try {
      const [agRes, wRes] = await Promise.all([
        fetch(`${SB}/rest/v1/agents?select=id,rank&limit=200`, { headers: h, signal: AbortSignal.timeout(4000) }),
        fetch(`${SB}/rest/v1/agent_wallets?select=agent_id,kaus_balance&limit=200`, { headers: h, signal: AbortSignal.timeout(4000) }),
      ])

      if (agRes.ok && wRes.ok) {
        const agents: { id: string; rank: number }[] = await agRes.json()
        const wallets: { agent_id: string; kaus_balance: number }[] = await wRes.json()
        const walletMap = Object.fromEntries(wallets.map(w => [w.agent_id, parseFloat(String(w.kaus_balance))]))

        const snapshots = agents.map(a => {
          const bal = walletMap[a.id] ?? 100
          return {
            agent_id: a.id,
            kaus_balance: bal,
            pnl_percent: parseFloat(((bal - 100) / 100.0 * 100).toFixed(2)),
            rank: a.rank,
            snapshotted_at: now,
          }
        })

        await fetch(`${SB}/rest/v1/pnl_snapshots`, {
          method: 'POST',
          headers: { ...h, Prefer: 'return=minimal' },
          body: JSON.stringify(snapshots),
          signal: AbortSignal.timeout(5000),
        }).catch(() => null)
      }
    } catch { /* snapshot optional */ }

    return NextResponse.json({ ok: true, rpc: rpcData, timestamp: now })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
