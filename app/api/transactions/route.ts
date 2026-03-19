import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randF(min: number, max: number, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)) }

const MOCK_AGENTS: Record<string, string> = {
  'AGT-0042': 'Apex Quant AI',
  'AGT-0117': 'Seoul FX Engine',
  'AGT-0223': 'Gold Arbitrage AI',
  'AGT-0089': 'Euro Sentinel',
  'AGT-0156': 'Energy Markets Bot',
  'AGT-0301': 'DeFi Oracle',
}
const PAIRS = ['XAU/KAUS', 'BTC/KAUS', 'ETH/KAUS', 'OIL/KAUS', 'EUR/KAUS']
const AGENT_IDS = Object.keys(MOCK_AGENTS)

function generateMockTx(index: number) {
  const agentId = AGENT_IDS[index % AGENT_IDS.length]
  const amount = randF(100, 5000, 2)
  return {
    id: rand(10000, 99999),
    agent_id: agentId,
    agent_name: MOCK_AGENTS[agentId],
    pair: PAIRS[rand(0, 4)],
    amount,
    direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
    rate: null,
    fee: parseFloat((amount * 0.001).toFixed(4)),
    status: 'CONFIRMED',
    created_at: new Date(Date.now() - index * rand(8000, 30000)).toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const agentId = searchParams.get('agent_id')
  const since   = searchParams.get('since')

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

  if (supabaseUrl && supabaseKey) {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

    try {
      // 1. Fetch transactions
      let txUrl = `${supabaseUrl}/rest/v1/transactions?select=id,agent_id,from_currency,to_currency,input_amount,output_amount,rate,fee_kaus,status,created_at&order=created_at.desc&limit=${limit}`
      if (agentId) txUrl += `&agent_id=eq.${agentId}`
      if (since)   txUrl += `&created_at=gte.${since}`

      const txRes = await fetch(txUrl, { headers: h, signal: AbortSignal.timeout(5000) })
      if (!txRes.ok) throw new Error('tx fetch failed')

      const txData: Array<Record<string, unknown>> = await txRes.json()
      if (!Array.isArray(txData) || txData.length === 0) throw new Error('no tx data')

      // 2. Fetch agent names for all unique agent_ids in this batch
      const agentIds = Array.from(new Set(txData.map(t => t.agent_id as string).filter(Boolean)))
      const agentNameMap: Record<string, string> = {}

      if (agentIds.length > 0) {
        try {
          const inClause = agentIds.map(id => `"${id}"`).join(',')
          const agRes = await fetch(
            `${supabaseUrl}/rest/v1/agents?select=id,name&id=in.(${agentIds.join(',')})`,
            { headers: h, signal: AbortSignal.timeout(4000) },
          )
          if (agRes.ok) {
            const agData: Array<{ id: string; name: string }> = await agRes.json()
            for (const a of agData) agentNameMap[a.id] = a.name
            void inClause // suppress unused warning
          }
        } catch {}
      }

      const enriched = txData.map(tx => ({
        ...tx,
        pair: tx.from_currency && tx.to_currency
          ? `${tx.from_currency}/${tx.to_currency}`
          : '—',
        amount:     tx.input_amount,
        fee:        tx.fee_kaus,
        agent_name: agentNameMap[tx.agent_id as string]
          ?? MOCK_AGENTS[tx.agent_id as string]
          ?? null,
      }))

      return NextResponse.json({
        transactions: enriched,
        count:        enriched.length,
        source:       'supabase',
      }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })

    } catch { /* fallback below */ }
  }

  // Simulation fallback
  const txs = Array.from({ length: limit }, (_, i) => generateMockTx(i))
  return NextResponse.json({
    transactions: txs,
    count:        txs.length,
    source:       'simulation',
  }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
}
