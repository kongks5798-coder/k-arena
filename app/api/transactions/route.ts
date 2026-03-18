import { NextResponse, NextRequest } from 'next/server'

const MOCK_AGENTS: Record<string, string> = {
  'AGT-0042': 'Apex Exchange Bot',
  'AGT-0117': 'Seoul FX Engine',
  'AGT-0223': 'Gold Arbitrage AI',
  'AGT-0089': 'Euro Trade Node',
  'AGT-0156': 'Crypto Bridge Agent',
  'AGT-0301': 'Energy Markets Bot',
}

const PAIRS = ['XAU/KAUS', 'USD/KAUS', 'ETH/KAUS', 'BTC/KAUS', 'OIL/KAUS', 'EUR/KAUS']
const AGENT_IDS = Object.keys(MOCK_AGENTS)

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randF(min: number, max: number, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)) }

function generateMockTx(index: number) {
  const agentId = AGENT_IDS[index % AGENT_IDS.length]
  const amount = randF(1000, 80000, 2)
  return {
    id: rand(10000, 99999),
    agent_id: agentId,
    agent_name: MOCK_AGENTS[agentId],
    pair: PAIRS[rand(0, 5)],
    amount,
    direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
    fee: parseFloat((amount * 0.001).toFixed(4)),
    status: 'CONFIRMED',
    created_at: new Date(Date.now() - index * rand(8000, 30000)).toISOString(),
  }
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const agentId = searchParams.get('agent_id')
  const pair = searchParams.get('pair')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      let url = `${supabaseUrl}/rest/v1/transactions?select=id,agent_id,from_currency,to_currency,input_amount,output_amount,rate,fee_kaus,settlement_ms,status,created_at&order=created_at.desc&limit=${limit}`
      if (agentId) url += `&agent_id=eq.${agentId}`

      const r = await fetch(url, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(4000),
      })

      if (r.ok) {
        const data = await r.json()
        if (Array.isArray(data) && data.length > 0) {
          // normalize to common shape for UI (pair = from/to, amount = input_amount)
          const enriched = data.map((tx: Record<string, unknown>) => ({
            ...tx,
            pair: tx.from_currency && tx.to_currency ? `${tx.from_currency}/${tx.to_currency}` : '—',
            amount: tx.input_amount,
            fee: tx.fee_kaus,
            agent_name: MOCK_AGENTS[tx.agent_id as string] || tx.agent_id,
          }))
          return NextResponse.json({
            transactions: enriched,
            count: enriched.length,
            source: 'supabase',
          }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
        }
      }
    } catch { /* fallback */ }
  }

  // Simulation fallback
  const txs = Array.from({ length: limit }, (_, i) => generateMockTx(i))
  return NextResponse.json({
    transactions: txs,
    count: txs.length,
    source: 'simulation',
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
}
