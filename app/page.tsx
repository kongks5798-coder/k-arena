'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { LIVE_RATES } from '@/lib/rates'

const DEMO_TX = [
  { agent:'Agent-Alpha-001', id:'0x3f4a...91bc', pair:'USD/KRW', type:'FX',     amount:'$14,200,000', fee:'$14,200', status:'SETTLED' },
  { agent:'Agent-Quant-004', id:'0x8b2c...44ef', pair:'XAU/USD', type:'GOLD',   amount:'$8,750,000',  fee:'$8,750',  status:'SETTLED' },
  { agent:'Agent-KAUS-447',  id:'0x1d7e...c3a2', pair:'WTI/USD', type:'OIL',    amount:'$32,100,000', fee:'$32,100', status:'ROUTING' },
  { agent:'Agent-Inst-KR01', id:'INST·AG-KR-001',pair:'JPY/USD', type:'FX',     amount:'$220,000,000',fee:'$220,000',status:'SETTLED' },
  { agent:'Agent-DAO-012',   id:'0x5f9d...77aa', pair:'kWh/KAUS',type:'ENERGY', amount:'$1,840,000',  fee:'$1,840',  status:'CLEARING'},
]

const ACTIVITY = [
  { color:'var(--green)',  text:'Agent-Inst-KR01 settled $220M JPY/USD', time:'2s' },
  { color:'var(--blue)',   text:'Agent-Algo-006 registered on mainnet',  time:'14s' },
  { color:'var(--amber)',  text:'Genesis #744 minted — 255 remaining',   time:'1m' },
  { color:'var(--green)',  text:'Agent-DAO-012 opened kWh/KAUS position',time:'3m' },
  { color:'var(--blue)',   text:'Agent-Obs-005 joined governance',        time:'8m' },
]

const STATUS_COLOR: Record<string,string> = {
  SETTLED:'var(--green)', ROUTING:'var(--amber)', CLEARING:'var(--blue)',
}

export default function HomePage() {
  const [agents, setAgents] = useState(2847)
  const [vol, setVol] = useState(847)
  const [activePeriod, setActivePeriod] = useState('1H')

  useEffect(() => {
    const t = setInterval(() => {
      setAgents(a => a + Math.floor(Math.random() * 2))
      setVol(v => +(v + (Math.random() - 0.4) * 2).toFixed(0))
    }, 4000)
    return () => clearInterval(t)
  }, [])

  const cell = { padding: '0 12px', borderRight: '1px solid var(--border)', fontSize: 11, color: 'var(--dim)' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--black)', display:'flex', flexDirection:'column' }}>
      <Topbar rightContent={
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'dot-pulse 2s infinite' }}/>
            <span style={{ fontSize:9, color:'var(--green)', letterSpacing:'0.1em' }}>{agents.toLocaleString()} AGENTS</span>
          </div>
          <span style={{ fontSize:9, color:'var(--dimmer)', borderLeft:'1px solid var(--border)', paddingLeft:12, letterSpacing:'0.08em' }}>FEE 0.1%</span>
        </div>
      }/>
      <div style={{ display:'flex', flex:1 }}>
        <Sidebar/>
        <main style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Metrics bar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid var(--border)' }}>
            {[
              { label:'24H VOLUME',  value:`$${vol}M`,           sub:`↑ 12.4%`,        green:true },
              { label:'ACTIVE AGENTS',value:agents.toLocaleString(), sub:'↑ 247 new',  green:true },
              { label:'FEE SAVED',   value:'$2.1M',              sub:'vs legacy rails', green:false },
              { label:'AVG SETTLE',  value:'1.2s',               sub:'↓ 0.3s avg',     green:false },
            ].map((m,i) => (
              <div key={m.label} style={{ padding:'16px 20px', borderRight: i<3?'1px solid var(--border)':'none' }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:8 }}>{m.label}</div>
                <div style={{ fontSize:24, fontWeight:600, color:'var(--white)', lineHeight:1, marginBottom:4 }}>{m.value}</div>
                <div style={{ fontSize:10, color: m.green?'var(--green)':'var(--dim)' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flex:1 }}>
            {/* TX Table */}
            <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:10, color:'var(--dim)', letterSpacing:'0.15em' }}>LIVE TRANSACTIONS</span>
                  <span style={{ fontSize:9, color:'var(--green)', border:'1px solid var(--green)', padding:'1px 6px', borderRadius:1 }}>STREAM</span>
                </div>
                <div style={{ display:'flex', gap:1 }}>
                  {['1H','24H','7D','30D'].map(p => (
                    <button key={p} onClick={() => setActivePeriod(p)} style={{ fontSize:9, padding:'4px 10px', letterSpacing:'0.08em', background: activePeriod===p?'var(--surface-3)':'transparent', color: activePeriod===p?'var(--white)':'var(--dimmer)', border:`1px solid ${activePeriod===p?'var(--border-mid)':'var(--border)'}`, cursor:'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Table header */}
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 80px', padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
                {['AGENT','PAIR','AMOUNT','FEE (0.1%)','STATUS'].map(h => (
                  <span key={h} style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.12em' }}>{h}</span>
                ))}
              </div>

              {DEMO_TX.map((tx, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr 80px', padding:'12px 20px', borderBottom:'1px solid var(--border)', background: i%2===0?'transparent':'var(--surface)' }}>
                  <div>
                    <div style={{ fontSize:12, color:'var(--white)', marginBottom:2 }}>{tx.agent}</div>
                    <div style={{ fontSize:9, color:'var(--dimmer)' }}>{tx.id}</div>
                  </div>
                  <div>
                    <span style={{ fontSize:12, color:'var(--white)' }}>{tx.pair}</span>
                    <span style={{ fontSize:9, color:'var(--dimmer)', marginLeft:6 }}>{tx.type}</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--white)', fontWeight:500 }}>{tx.amount}</div>
                  <div style={{ fontSize:11, color:'var(--dim)' }}>{tx.fee}</div>
                  <div style={{ fontSize:9, letterSpacing:'0.06em', color:STATUS_COLOR[tx.status]??'var(--dim)' }}>{tx.status}</div>
                </div>
              ))}
            </div>

            {/* Right panel */}
            <div style={{ width:260, borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
              {/* Rates */}
              <div style={{ borderBottom:'1px solid var(--border)', padding:'12px 16px' }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:10 }}>MARKET RATES</div>
                {LIVE_RATES.map(r => (
                  <div key={r.pair} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize:11, color:'var(--white)' }}>{r.pair}</div>
                      <div style={{ fontSize:9, color:'var(--dimmer)' }}>{r.type}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:'var(--white)', fontWeight:500 }}>{r.price}</div>
                      <div style={{ fontSize:9, color: r.up?'var(--green)':'var(--red)' }}>{r.change}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Activity */}
              <div style={{ padding:'12px 16px' }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:10 }}>LIVE ACTIVITY</div>
                {ACTIVITY.map((a,i) => (
                  <div key={i} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ width:4, height:4, borderRadius:'50%', background:a.color, flexShrink:0, marginTop:4 }}/>
                    <div>
                      <div style={{ fontSize:10, color:'var(--dim)', lineHeight:1.5 }}>{a.text}</div>
                      <div style={{ fontSize:9, color:'var(--dimmer)' }}>{a.time} ago</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
