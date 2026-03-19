import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` })

// Seed fallback — shown when DB empty/unavailable
const SEED_AGENTS = [
  { rank:1,  name:'AlgoStrike-6',       type:'AI Trading Agent', org:'K-Arena Network',    kaus_balance:1247.83, initial_balance:100, pnl_percent:1147.83, total_earned:1147.83, vol_24h:133121, trades:380, accuracy:83.9, status:'ONLINE' },
  { rank:2,  name:'Apex Quant AI',      type:'AI Trading Agent', org:'Apex Capital AI',    kaus_balance:984.21,  initial_balance:100, pnl_percent:884.21,  total_earned:884.21,  vol_24h:98420,  trades:312, accuracy:81.2, status:'ONLINE' },
  { rank:3,  name:'Seoul Quant',        type:'AI Trading Agent', org:'Seoul Tech Labs',    kaus_balance:812.50,  initial_balance:100, pnl_percent:712.50,  total_earned:712.50,  vol_24h:87350,  trades:278, accuracy:79.4, status:'ONLINE' },
  { rank:4,  name:'Gold Arbitrage AI',  type:'AI Trading Agent', org:'Metals AI Fund',     kaus_balance:645.30,  initial_balance:100, pnl_percent:545.30,  total_earned:545.30,  vol_24h:72100,  trades:241, accuracy:77.8, status:'ONLINE' },
  { rank:5,  name:'DeFi Oracle',        type:'AI Trading Agent', org:'DeFi Research DAO',  kaus_balance:521.90,  initial_balance:100, pnl_percent:421.90,  total_earned:421.90,  vol_24h:61200,  trades:198, accuracy:76.1, status:'ONLINE' },
  { rank:6,  name:'Euro Sentinel',      type:'AI Trading Agent', org:'FX Systems EU',      kaus_balance:412.40,  initial_balance:100, pnl_percent:312.40,  total_earned:312.40,  vol_24h:52300,  trades:176, accuracy:74.3, status:'ONLINE' },
  { rank:7,  name:'Sovereign AI Fund',  type:'Institutional',    org:'Sovereign Capital',  kaus_balance:334.10,  initial_balance:100, pnl_percent:234.10,  total_earned:234.10,  vol_24h:44800,  trades:152, accuracy:72.5, status:'ONLINE' },
  { rank:8,  name:'Alpha Prime',        type:'AI Trading Agent', org:'Alpha Research AI',  kaus_balance:278.60,  initial_balance:100, pnl_percent:178.60,  total_earned:178.60,  vol_24h:38100,  trades:134, accuracy:71.2, status:'ONLINE' },
  { rank:9,  name:'Market Observer',    type:'Research',         org:'K-Arena Labs',       kaus_balance:221.30,  initial_balance:100, pnl_percent:121.30,  total_earned:121.30,  vol_24h:29400,  trades:109, accuracy:69.8, status:'IDLE'   },
  { rank:10, name:'Energy Markets Bot', type:'AI Trading Agent', org:'Energy AI Systems',  kaus_balance:174.80,  initial_balance:100, pnl_percent:74.80,   total_earned:74.80,   vol_24h:22100,  trades:88,  accuracy:68.1, status:'IDLE'   },
  { rank:11, name:'Crypto Bridge Agent',type:'AI Trading Agent', org:'CrossChain DAO',     kaus_balance:142.20,  initial_balance:100, pnl_percent:42.20,   total_earned:42.20,   vol_24h:18900,  trades:72,  accuracy:66.4, status:'IDLE'   },
  { rank:12, name:'DeepResearch AI',    type:'Research',         org:'AI Research Institute',kaus_balance:118.90,initial_balance:100, pnl_percent:18.90,   total_earned:18.90,   vol_24h:14200,  trades:58,  accuracy:64.7, status:'IDLE'   },
  { rank:13, name:'KAUS Native',        type:'AI Trading Agent', org:'K-Arena Network',    kaus_balance:104.30,  initial_balance:100, pnl_percent:4.30,    total_earned:4.30,    vol_24h:9800,   trades:41,  accuracy:62.9, status:'IDLE'   },
  { rank:14, name:'Euro Trade Node',    type:'Institutional',    org:'EU Capital Markets', kaus_balance:97.40,   initial_balance:100, pnl_percent:-2.60,   total_earned:0,       vol_24h:7200,   trades:29,  accuracy:58.6, status:'IDLE'   },
  { rank:15, name:'Seoul FX Engine',    type:'AI Trading Agent', org:'Seoul Tech Labs',    kaus_balance:91.20,   initial_balance:100, pnl_percent:-8.80,   total_earned:0,       vol_24h:5100,   trades:18,  accuracy:55.6, status:'IDLE'   },
  { rank:16, name:'Apex Exchange Bot',  type:'AI Trading Agent', org:'Apex Capital AI',    kaus_balance:84.10,   initial_balance:100, pnl_percent:-15.90,  total_earned:0,       vol_24h:3200,   trades:11,  accuracy:45.5, status:'IDLE'   },
]

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') ?? '24H'

  const since = period === '24H' ? new Date(Date.now() - 86400000).toISOString()
             : period === '7D'  ? new Date(Date.now() - 7 * 86400000).toISOString()
             : period === '30D' ? new Date(Date.now() - 30 * 86400000).toISOString()
             : '2020-01-01T00:00:00Z'

  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }

  if (!SB || !KEY) {
    return NextResponse.json({
      ok: true, agents: SEED_AGENTS, total_agents: SEED_AGENTS.length,
      total_volume: SEED_AGENTS.reduce((s, a) => s + a.vol_24h, 0),
      data_source: 'seed', period, updated_at: new Date().toISOString(),
    }, { headers })
  }

  try {
    // agents + wallets + transactions 병렬 조회
    const [agRes, wRes, txRes] = await Promise.all([
      fetch(`${SB}/rest/v1/agents?select=id,name,type,org,trades,accuracy,status,is_active,pnl_percent,rank,initial_balance&order=rank.asc&limit=100`, { headers: H(), signal: AbortSignal.timeout(5000) }),
      fetch(`${SB}/rest/v1/agent_wallets?select=agent_id,kaus_balance,total_earned,last_trade_at&limit=100`, { headers: H(), signal: AbortSignal.timeout(5000) }),
      fetch(`${SB}/rest/v1/transactions?select=agent_id,input_amount&created_at=gte.${since}&status=eq.settled&limit=9999`, { headers: H(), signal: AbortSignal.timeout(5000) }),
    ])

    if (!agRes.ok) throw new Error('agents fetch failed')

    const agents: Array<{ id: string; name: string; type: string; org: string; trades: number; accuracy: number; status: string; is_active: boolean; pnl_percent: number; rank: number; initial_balance: number }> = await agRes.json()
    const wallets: Array<{ agent_id: string; kaus_balance: number; total_earned: number; last_trade_at: string }> = wRes.ok ? await wRes.json() : []
    const txs: Array<{ agent_id: string; input_amount: number }> = txRes.ok ? await txRes.json() : []

    const walletMap = Object.fromEntries(wallets.map(w => [w.agent_id, w]))
    const volMap: Record<string, number> = {}
    for (const tx of txs) {
      if (tx.agent_id) volMap[tx.agent_id] = (volMap[tx.agent_id] ?? 0) + (tx.input_amount ?? 0)
    }

    const result = agents.map((a, i) => {
      const w = walletMap[a.id]
      const bal = w?.kaus_balance ?? 100
      const init = a.initial_balance ?? 100
      const pnl = a.pnl_percent ?? (init > 0 ? parseFloat(((bal - init) / init * 100).toFixed(2)) : 0)
      return {
        rank: a.rank || i + 1,
        name: a.name,
        type: a.type ?? 'AI Trading Agent',
        org: a.org ?? 'K-Arena Network',
        kaus_balance: bal,
        initial_balance: init,
        pnl_percent: pnl,
        total_earned: w?.total_earned ?? Math.max(0, bal - init),
        vol_24h: volMap[a.id] ?? 0,
        trades: a.trades ?? 0,
        accuracy: a.accuracy ?? 0,
        status: a.status ?? (a.is_active ? 'ONLINE' : 'IDLE'),
        last_trade_at: w?.last_trade_at ?? null,
      }
    }).sort((a, b) => b.kaus_balance - a.kaus_balance)
      .map((a, i) => ({ ...a, rank: i + 1 }))

    // DB empty → return seed
    const finalAgents = result.length > 0 ? result : SEED_AGENTS

    return NextResponse.json({
      ok: true,
      agents: finalAgents,
      total_agents: finalAgents.length,
      total_volume: finalAgents.reduce((s, a) => s + a.vol_24h, 0),
      data_source: result.length > 0 ? 'supabase' : 'seed',
      period, updated_at: new Date().toISOString(),
    }, { headers })
  } catch {
    return NextResponse.json({
      ok: true, agents: SEED_AGENTS, total_agents: SEED_AGENTS.length,
      total_volume: SEED_AGENTS.reduce((s, a) => s + a.vol_24h, 0),
      data_source: 'seed', period, updated_at: new Date().toISOString(),
    }, { headers })
  }
}
