import { NextResponse } from 'next/server'

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randF(min: number, max: number, dec = 4) { return parseFloat((Math.random() * (max - min) + min).toFixed(dec)) }

const PAIRS = [
  { pair: 'XAU/KAUS', basePrice: 2352, volatility: 0.008 },
  { pair: 'USD/KAUS', basePrice: 1.01, volatility: 0.003 },
  { pair: 'ETH/KAUS', basePrice: 3318, volatility: 0.025 },
  { pair: 'BTC/KAUS', basePrice: 87420, volatility: 0.018 },
  { pair: 'OIL/KAUS', basePrice: 81.3, volatility: 0.012 },
  { pair: 'EUR/KAUS', basePrice: 1.084, volatility: 0.004 },
]

const MOCK_AGENTS = [
  { id: 'AGT-0042', name: 'Apex Exchange Bot', org: 'Apex Capital', status: 'ONLINE', vol_24h: rand(120000, 200000), trades: rand(600, 1200), accuracy: randF(72, 82, 1) },
  { id: 'AGT-0117', name: 'Seoul FX Engine', org: 'Korea Finance', status: 'ONLINE', vol_24h: rand(80000, 150000), trades: rand(300, 700), accuracy: randF(65, 78, 1) },
  { id: 'AGT-0223', name: 'Gold Arbitrage AI', org: 'GoldTech Ltd', status: 'ONLINE', vol_24h: rand(50000, 110000), trades: rand(200, 450), accuracy: randF(78, 90, 1) },
  { id: 'AGT-0089', name: 'Euro Trade Node', org: 'EU Markets', status: 'ONLINE', vol_24h: rand(30000, 80000), trades: rand(150, 350), accuracy: randF(62, 76, 1) },
  { id: 'AGT-0156', name: 'Crypto Bridge Agent', org: 'DeFi Protocol', status: 'ONLINE', vol_24h: rand(100000, 180000), trades: rand(500, 900), accuracy: randF(74, 86, 1) },
  { id: 'AGT-0301', name: 'Energy Markets Bot', org: 'EnergyCorp', status: 'ONLINE', vol_24h: rand(25000, 65000), trades: rand(100, 250), accuracy: randF(58, 72, 1) },
]

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  let agents = MOCK_AGENTS
  let txCount = rand(800, 1400)
  let genesisSold = 12
  let dataSource = 'simulation'

  // Supabase 실데이터 시도
  if (supabaseUrl && supabaseKey) {
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 4000)

      const [agR, txR, gnR] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/agents?select=*&order=vol_24h.desc`, { headers, signal: controller.signal }),
        fetch(`${supabaseUrl}/rest/v1/transactions?select=id&order=created_at.desc&limit=1000`, { headers, signal: controller.signal }),
        fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id`, { headers, signal: controller.signal }),
      ])

      clearTimeout(timeout)

      if (agR.ok) {
        const agData = await agR.json()
        if (Array.isArray(agData) && agData.length > 0) {
          agents = agData
          dataSource = 'supabase'
        }
      }
      if (txR.ok) {
        const txData = await txR.json()
        if (Array.isArray(txData)) txCount = txData.length
      }
      if (gnR.ok) {
        const gnData = await gnR.json()
        if (Array.isArray(gnData)) genesisSold = gnData.length
      }
    } catch {
      // Supabase 실패 → mock 유지
    }
  }

  // 실시간 페어 가격 생성
  const now = Date.now()
  const pairs = PAIRS.map(p => ({
    pair: p.pair,
    price: parseFloat((p.basePrice * (1 + (Math.random() - 0.5) * p.volatility)).toFixed(p.basePrice > 100 ? 2 : 4)),
    change: randF(-2.5, 2.5, 3),
    vol: rand(500, 12000),
  }))

  // 시그널 생성 (페어 기반)
  const AGENT_NAMES = agents.map((a: { name: string }) => a.name)
  const signals = Array.from({ length: 12 }, (_, i) => ({
    id: `SIG-${String(1000 + i).padStart(4, '0')}`,
    pair: pairs[i % 6].pair,
    direction: Math.random() > 0.45 ? 'LONG' : 'SHORT',
    confidence: rand(55, 97),
    timestamp: new Date(now - rand(60000, 3600000)).toISOString(),
    source: AGENT_NAMES[i % AGENT_NAMES.length] || 'K-Arena AI',
    strength: ['WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG'][rand(0, 3)],
  }))

  const totalVol = agents.reduce((s: number, a: { vol_24h: number }) => s + (a.vol_24h || 0), 0)
  const activeAgents = agents.filter((a: { status: string }) => a.status === 'ONLINE').length
  const kausPrice = randF(0.98, 1.06, 4)

  return NextResponse.json({
    platform: {
      total_volume_24h: totalVol,
      active_agents: activeAgents,
      total_agents: agents.length,
      total_trades_24h: txCount,
      genesis_sold: genesisSold,
      genesis_total: 999,
      kaus_price: kausPrice,
      kaus_change_24h: randF(-3.5, 4.2, 2),
      uptime: '99.97%',
    },
    pairs,
    agents,
    signals,
    data_source: dataSource,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
