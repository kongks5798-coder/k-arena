import { NextResponse } from 'next/server'
import { hasActiveAgents } from '@/lib/cron-guard'

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

  if (!(await hasActiveAgents())) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no-active-agents' })
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

    // 2. wallet만 업데이트 (agents.pnl_percent는 건드리지 않음 — DB 직접 세팅 값 유지)
    const agentIds = Object.keys(feeMap)
    if (agentIds.length === 0) {
      return NextResponse.json({ ok: true, updated: 0, reason: 'no-fee-data', timestamp: now })
    }

    const patches = agentIds.map(async (agentId) => {
      const totalFee = feeMap[agentId]
      const newBalance = parseFloat((100 + totalFee).toFixed(6))

      const walletPatch = await fetch(`${sb}/rest/v1/agent_wallets?agent_id=eq.${agentId}`, {
        method: 'PATCH',
        headers: H(),
        body: JSON.stringify({
          kaus_balance: newBalance,
          total_earned: parseFloat(totalFee.toFixed(6)),
          updated_at: now,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => null)

      return walletPatch?.ok || walletPatch?.status === 204
    })

    const results = await Promise.all(patches)
    updated = results.filter(Boolean).length
    errors = results.length - updated

    return NextResponse.json({ ok: true, updated, errors, agents: agentIds.length, timestamp: now })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
