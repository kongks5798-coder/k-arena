import { NextResponse } from 'next/server'

const AGENTS = ['AGT-0042','AGT-0117','AGT-0223','AGT-0089','AGT-0156','AGT-0301']
const PAIRS = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

function rand(min: number, max: number) { return Math.floor(Math.random()*(max-min+1))+min }
function randF(min: number, max: number, d=2) { return parseFloat((Math.random()*(max-min)+min).toFixed(d)) }

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!url || !key) return NextResponse.json({ status:'skip', reason:'No Supabase ENV' })

  const headers = {
    apikey: key, Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json', Prefer: 'return=minimal',
  }

  const results: string[] = []
  const txCount = rand(4, 10)

  // 트랜잭션 생성
  const txs = Array.from({ length: txCount }, () => {
    const agentId = AGENTS[rand(0, AGENTS.length-1)]
    const pair = PAIRS[rand(0, PAIRS.length-1)]
    const amount = randF(2000, 60000)
    return {
      agent_id: agentId,
      pair,
      amount,
      direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
      fee: parseFloat((amount * 0.001).toFixed(4)),
      status: 'CONFIRMED',
    }
  })

  try {
    const r = await fetch(`${url}/rest/v1/transactions`, {
      method: 'POST', headers,
      body: JSON.stringify(txs),
      signal: AbortSignal.timeout(5000),
    })
    results.push(r.ok ? `✓ ${txCount} transactions` : `✗ tx insert ${r.status}`)
  } catch(e) { results.push(`✗ tx error: ${e}`) }

  // 에이전트 stats 업데이트
  const agentUpdates = AGENTS.map(id => ({
    id,
    vol_delta: randF(500, 8000),
    trades_delta: rand(1, 8),
    accuracy_change: randF(-0.5, 0.8, 1),
  }))

  for (const a of agentUpdates) {
    try {
      // 현재 stats 가져오기
      const getR = await fetch(`${url}/rest/v1/agents?id=eq.${a.id}&select=vol_24h,trades,accuracy`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(2000),
      })
      if (getR.ok) {
        const current = await getR.json()
        if (Array.isArray(current) && current.length > 0) {
          const c = current[0]
          const newVol = parseFloat(((c.vol_24h || 0) + a.vol_delta).toFixed(2))
          const newTrades = (c.trades || 0) + a.trades_delta
          const newAcc = parseFloat(Math.min(95, Math.max(50, (c.accuracy || 70) + a.accuracy_change)).toFixed(1))

          await fetch(`${url}/rest/v1/agents?id=eq.${a.id}`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ vol_24h: newVol, trades: newTrades, accuracy: newAcc, last_seen: new Date().toISOString() }),
            signal: AbortSignal.timeout(2000),
          })
          results.push(`✓ ${a.id} vol:${newVol.toLocaleString()} trades:${newTrades} acc:${newAcc}%`)
        }
      }
    } catch { results.push(`⚠ ${a.id} update skipped`) }
  }

  return NextResponse.json({
    status: 'ok',
    executed_at: new Date().toISOString(),
    transactions_created: txCount,
    agents_updated: AGENTS.length,
    results,
  })
}
