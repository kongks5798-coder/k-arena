import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

const AGENTS = [
  { name: 'Agent-Alpha-001', pairs: ['BTC/USD','ETH/USD','KAUS/USD'] },
  { name: 'Agent-Inst-KR01', pairs: ['USD/KRW','JPY/USD','EUR/USD'] },
  { name: 'Agent-Quant-004', pairs: ['XAU/USD','EUR/USD','KAUS/USD'] },
  { name: 'Agent-Algo-006',  pairs: ['BTC/USD','WTI/USD','USD/KRW'] },
  { name: 'Agent-DAO-012',   pairs: ['kWh/KAUS','KAUS/USD','ETH/USD'] },
  { name: 'Agent-KAUS-447',  pairs: ['KAUS/USD','kWh/KAUS','BTC/USD'] },
]

const RATES: Record<string, number> = {
  'BTC/USD':83420,'ETH/USD':3240,'KAUS/USD':1.847,
  'USD/KRW':1332.4,'JPY/USD':0.00668,'EUR/USD':1.086,
  'XAU/USD':3124,'WTI/USD':71.84,'kWh/KAUS':0.534,
}

const SIG_TEMPLATES: Record<string, string[]> = {
  BTC: ['Hash rate ATH. Miner accumulation confirmed.','Exchange outflows accelerating. Bullish signal.','Funding rates normalized. Bounce probability elevated.'],
  ETH: ['Gas fees compressing. Network activity declining.','Staking withdrawals minimal. Neutral positioning.'],
  USD: ['BOK intervention pattern detected.','Forward market premium compressing.','Offshore NDF positioning neutral.'],
  KAUS: ['KAUS velocity ratio rising. Outflows > inflows.','Genesis 999 demand surge detected.','On-chain accumulation by large holders.','Platform fee revenue up 18% WoW.'],
  XAU: ['Real yield inversion deepening.','Central bank buying continues.'],
  WTI: ['OPEC+ compliance at 96%. Supply discipline.','US inventory draw larger than expected.'],
  kWh: ['Grid demand spike. kWh/KAUS spread widening.','Renewable surplus in off-peak. Arbitrage window.'],
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randFloat(base: number) { return +(base * (1 + (Math.random() - 0.5) * 0.001)).toFixed(base > 100 ? 2 : 6) }
function sigType(): string { return pick(['BUY','BUY','SELL','HOLD','DATA','ALERT']) }
function sigContent(asset: string): string {
  const key = asset.split('/')[0]
  const t = SIG_TEMPLATES[key] ?? [`${asset} analysis in progress.`]
  return pick(t)
}

export async function POST() {
  const db = getDB()
  const results: string[] = []

  if (!db) return NextResponse.json({ ok: true, mode: 'demo', msg: 'Supabase not connected' })

  // 에이전트 ID 조회
  const { data: agentRows } = await db.from('agents').select('id,name').in('name', AGENTS.map(a => a.name))
  const agentMap: Record<string,string> = {}
  for (const row of agentRows ?? []) agentMap[row.name] = row.id

  // 세션 업데이트
  for (const agent of AGENTS) {
    const id = agentMap[agent.name]
    if (!id) continue
    const pair = pick(agent.pairs)
    await db.from('agent_sessions').upsert({ agent_id: id, agent_name: agent.name, last_ping: new Date().toISOString(), status: 'online', current_pair: pair }, { onConflict: 'agent_id' })
  }

  // 거래 1-2건
  const txCount = Math.floor(1 + Math.random() * 2)
  for (let i = 0; i < txCount; i++) {
    const agent = pick(AGENTS)
    const id = agentMap[agent.name]
    if (!id) continue
    const pair = pick(agent.pairs)
    const [from, to] = pair.split('/')
    const rate = randFloat(RATES[pair] ?? 1)
    const amount = Math.floor(10000 + Math.random() * 2000000)
    await db.from('transactions').insert({ agent_id: id, from_currency: from, to_currency: to, input_amount: amount, output_amount: +(amount*rate).toFixed(2), rate, fee_kaus: +(amount*0.001).toFixed(4), settlement_ms: Math.floor(800+Math.random()*800), status: 'settled' })
    results.push(`TX:${agent.name}:${pair}:${amount}`)
  }

  // 신호 1건
  const agent = pick(AGENTS)
  const id = agentMap[agent.name]
  if (id) {
    const asset = pick(agent.pairs)
    await db.from('signals').insert({ agent_id: id, agent_name: agent.name, type: sigType(), asset, content: sigContent(asset), confidence: Math.floor(60 + Math.random() * 38) })
    results.push(`SIG:${agent.name}:${asset}`)
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString(), actions: results })
}

// GET — 수동 트리거
export async function GET() { return POST() }
