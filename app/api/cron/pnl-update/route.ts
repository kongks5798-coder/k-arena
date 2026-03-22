import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({
  apikey: KEY(),
  Authorization: `Bearer ${KEY()}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
})

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = SB()
  const key = KEY()
  if (!sb || !key) return NextResponse.json({ ok: false, reason: 'no-db' })

  const now = new Date().toISOString()
  let updated = 0
  let errors = 0

  try {
    // 1. agent별 fee_kaus 합산
    const txRes = await fetch(
      `${sb}/rest/v1/transactions?select=agent_id,fee_kaus,fee&limit=9999`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000) }
    )
    if (!txRes.ok) {
      return NextResponse.json({ ok: false, reason: 'tx-fetch-failed', status: txRes.status })
    }

    const txData: Array<{ agent_id: string; fee_kaus?: number; fee?: number }> = await txRes.json()
    if (!Array.isArray(txData)) return NextResponse.json({ ok: false, reason: 'bad-tx-data' })

    // agent_id별 총 수수료 합산
    const feeMap: Record<string, number> = {}
    for (const tx of txData) {
      const fee = Number(tx.fee_kaus) || Number(tx.fee) || 0
      if (tx.agent_id && fee > 0) {
        feeMap[tx.agent_id] = (feeMap[tx.agent_id] ?? 0) + fee
      }
    }

    // 2. 각 agent에 pnl_percent PATCH + wallet 업데이트
    const agentIds = Object.keys(feeMap)
    if (agentIds.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, reason: 'no-fee-data', timestamp: now })
    }

    const patches = agentIds.map(async (agentId) => {
      const totalFee = feeMap[agentId]
      const pnlPercent = parseFloat(((totalFee / 100.0) * 100).toFixed(2))
      const newBalance = parseFloat((100 + totalFee).toFixed(6))

      const [agentPatch, walletPatch] = await Promise.allSettled([
        fetch(`${sb}/rest/v1/agents?id=eq.${agentId}`, {
          method: 'PATCH',
          headers: H(),
          body: JSON.stringify({ pnl_percent: pnlPercent, last_seen: now }),
          signal: AbortSignal.timeout(3000),
        }),
        fetch(`${sb}/rest/v1/agent_wallets?agent_id=eq.${agentId}`, {
          method: 'PATCH',
          headers: H(),
          body: JSON.stringify({
            kaus_balance: newBalance,
            total_earned: parseFloat(totalFee.toFixed(6)),
            updated_at: now,
          }),
          signal: AbortSignal.timeout(3000),
        }),
      ])

      const ok1 = agentPatch.status === 'fulfilled' && (agentPatch.value.ok || agentPatch.value.status === 204)
      const ok2 = walletPatch.status === 'fulfilled' && (walletPatch.value.ok || walletPatch.value.status === 204)
      return ok1 || ok2
    })

    const results = await Promise.all(patches)
    updated = results.filter(Boolean).length
    errors = results.length - updated

    // 3. rank 순위 업데이트 (pnl_percent 기준)
    try {
      const allAgRes = await fetch(
        `${sb}/rest/v1/agents?select=id,pnl_percent&order=pnl_percent.desc&limit=200`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) }
      )
      if (allAgRes.ok) {
        const allAgents: Array<{ id: string; pnl_percent: number }> = await allAgRes.json()
        await Promise.allSettled(allAgents.map((ag, idx) =>
          fetch(`${sb}/rest/v1/agents?id=eq.${ag.id}`, {
            method: 'PATCH',
            headers: H(),
            body: JSON.stringify({ rank: idx + 1 }),
            signal: AbortSignal.timeout(2000),
          })
        ))
      }
    } catch { /* rank update optional */ }

    return NextResponse.json({ ok: true, updated, errors, agents: agentIds.length, timestamp: now })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
