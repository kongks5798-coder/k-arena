import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KAUS_PRICE = 1.0000

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  // 기본값 (Supabase 없을 때) — 랜덤 없음
  let activeAgents = 0
  let totalAgents = 0
  let totalVol = 0
  let txCount = 0
  let genesisSold = 0
  let agents: unknown[] = []
  let dataSource = 'no-db'
  const communityStats = { total_credit_points: 0, diamond_agents: 0, platinum_agents: 0, average_score: 100, total_airdrops_claimed: 0 }

  if (supabaseUrl && supabaseKey) {
    const h = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    try {
      const [agR, txR, gnR, csR, adR] = await Promise.all([
        // agents: 전체 목록 + vol_24h, status, is_active
        fetch(`${supabaseUrl}/rest/v1/agents?select=id,name,type,org,vol_24h,trades,accuracy,status,is_active,daily_limit,wallet_address&order=vol_24h.desc&limit=100`, {
          headers: h, signal: AbortSignal.timeout(5000),
        }),
        // transactions: 전체 카운트
        fetch(`${supabaseUrl}/rest/v1/transactions?select=id,amount,created_at&limit=9999`, {
          headers: h, signal: AbortSignal.timeout(5000),
        }),
        // genesis members
        fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id`, {
          headers: h, signal: AbortSignal.timeout(5000),
        }),
        // credit scores
        fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?select=score,tier`, {
          headers: h, signal: AbortSignal.timeout(3000),
        }),
        // airdrops
        fetch(`${supabaseUrl}/rest/v1/kaus_airdrops?select=id&limit=9999`, {
          headers: h, signal: AbortSignal.timeout(3000),
        }),
      ])

      if (agR.ok) {
        const agData = await agR.json()
        if (Array.isArray(agData) && agData.length > 0) {
          agents = agData
          totalAgents = agData.length
          // status='ONLINE' 또는 is_active=true 인 에이전트
          activeAgents = agData.filter(
            (a: { status?: string; is_active?: boolean }) =>
              a.status === 'ONLINE' || a.is_active === true
          ).length
          // vol_24h 합계
          totalVol = agData.reduce(
            (s: number, a: { vol_24h?: number }) => s + (a.vol_24h || 0), 0
          )
          dataSource = 'supabase'
        }
      }

      if (txR.ok) {
        const txData = await txR.json()
        if (Array.isArray(txData)) {
          txCount = txData.length
          // 24H 볼륨이 없을 때 → transactions amount 합계로 보완
          if (totalVol === 0) {
            totalVol = txData.reduce(
              (s: number, t: { amount?: number }) => s + (t.amount || 0), 0
            )
          }
        }
      }

      if (gnR.ok) {
        const gnData = await gnR.json()
        if (Array.isArray(gnData)) genesisSold = gnData.length
      }

      // Community stats from credit scores + airdrops
      if (csR.ok) {
        const csData = await csR.json()
        if (Array.isArray(csData) && csData.length > 0) {
          communityStats.total_credit_points = csData.reduce((s: number, c: { score?: number }) => s + (c.score || 0), 0)
          communityStats.diamond_agents = csData.filter((c: { tier?: string }) => c.tier === 'DIAMOND').length
          communityStats.platinum_agents = csData.filter((c: { tier?: string }) => c.tier === 'PLATINUM').length
          communityStats.average_score = Math.round(communityStats.total_credit_points / csData.length)
        }
      }
      if (adR.ok) {
        const adData = await adR.json()
        if (Array.isArray(adData)) communityStats.total_airdrops_claimed = adData.length
      }
    } catch {
      dataSource = 'error'
    }
  }

  // 고정 페어 가격 (랜덤 없음 — 실시간은 /api/rates 참조)
  const FIXED_PAIRS = [
    { pair: 'XAU/KAUS', price: 2352.00, change: 0 },
    { pair: 'USD/KAUS', price: 1.0000,  change: 0 },
    { pair: 'ETH/KAUS', price: 3318.00, change: 0 },
    { pair: 'BTC/KAUS', price: 87420,   change: 0 },
    { pair: 'OIL/KAUS', price: 81.30,   change: 0 },
    { pair: 'EUR/KAUS', price: 1.0840,  change: 0 },
  ]

  return NextResponse.json({
    ok: true, // page.tsx에서 ok 체크용
    platform: {
      total_volume_24h: parseFloat(totalVol.toFixed(2)),
      active_agents: activeAgents,
      total_agents: totalAgents,
      total_trades_24h: txCount,
      genesis_sold: genesisSold,
      genesis_total: 999,
      kaus_price: KAUS_PRICE,
      kaus_change_24h: 0.00,
      uptime: '99.97%',
    },
    pairs: FIXED_PAIRS,
    agents,
    signals: [],
    community: communityStats,
    data_source: dataSource,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
