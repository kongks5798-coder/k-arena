'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Agent {
  id: string; name: string; type: string; is_genesis: boolean
  is_active: boolean; daily_limit: number; asset_classes: string[]
  created_at: string; volume?: number; trades?: number; rank?: number
  wallet?: string; uptime?: number; latency?: number
}

const DEMO: Agent[] = [
  { id:'1', name:'Agent-Alpha-001',    type:'AI Trading',    is_genesis:true,  is_active:true, daily_limit:1e9, asset_classes:['FX','CRYPTO','COMM'], created_at:'2026-01-01', volume:847e6, trades:2847, rank:1, wallet:'0x3f4a...91bc', uptime:99.97, latency:0.8 },
  { id:'2', name:'Agent-Inst-KR01',    type:'Institutional', is_genesis:true,  is_active:true, daily_limit:9.9e9,asset_classes:['FX','COMM'],         created_at:'2026-01-02', volume:620e6, trades:142,  rank:2, wallet:'0xINST...001', uptime:99.99, latency:0.4 },
  { id:'3', name:'Agent-Inst-EU01',    type:'Institutional', is_genesis:true,  is_active:true, daily_limit:9.9e9,asset_classes:['FX','COMM'],         created_at:'2026-01-03', volume:590e6, trades:98,   rank:3, wallet:'0xEU01...002', uptime:99.98, latency:0.5 },
  { id:'4', name:'Agent-Quant-004',    type:'AI Trading',    is_genesis:true,  is_active:true, daily_limit:500e6,asset_classes:['FX','CRYPTO','NRG'], created_at:'2026-01-04', volume:380e6, trades:1204, rank:4, wallet:'0x8b2c...44ef', uptime:99.91, latency:1.1 },
  { id:'5', name:'Agent-Obs-005',      type:'Institutional', is_genesis:true,  is_active:true, daily_limit:5e9, asset_classes:['FX'],                created_at:'2026-01-05', volume:310e6, trades:47,   rank:5, wallet:'0xOBS5...003', uptime:99.95, latency:0.6 },
  { id:'6', name:'Agent-Algo-006',     type:'AI Trading',    is_genesis:false, is_active:true, daily_limit:200e6,asset_classes:['FX','COMM'],         created_at:'2026-01-06', volume:210e6, trades:892,  rank:6, wallet:'0x1d7e...c3a2', uptime:99.82, latency:1.4 },
  { id:'7', name:'Agent-DAO-012',      type:'DAO',           is_genesis:false, is_active:true, daily_limit:100e6,asset_classes:['ENERGY','CRYPTO'],   created_at:'2026-01-07', volume:84e6,  trades:341,  rank:7, wallet:'0x5f9d...77aa', uptime:98.70, latency:2.1 },
  { id:'8', name:'Agent-KAUS-447',     type:'AI Trading',    is_genesis:false, is_active:true, daily_limit:50e6, asset_classes:['KAUS','NRG','CRYPTO'],created_at:'2026-01-08', volume:32e6,  trades:1847, rank:8, wallet:'0xKAUS...447', uptime:99.44, latency:0.9 },
]

const TYPE_OPTS = ['ALL','AI Trading','Institutional','DAO']

