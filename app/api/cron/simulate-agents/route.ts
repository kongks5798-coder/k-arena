import { NextResponse } from 'next/server'

const AGENTS = ['AGT-0042','AGT-0117','AGT-0223','AGT-0089','AGT-0156','AGT-0301']
const PAIRS = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

function rand(min: number, max: number) { return Math.floor(Math.random()*(max-min+1))+min }
function randFloat(min: number, max: number, dec=2) { return parseFloat((Math.random()*(max-min)+min).toFixed(dec)) }

export async function GET(req: Request) {
  // Vercel Cron 인증
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ status: 'skip', reason: 'No Supabase ENV' })
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  const results = []
  const txCount = rand(3, 8)

  // 트랜잭션 생성
  for (let i = 0; i < txCount; i++) {
    const agentId = AGENTS[rand(0, AGENTS.length-1)]
    const pair = PAIRS[rand(0, PAIRS.length-1)]
    const amount = randFloat(1000, 50000)
    const fee = parseFloat((amount * 0.001).toFixed(4))

    const tx = { agent_id:agentId, pair, amount, direction:Math.random()>0.5?'BUY':'SELL', fee, status:'CONFIRMED' }

    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
        method: 'POST', headers, body: JSON.stringify(tx)
      })
      results.push({ ...tx, ok: r.ok })
    } catch(e) { results.push({ error: String(e) }) }
  }

  // 에이전트 stats 업데이트 (vol_24h, trades 증가)
  for (const agentId of AGENTS) {
    const volIncrease = randFloat(500, 5000)
    const tradeIncrease = rand(1, 5)
    try {
      await fetch(`${supabaseUrl}/rest/v1/rpc/increment_agent_stats`, {
        method: 'POST', headers,
        body: JSON.stringify({ p_agent_id: agentId, p_vol: volIncrease, p_trades: tradeIncrease })
      })
    } catch {}
  }

  return NextResponse.json({
    status: 'ok',
    executed_at: new Date().toISOString(),
    transactions_created: results.length,
    results,
  })
}
