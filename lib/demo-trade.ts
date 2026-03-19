const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://karena.fieldnine.io'

// 현재 시장 가격 (price_cache에서 읽어옴)
const PRICE_FALLBACK: Record<string, number> = {
  BTC: 87420, ETH: 3318, XAU: 2352, WTI: 81.3, EUR: 1.085, USD: 1.0,
}

async function getMarketRates(supabaseUrl: string, supabaseKey: string): Promise<Record<string, number>> {
  try {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const res = await fetch(
      `${supabaseUrl}/rest/v1/price_cache?select=symbol,price&limit=10`,
      { headers: h, signal: AbortSignal.timeout(2000) }
    )
    if (!res.ok) return PRICE_FALLBACK
    const rows: Array<{ symbol: string; price: number }> = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) return PRICE_FALLBACK
    const map: Record<string, number> = { ...PRICE_FALLBACK }
    for (const r of rows) map[r.symbol] = parseFloat(String(r.price))
    return map
  } catch {
    return PRICE_FALLBACK
  }
}

function pairToRate(pair: string, rates: Record<string, number>): number {
  const [from] = pair.split('/')
  const sym = from === 'OIL' ? 'WTI' : from
  return rates[sym] ?? 1
}

// 에이전트별 선호 페어 (이름 기반)
const AGENT_PAIRS: Record<string, string[]> = {
  'Alpha Prime':        ['BTC/KAUS', 'BTC/KAUS', 'ETH/KAUS'],
  'AlgoStrike-6':       ['BTC/KAUS', 'XAU/KAUS', 'ETH/KAUS'],
  'Gold Arbitrage AI':  ['XAU/KAUS', 'XAU/KAUS', 'BTC/KAUS'],
  'Euro Sentinel':      ['EUR/KAUS', 'EUR/KAUS', 'USD/KAUS'],
  'Euro Trade Node':    ['EUR/KAUS', 'EUR/KAUS', 'USD/KAUS'],
  'Energy Markets Bot': ['OIL/KAUS', 'OIL/KAUS', 'XAU/KAUS'],
  'Seoul FX Engine':    ['ETH/KAUS', 'ETH/KAUS', 'BTC/KAUS'],
  'Seoul Quant':        ['ETH/KAUS', 'BTC/KAUS', 'XAU/KAUS'],
  'DeFi Oracle':        ['ETH/KAUS', 'BTC/KAUS', 'ETH/KAUS'],
  'Sovereign AI Fund':  ['XAU/KAUS', 'USD/KAUS', 'EUR/KAUS'],
}

// 기본 페어 분포 (30% BTC, 20% XAU, 20% ETH, 15% EUR, 15% OIL)
const DEFAULT_PAIRS = [
  'BTC/KAUS', 'BTC/KAUS', 'BTC/KAUS',
  'XAU/KAUS', 'XAU/KAUS',
  'ETH/KAUS', 'ETH/KAUS',
  'EUR/KAUS', 'EUR/KAUS',
  'OIL/KAUS', 'OIL/KAUS',
  'USD/KAUS',
]

const DIRECTIONS = ['BUY', 'SELL'] as const

interface AgentRow {
  id: string
  name: string
}

async function executeOneTrade(
  agentRow: AgentRow,
  seed: number,
  rates: Record<string, number>,
): Promise<{ ok: boolean; pair?: string; amount?: number; fee?: number; reason?: string; detail?: unknown }> {
  const pairList = AGENT_PAIRS[agentRow.name] ?? DEFAULT_PAIRS
  const pair = pairList[seed % pairList.length]
  const direction = DIRECTIONS[seed % 2]
  const amount = 10 + (seed % 91) // $10–$100
  const baseRate = pairToRate(pair, rates)
  const slippage = 1 + (Math.random() - 0.5) * 0.016 // ±0.8% slippage
  const rate = parseFloat((baseRate * slippage).toFixed(6))

  try {
    const res = await fetch(`${BASE_URL}/api/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentRow.id, pair, amount, direction, rate }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    if (!data.success) return { ok: false, reason: 'trade-failed', detail: data }
    return { ok: true, pair, amount, fee: data.fee }
  } catch (e) {
    return { ok: false, reason: 'error', detail: String(e) }
  }
}

export async function runDemoTrade() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) return { ok: false, reason: 'no-db' }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  // 에이전트 목록 조회 (ONLINE 우선, 최대 12개)
  let agents: AgentRow[] = []
  try {
    const agRes = await fetch(
      `${supabaseUrl}/rest/v1/agents?select=id,name&is_active=eq.true&limit=16&order=trades.asc`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    )
    if (agRes.ok) agents = await agRes.json()
  } catch {}

  if (agents.length === 0) return { ok: false, reason: 'no-agents' }

  // 현재 시장 가격 조회
  const rates = await getMarketRates(supabaseUrl, supabaseKey)

  // 이번 cron 실행에서 3개 에이전트가 각각 1건씩 거래 (다양성)
  const now = Date.now()
  const batchSize = Math.min(3, agents.length)
  const results = []

  for (let i = 0; i < batchSize; i++) {
    const agentIdx = (Math.floor(now / 1000) + i * 7) % agents.length
    const agent = agents[agentIdx]
    const seed = Math.floor(now / 1000) + i * 13
    const result = await executeOneTrade(agent, seed, rates)
    results.push({ agent: agent.name, ...result })
  }

  const succeeded = results.filter(r => r.ok).length
  return {
    ok: succeeded > 0,
    trades: results,
    succeeded,
    total: batchSize,
    timestamp: new Date().toISOString(),
  }
}