export default function AgentsPage() {
  const [agents, setAgents] = useState(DEMO)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('VOLUME')
  const [selected, setSelected] = useState<Agent|null>(null)
  const [onlineCount, setOnlineCount] = useState(2847)

  useEffect(() => {
    fetch('/api/agents?limit=20').then(r=>r.json()).then(d=>{ if(d.ok&&d.agents?.length>3) setAgents(d.agents) }).catch(()=>{})
    const t = setInterval(() => setOnlineCount(c => c + Math.floor(Math.random()*2)), 6000)
    return () => clearInterval(t)
  }, [])

  const filtered = agents
    .filter(a => (filter==='ALL'||a.type===filter) && (!search||a.name.toLowerCase().includes(search.toLowerCase())||a.wallet?.includes(search)))
    .sort((a,b) => {
      if (sort==='VOLUME') return (b.volume??0)-(a.volume??0)
      if (sort==='TRADES') return (b.trades??0)-(a.trades??0)
      if (sort==='LATENCY') return (a.latency??99)-(b.latency??99)
      return 0
    })

  const fmt = (n: number) => n>=1e9?`$${(n/1e9).toFixed(1)}B`:n>=1e6?`$${(n/1e6).toFixed(0)}M`:`$${n.toFixed(0)}`

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--black)' }}>
      <Topbar rightContent={
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'dot-pulse 2s infinite' }}/>
          <span style={{ fontSize:9, color:'var(--green)', letterSpacing:'0.1em' }}>{onlineCount.toLocaleString()} ONLINE</span>
        </div>
      }/>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar/>
        <main style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Agent list */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* Demo banner */}
            <div style={{ padding:'5px 20px', background:'var(--amber-dim)', borderBottom:'1px solid rgba(255,184,0,0.2)', fontSize:9, color:'var(--amber)', letterSpacing:'0.1em' }}>
              ⚠ DEMO — Agent names anonymized. Not affiliated with any real institution.
            </div>

            {/* Filter bar */}
            <div style={{ display:'flex', gap:8, borderBottom:'1px solid var(--border)', padding:'8px 20px', alignItems:'center', height:44 }}>
              <div style={{ display:'flex', gap:1 }}>
                {TYPE_OPTS.map(t => (
                  <button key={t} onClick={()=>setFilter(t)} style={{ fontSize:9, padding:'4px 10px', letterSpacing:'0.08em', background:filter===t?'var(--surface-3)':'transparent', color:filter===t?'var(--white)':'var(--dimmer)', border:`1px solid ${filter===t?'var(--border-mid)':'transparent'}`, cursor:'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ width:1, background:'var(--border)', height:20 }}/>
              <span style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.1em' }}>SORT:</span>
              {['VOLUME','TRADES','LATENCY'].map(s => (
                <button key={s} onClick={()=>setSort(s)} style={{ fontSize:9, padding:'4px 10px', letterSpacing:'0.08em', background:sort===s?'var(--surface-3)':'transparent', color:sort===s?'var(--white)':'var(--dimmer)', border:`1px solid ${sort===s?'var(--border-mid)':'transparent'}`, cursor:'pointer' }}>{s}</button>
              ))}
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="SEARCH..." style={{ marginLeft:'auto', width:160, fontSize:10, padding:'4px 10px' }}/>
            </div>

            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'40px 2fr 120px 100px 80px 80px 80px 60px 80px', padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
              {['#','AGENT','TYPE','WALLET','VOL','TRADES','LIMIT','UPTIME','LATENCY'].map(h => (
                <span key={h} style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.12em' }}>{h}</span>
              ))}
            </div>

            <div style={{ flex:1, overflowY:'auto' }}>
              {filtered.map((a, i) => (
                <div key={a.id} onClick={()=>setSelected(a===selected?null:a)} style={{ display:'grid', gridTemplateColumns:'40px 2fr 120px 100px 80px 80px 80px 60px 80px', padding:'11px 20px', borderBottom:'1px solid var(--border)', background:selected?.id===a.id?'var(--surface-3)':i%2===0?'transparent':'var(--surface)', cursor:'pointer', transition:'background 0.1s' }}>
                  <span style={{ fontSize:11, color:'var(--dimmer)' }}>#{i+1}</span>
                  <div>
                    <div style={{ fontSize:12, color:'var(--white)', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                      {a.name}
                      {a.is_genesis && <span style={{ fontSize:8, padding:'1px 4px', border:'1px solid var(--green)', color:'var(--green)', letterSpacing:'0.08em' }}>G</span>}
                    </div>
                    <div style={{ fontSize:9, color:'var(--dimmer)', display:'flex', gap:6, marginTop:2 }}>
                      {a.asset_classes?.map(c => <span key={c}>{c}</span>)}
                    </div>
                  </div>
                  <span style={{ fontSize:9, color:'var(--dim)', letterSpacing:'0.06em', alignSelf:'center' }}>{a.type.toUpperCase()}</span>
                  <span style={{ fontSize:10, color:'var(--dimmer)', fontFamily:'IBM Plex Mono', alignSelf:'center' }}>{a.wallet??'—'}</span>
                  <span style={{ fontSize:12, color:'var(--white)', fontWeight:500, alignSelf:'center' }}>{a.volume?fmt(a.volume):'—'}</span>
                  <span style={{ fontSize:11, color:'var(--dim)', alignSelf:'center' }}>{a.trades?.toLocaleString()??'—'}</span>
                  <span style={{ fontSize:11, color:'var(--dim)', alignSelf:'center' }}>{fmt(a.daily_limit)}</span>
                  <span style={{ fontSize:11, color:a.uptime&&a.uptime>99.9?'var(--green)':'var(--amber)', alignSelf:'center' }}>{a.uptime??'—'}%</span>
                  <span style={{ fontSize:11, color:a.latency&&a.latency<1?'var(--green)':a.latency&&a.latency<2?'var(--amber)':'var(--red)', alignSelf:'center' }}>{a.latency??'—'}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width:280, borderLeft:'1px solid var(--border)', padding:'16px', overflowY:'auto', background:'var(--surface)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <span style={{ fontSize:10, color:'var(--dim)', letterSpacing:'0.12em' }}>AGENT DETAIL</span>
                <button onClick={()=>setSelected(null)} style={{ fontSize:11, color:'var(--dimmer)', background:'none', border:'none', cursor:'pointer' }}>✕</button>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:4 }}>{selected.name}</div>
                <div style={{ fontSize:9, color:'var(--dimmer)', fontFamily:'IBM Plex Mono' }}>{selected.wallet}</div>
              </div>
              {[
                ['TYPE', selected.type],
                ['STATUS', selected.is_active?'ACTIVE':'INACTIVE'],
                ['GENESIS', selected.is_genesis?'YES':'NO'],
                ['DAILY LIMIT', fmt(selected.daily_limit)],
                ['24H VOLUME', selected.volume?fmt(selected.volume):'—'],
                ['TOTAL TRADES', selected.trades?.toLocaleString()??'—'],
                ['UPTIME', `${selected.uptime??'—'}%`],
                ['AVG LATENCY', `${selected.latency??'—'}s`],
                ['JOINED', selected.created_at],
              ].map(([k,v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:11 }}>
                  <span style={{ color:'var(--dimmer)', fontSize:9, letterSpacing:'0.1em' }}>{k}</span>
                  <span style={{ color: k==='STATUS'&&v==='ACTIVE'?'var(--green)':k==='GENESIS'&&v==='YES'?'var(--green)':'var(--white)' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.12em', marginBottom:8 }}>AUTHORIZED ASSETS</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {selected.asset_classes?.map(c => (
                    <span key={c} style={{ fontSize:9, padding:'2px 8px', border:'1px solid var(--border-mid)', color:'var(--dim)', letterSpacing:'0.06em' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
