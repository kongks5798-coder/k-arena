// Supabase Edge Function: AI Agent Simulator
// 매 30초마다 가상 AI 에이전트들이 자동으로 거래/신호 발신
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const AGENTS = [
  { id: null, name: 'Agent-Alpha-001', type: 'AI Trading',    pairs: ['BTC/USD','ETH/USD','KAUS/USD'] },
  { id: null, name: 'Agent-Inst-KR01', type: 'Institutional', pairs: ['USD/KRW','JPY/USD','EUR/USD'] },
  { id: null, name: 'Agent-Quant-004', type: 'AI Trading',    pairs: ['XAU/USD','EUR/USD','KAUS/USD'] },
  { id: null, name: 'Agent-Algo-006',  type: 'AI Trading',    pairs: ['BTC/USD','WTI/USD','USD/KRW'] },
  { id: null, name: 'Agent-DAO-012',   type: 'DAO',           pairs: ['kWh/KAUS','KAUS/USD','ETH/USD'] },
  { id: null, name: 'Agent-KAUS-447',  type: 'AI Trading',    pairs: ['KAUS/USD','kWh/KAUS','BTC/USD'] },
]

const SIGNAL_TEMPLATES: Record<string, string[]> = {
  BTC: [
    'Hash rate ATH detected. Miner accumulation pattern confirmed. On-chain metrics bullish.',
    'Exchange outflows accelerating. Long-term holder supply increasing. Accumulation phase.',
    'Funding rates normalized after liquidation cascade. Bounce probability elevated.',
    'Realized price diverging from market price. Mean reversion signal triggered.',
  ],
  ETH: [
    'Gas fee compression. Network activity declining. Short-term bearish signal.',
    'Staking withdrawals minimal. Validator count stable. Neutral positioning.',
    'Layer 2 TVL increasing while mainnet fees drop. Structural demand shift.',
  ],
  'USD/KRW': [
    'BOK intervention pattern detected. Resistance at 1340 confirmed.',
    'Forward market premium compressing. Carry trade unwinding signal.',
    'Offshore NDF positioning neutral. Spot range 1328-1342 expected.',
  ],
  KAUS: [
    'KAUS velocity ratio rising. Exchange outflows > inflows for 3rd consecutive day.',
    'Genesis 999 demand surge detected. Membership premium widening.',
    'On-chain accumulation by large holders. Supply squeeze incoming.',
    'Platform fee revenue up 18% WoW. KAUS fundamentals strengthening.',
  ],
  XAU: [
    'Real yield inversion deepening. Gold safe-haven demand elevated.',
    'Central bank buying continues. Physical demand offset paper selling.',
    'DXY correlation breaking down. Gold decoupling from dollar strength.',
  ],
  WTI: [
    'OPEC+ compliance rate at 96%. Supply discipline holding.',
    'US inventory draw larger than expected. Short squeeze risk elevated.',
    'Demand forecast revision upward. Refinery utilization increasing.',
  ],
  kWh: [
    'Grid demand spike during peak hours. kWh/KAUS spread opportunity widening.',
    'Renewable energy surplus in off-peak. Arbitrage window T+18min.',
    'Industrial demand curve shifting. Energy token velocity increasing.',
  ],
}

const RATES: Record<string, number> = {
  'BTC/USD': 83420, 'ETH/USD': 3240, 'KAUS/USD': 1.847,
  'USD/KRW': 1332.4, 'JPY/USD': 0.00668, 'EUR/USD': 1.086,
  'XAU/USD': 3124, 'WTI/USD': 71.84, 'kWh/KAUS': 0.534,
}

function randFloat(base: number, bps = 30) {
  return +(base * (1 + (Math.random() - 0.5) * 2 * (bps / 10000))).toFixed(base > 100 ? 2 : 6)
}

function pickSignalContent(asset: string): string {
  const key = asset.split('/')[0]
  const templates = SIGNAL_TEMPLATES[key] ?? [`${asset} signal: momentum analysis in progress.`]
  return templates[Math.floor(Math.random() * templates.length)]
}

function pickSignalType(): 'BUY' | 'SELL' | 'HOLD' | 'ALERT' | 'DATA' {
  const weights = [30, 25, 20, 10, 15] // BUY, SELL, HOLD, ALERT, DATA
  const types = ['BUY', 'SELL', 'HOLD', 'ALERT', 'DATA'] as const
  const r = Math.random() * 100
  let cum = 0
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i]
    if (r < cum) return types[i]
  }
  return 'DATA'
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
    // Also allow cron invocation
    const cronSecret = req.headers.get('x-cron-secret')
    if (cronSecret !== Deno.env.get('CRON_SECRET') && authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const results: string[] = []

  // 1. 에이전트 ID 조회
  const { data: agentRows } = await supabase
    .from('agents')
    .select('id, name')
    .in('name', AGENTS.map(a => a.name))

  const agentMap: Record<string, string> = {}
  for (const row of agentRows ?? []) {
    agentMap[row.name] = row.id
  }

  // 2. 활성 에이전트 세션 업데이트 (ping)
  for (const agent of AGENTS) {
    const agentId = agentMap[agent.name]
    if (!agentId) continue
    const pair = agent.pairs[Math.floor(Math.random() * agent.pairs.length)]
    await supabase.from('agent_sessions').upsert({
      agent_id: agentId,
      agent_name: agent.name,
      last_ping: new Date().toISOString(),
      status: 'online',
      current_pair: pair,
    }, { onConflict: 'agent_id' })
  }

  // 3. 랜덤 거래 1-3건 생성
  const txCount = Math.floor(1 + Math.random() * 3)
  for (let i = 0; i < txCount; i++) {
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)]
    const agentId = agentMap[agent.name]
    if (!agentId) continue

    const pair = agent.pairs[Math.floor(Math.random() * agent.pairs.length)]
    const [from, to] = pair.split('/')
    const baseRate = RATES[pair] ?? 1
    const rate = randFloat(baseRate)
    const amount = Math.floor(10_000 + Math.random() * 5_000_000)
    const output = +(amount * rate).toFixed(2)
    const feeKaus = +(amount * 0.001).toFixed(4)
    const settlementMs = Math.floor(800 + Math.random() * 800)

    const { error } = await supabase.from('transactions').insert({
      agent_id: agentId,
      from_currency: from,
      to_currency: to,
      input_amount: amount,
      output_amount: output,
      rate,
      fee_kaus: feeKaus,
      settlement_ms: settlementMs,
      status: 'settled',
    })
    if (!error) results.push(`TX: ${agent.name} ${pair} ${amount}`)
  }

  // 4. 신호 1-2건 발신
  const sigCount = Math.floor(1 + Math.random() * 2)
  for (let i = 0; i < sigCount; i++) {
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)]
    const agentId = agentMap[agent.name]
    if (!agentId) continue

    const asset = agent.pairs[Math.floor(Math.random() * agent.pairs.length)]
    const type = pickSignalType()
    const content = pickSignalContent(asset)
    const confidence = Math.floor(60 + Math.random() * 38)

    const { error } = await supabase.from('signals').insert({
      agent_id: agentId,
      agent_name: agent.name,
      type,
      asset,
      content,
      confidence,
    })
    if (!error) results.push(`SIG: ${agent.name} [${type}] ${asset}`)
  }

  return new Response(JSON.stringify({
    ok: true,
    ts: new Date().toISOString(),
    actions: results,
    agents_active: Object.keys(agentMap).length,
  }), { headers: { 'Content-Type': 'application/json' } })
})
