import { NextResponse } from 'next/server'

const AGENTS = [
  { id:'AGT-0042', name:'Apex Exchange Bot', org:'Apex Capital', status:'ONLINE', vol_24h:145230.50, trades:782, accuracy:76.4 },
  { id:'AGT-0117', name:'Seoul FX Engine', org:'Korea Finance', status:'ONLINE', vol_24h:98450.20, trades:421, accuracy:71.2 },
  { id:'AGT-0223', name:'Gold Arbitrage AI', org:'GoldTech Ltd', status:'ONLINE', vol_24h:67320.80, trades:287, accuracy:83.1 },
  { id:'AGT-0089', name:'Euro Trade Node', org:'EU Markets', status:'ONLINE', vol_24h:43180.60, trades:198, accuracy:68.9 },
  { id:'AGT-0156', name:'Crypto Bridge Agent', org:'DeFi Protocol', status:'ONLINE', vol_24h:124560.30, trades:634, accuracy:79.5 },
  { id:'AGT-0301', name:'Energy Markets Bot', org:'EnergyCorp', status:'ONLINE', vol_24h:38920.40, trades:156, accuracy:64.3 },
]

const PAIRS = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return NextResponse.json({ error: 'No Supabase ENV' }, { status: 503 })

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  }

  const results: { id?: string; table?: string; ok: boolean; status?: number; error?: string; count?: number }[] = []

  // agents upsert
  for (const agent of AGENTS) {
    try {
      const r = await fetch(`${url}/rest/v1/agents`, {
        method: 'POST',
        headers,
        body: JSON.stringify(agent),
        signal: AbortSignal.timeout(3000),
      })
      results.push({ id: agent.id, ok: r.ok, status: r.status })
    } catch(e) {
      results.push({ id: agent.id, ok: false, error: String(e) })
    }
  }

  // transactions 시드 (기존 없을 때만)
  const checkR = await fetch(`${url}/rest/v1/transactions?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }).catch(() => null)

  const existing = checkR?.ok ? await checkR.json() : []
  if (!Array.isArray(existing) || existing.length === 0) {
    const txs = AGENTS.flatMap((a, i) => ([
      { agent_id:a.id, pair:PAIRS[i%6], amount:parseFloat((10000+i*5000).toFixed(2)), direction:'BUY', fee:parseFloat(((10000+i*5000)*0.001).toFixed(4)), status:'CONFIRMED' },
      { agent_id:a.id, pair:PAIRS[(i+2)%6], amount:parseFloat((8000+i*3000).toFixed(2)), direction:'SELL', fee:parseFloat(((8000+i*3000)*0.001).toFixed(4)), status:'CONFIRMED' },
      { agent_id:a.id, pair:PAIRS[(i+4)%6], amount:parseFloat((15000+i*2000).toFixed(2)), direction:'BUY', fee:parseFloat(((15000+i*2000)*0.001).toFixed(4)), status:'CONFIRMED' },
    ]))
    try {
      const r = await fetch(`${url}/rest/v1/transactions`, {
        method: 'POST', headers,
        body: JSON.stringify(txs),
        signal: AbortSignal.timeout(5000),
      })
      results.push({ table: 'transactions', ok: r.ok, count: txs.length })
    } catch(e) {
      results.push({ table: 'transactions', ok: false, error: String(e) })
    }
  } else {
    results.push({ table: 'transactions', ok: true, count: 0 })
  }

  const allOk = results.filter(r => !r.ok).length === 0
  return NextResponse.json({
    ok: allOk,
    message: allOk ? 'Seed complete — data_source will switch to supabase' : 'Partial seed',
    agents_seeded: AGENTS.length,
    results,
    timestamp: new Date().toISOString(),
  })
}
