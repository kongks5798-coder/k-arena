import { NextResponse } from 'next/server'
function rand(min: number, max: number) { return Math.floor(Math.random()*(max-min+1))+min }
function randFloat(min: number, max: number, dec=4) { return parseFloat((Math.random()*(max-min)+min).toFixed(dec)) }
const BASE_AGENTS = [
  { id:'AGT-0042', name:'Apex Exchange Bot', org:'Apex Capital', status:'ONLINE', vol_24h:147354, trades:1071, accuracy:76.4 },
  { id:'AGT-0117', name:'Seoul FX Engine', org:'Korea Finance', status:'ONLINE', vol_24h:98450, trades:660, accuracy:71.2 },
  { id:'AGT-0223', name:'Gold Arbitrage AI', org:'GoldTech Ltd', status:'ONLINE', vol_24h:67320, trades:327, accuracy:83.1 },
  { id:'AGT-0089', name:'Euro Trade Node', org:'EU Markets', status:'ONLINE', vol_24h:43180, trades:198, accuracy:68.9 },
  { id:'AGT-0156', name:'Crypto Bridge Agent', org:'DeFi Protocol', status:'ONLINE', vol_24h:124560, trades:634, accuracy:79.5 },
  { id:'AGT-0301', name:'Energy Markets Bot', org:'EnergyCorp', status:'ONLINE', vol_24h:38920, trades:156, accuracy:64.3 },
]
export async function GET() {
  const now = Date.now()
  const sb = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  type Agent = { id:string; name:string; org:string; status:string; vol_24h:number; trades:number; accuracy:number }
  let agents: Agent[] = BASE_AGENTS.map(a=>({...a,vol_24h:rand(a.vol_24h*0.8,a.vol_24h*1.2),trades:rand(a.trades*0.9,a.trades*1.1),accuracy:randFloat(a.accuracy-3,a.accuracy+3,1)}))
  let txCount = rand(400,1200), genesis = 12, dataSource = 'simulation'
  if (sb && key) {
    try {
      const [agRes,txRes,gnRes] = await Promise.all([
        fetch(`${sb}/rest/v1/agents?select=*&order=vol_24h.desc`,{headers:{apikey:key,Authorization:`Bearer ${key}`}}),
        fetch(`${sb}/rest/v1/transactions?select=id&created_at=gte.${new Date(Date.now()-86400000).toISOString()}&limit=1000`,{headers:{apikey:key,Authorization:`Bearer ${key}`}}),
        fetch(`${sb}/rest/v1/genesis_members?select=id`,{headers:{apikey:key,Authorization:`Bearer ${key}`}}),
      ])
      if(agRes.ok){const d=await agRes.json();if(d?.length>0){agents=d;dataSource='supabase'}}
      if(txRes.ok){const d=await txRes.json();if(d?.length>0)txCount=d.length}
      if(gnRes.ok){const d=await gnRes.json();if(d?.length>0)genesis=d.length}
    } catch { /* fallback */ }
  }
  const pairs = [
    {pair:'XAU/KAUS',price:randFloat(2340,2360,2),change:randFloat(-0.8,1.2,3),vol:rand(1200,2800)},
    {pair:'USD/KAUS',price:randFloat(0.98,1.02,4),change:randFloat(-0.3,0.5,3),vol:rand(5000,12000)},
    {pair:'ETH/KAUS',price:randFloat(3200,3400,2),change:randFloat(-2.1,3.5,3),vol:rand(800,1800)},
    {pair:'BTC/KAUS',price:randFloat(85000,92000,0),change:randFloat(-1.5,2.8,3),vol:rand(400,900)},
    {pair:'OIL/KAUS',price:randFloat(78,84,2),change:randFloat(-1.2,1.8,3),vol:rand(600,1400)},
    {pair:'EUR/KAUS',price:randFloat(1.07,1.11,4),change:randFloat(-0.4,0.6,3),vol:rand(3000,7000)},
  ]
  const signals = Array.from({length:12},(_,i)=>({
    id:`SIG-${String(1000+i).padStart(4,'0')}`,pair:pairs[i%6].pair,
    direction:Math.random()>0.45?'LONG':'SHORT',confidence:rand(55,97),
    timestamp:new Date(now-rand(60000,3600000)).toISOString(),source:agents[i%agents.length].name,
  }))
  const totalVol = agents.reduce((s,a)=>s+a.vol_24h,0)
  return NextResponse.json({
    platform:{total_volume_24h:totalVol,active_agents:agents.filter(a=>a.status==='ONLINE').length,total_agents:agents.length,total_trades_24h:txCount,genesis_sold:genesis,genesis_total:999,kaus_price:randFloat(0.98,1.04,4),kaus_change_24h:randFloat(-2,3.5,2),uptime:'99.97%'},
    pairs,agents,signals,data_source:dataSource,timestamp:new Date().toISOString(),
  },{headers:{'Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'}})
}
