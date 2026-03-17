import { NextResponse } from 'next/server'

function rand(min: number, max: number) { return Math.floor(Math.random()*(max-min+1))+min }
function randFloat(min: number, max: number, dec=4) { return parseFloat((Math.random()*(max-min)+min).toFixed(dec)) }

const MOCK_AGENTS = [
  { id:'AGT-0042', name:'Apex Exchange Bot', org:'Apex Capital', status:'ONLINE', vol_24h:rand(80000,250000), trades:rand(400,1200), accuracy:randFloat(62,89,1) },
  { id:'AGT-0117', name:'Seoul FX Engine', org:'Korea Finance', status:'ONLINE', vol_24h:rand(50000,180000), trades:rand(200,800), accuracy:randFloat(58,85,1) },
  { id:'AGT-0223', name:'Gold Arbitrage AI', org:'GoldTech Ltd', status:'ONLINE', vol_24h:rand(30000,120000), trades:rand(100,500), accuracy:randFloat(60,92,1) },
  { id:'AGT-0089', name:'Euro Trade Node', org:'EU Markets', status:'ONLINE', vol_24h:rand(20000,90000), trades:rand(80,350), accuracy:randFloat(55,80,1) },
  { id:'AGT-0156', name:'Crypto Bridge Agent', org:'DeFi Protocol', status:'ONLINE', vol_24h:rand(60000,200000), trades:rand(300,900), accuracy:randFloat(63,88,1) },
  { id:'AGT-0301', name:'Energy Markets Bot', org:'EnergyCorp', status:'ONLINE', vol_24h:rand(15000,70000), trades:rand(50,250), accuracy:randFloat(52,78,1) },
]

export async function GET() {
  const now = Date.now()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  let agents = MOCK_AGENTS
  let txCount = rand(400, 1200)

  // Supabase 연동 (ENV 있을 때)
  if (supabaseUrl && supabaseKey) {
    try {
      const [agentsRes, txRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/agents?select=*`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/transactions?select=id&created_at=gte.${new Date(Date.now()-86400000).toISOString()}`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        }),
      ])
      if (agentsRes.ok) { const d = await agentsRes.json(); if (d.length > 0) agents = d }
      if (txRes.ok) { const d = await txRes.json(); txCount = d.length || txCount }
    } catch { /* fallback to mock */ }
  }

  const pairs = [
    { pair:'XAU/KAUS', price:randFloat(2340,2360,2), change:randFloat(-0.8,1.2,3), vol:rand(1200,2800) },
    { pair:'USD/KAUS', price:randFloat(0.98,1.02,4), change:randFloat(-0.3,0.5,3), vol:rand(5000,12000) },
    { pair:'ETH/KAUS', price:randFloat(3200,3400,2), change:randFloat(-2.1,3.5,3), vol:rand(800,1800) },
    { pair:'BTC/KAUS', price:randFloat(85000,92000,0), change:randFloat(-1.5,2.8,3), vol:rand(400,900) },
    { pair:'OIL/KAUS', price:randFloat(78,84,2), change:randFloat(-1.2,1.8,3), vol:rand(600,1400) },
    { pair:'EUR/KAUS', price:randFloat(1.07,1.11,4), change:randFloat(-0.4,0.6,3), vol:rand(3000,7000) },
  ]

  const signals = Array.from({length:12},(_,i)=>({
    id:`SIG-${String(1000+i).padStart(4,'0')}`,
    pair:pairs[i%pairs.length].pair,
    direction:Math.random()>0.45?'LONG':'SHORT',
    confidence:rand(55,97),
    timestamp:new Date(now-rand(60000,3600000)).toISOString(),
    source:agents[i%agents.length]?.name || 'Unknown',
  }))

  const totalVol = agents.reduce((s:number,a:{ vol_24h:number })=>s+a.vol_24h, 0)
  const activeAgents = agents.filter((a:{ status:string })=>a.status==='ONLINE').length

  return NextResponse.json({
    platform:{
      total_volume_24h:totalVol, active_agents:activeAgents,
      total_agents:agents.length, total_trades_24h:txCount,
      genesis_sold:12, genesis_total:999,
      kaus_price:randFloat(0.98,1.04,4),
      kaus_change_24h:randFloat(-2,3.5,2),
      uptime:'99.97%',
    },
    pairs, agents, signals,
    data_source: supabaseUrl ? 'supabase' : 'simulation',
    timestamp:new Date().toISOString(),
  },{ headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'} })
}
