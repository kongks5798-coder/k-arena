'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const ORACLE_DATA = [
  { pair:'USD/KRW',  price:1332.40, change:0.12,  vol:'$2.4B',   high:1341.20, low:1328.50, spread:0.02, source:'MULTI-FEED' },
  { pair:'EUR/USD',  price:1.0860,  change:0.09,  vol:'$3.1B',   high:1.0890,  low:1.0830,  spread:0.0001, source:'MULTI-FEED' },
  { pair:'USD/JPY',  price:149.80,  change:-0.15, vol:'$2.2B',   high:150.40,  low:149.20,  spread:0.01, source:'MULTI-FEED' },
  { pair:'XAU/USD',  price:3124.00, change:0.87,  vol:'$420M',   high:3138.00, low:3108.00, spread:0.50, source:'MULTI-FEED' },
  { pair:'WTI/USD',  price:71.84,   change:-0.33, vol:'$890M',   high:72.50,   low:71.20,   spread:0.03, source:'MULTI-FEED' },
  { pair:'BTC/USD',  price:83420,   change:-1.24, vol:'$28B',    high:85200,   low:82100,   spread:10,   source:'BINANCE' },
  { pair:'ETH/USD',  price:3240,    change:-0.88, vol:'$14B',    high:3310,    low:3200,    spread:0.50, source:'BINANCE' },
  { pair:'KAUS/USD', price:1.847,   change:3.24,  vol:'$84M',    high:1.892,   low:1.781,   spread:0.001,source:'KAUS-ORACLE' },
  { pair:'kWh/USD',  price:0.247,   change:2.11,  vol:'$12M',    high:0.251,   low:0.241,   spread:0.001,source:'ENERGY-ORACLE' },
]

const CORRELATIONS = [
  { pair:'KAUS ↔ BTC',  corr:0.72,  period:'30D', signal:'POSITIVE' },
  { pair:'WTI ↔ USD',   corr:-0.61, period:'30D', signal:'INVERSE' },
  { pair:'XAU ↔ DXY',   corr:-0.78, period:'30D', signal:'INVERSE' },
  { pair:'kWh ↔ KAUS',  corr:0.84,  period:'14D', signal:'STRONG' },
  { pair:'EUR ↔ USD',   corr:-0.92, period:'30D', signal:'INVERSE' },
]

const ANOMALIES = [
  { id:'A001', asset:'kWh/KAUS', type:'SPREAD', severity:'HIGH',   detail:'Spread widening +340% vs 7D avg. Arbitrage opportunity detected.', ts:'00:02' },
  { id:'A002', asset:'BTC/USD',  type:'VOLUME', severity:'MED',    detail:'Volume 2.3x above 4H average. Potential breakout formation.', ts:'00:08' },
  { id:'A003', asset:'USD/KRW',  type:'FLOW',   severity:'MED',    detail:'Institutional net buying detected. 3rd consecutive session.', ts:'00:15' },
  { id:'A004', asset:'KAUS/USD', type:'WHALE',  severity:'HIGH',   detail:'Single entity accumulated 48,000 KAUS in past 2 hours.', ts:'00:22' },
]

const SEV_COLOR: Record<string, string> = { HIGH:'var(--red)', MED:'var(--amber)', LOW:'var(--dim)' }

export default function DataPage() {
  const [activeTab, setActiveTab] = useState('ORACLE')
  const [prices, setPrices] = useState(ORACLE_DATA)
  const [apiExample, setApiExample] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: +(p.price * (1 + (Math.random() - 0.5) * 0.001)).toFixed(p.price > 1000 ? 2 : p.price > 1 ? 4 : 6),
        change: +(p.change + (Math.random() - 0.5) * 0.1).toFixed(2),
      })))
    }, 2000)
    return () => clearInterval(t)
  }, [])

  const fetchLiveRates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rates')
      const data = await res.json()
      setApiExample(JSON.stringify(data, null, 2))
    } catch { setApiExample('{"error": "fetch failed"}') }
    setLoading(false)
  }

  const TABS = ['ORACLE', 'CORRELATIONS', 'ANOMALIES', 'API DOCS']

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--black)' }}>
      <Topbar rightContent={
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--green)', display:'inline-block', animation:'dot-pulse 2s infinite' }}/>
          <span style={{ fontSize:9, color:'var(--green)', letterSpacing:'0.1em' }}>ORACLE LIVE</span>
        </div>
      }/>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar/>
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', height:40 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ fontSize:10, padding:'0 20px', letterSpacing:'0.1em', background:activeTab===t?'var(--surface-3)':'transparent', color:activeTab===t?'var(--white)':'var(--dimmer)', borderRight:'1px solid var(--border)', borderBottom:activeTab===t?'1px solid var(--green)':'1px solid transparent', borderTop:'none', borderLeft:'none', cursor:'pointer' }}>{t}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>

            {/* ORACLE TAB */}
            {activeTab === 'ORACLE' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr 80px 100px', padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
                  {['PAIR','PRICE','CHG%','VOLUME','HIGH','LOW','SPREAD','SOURCE'].map(h => (
                    <span key={h} style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.12em' }}>{h}</span>
                  ))}
                </div>
                {prices.map((p, i) => (
                  <div key={p.pair} style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr 1fr 1fr 80px 100px', padding:'11px 20px', borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--surface)' }}>
                    <span style={{ fontSize:12, color:'var(--white)', fontWeight:500 }}>{p.pair}</span>
                    <span style={{ fontSize:12, color:'var(--white)', fontFamily:'IBM Plex Mono, monospace', fontWeight:500 }}>{p.price.toLocaleString(undefined,{maximumFractionDigits:6})}</span>
                    <span style={{ fontSize:11, color:p.change>=0?'var(--green)':'var(--red)', fontFamily:'IBM Plex Mono' }}>{p.change>=0?'+':''}{p.change}%</span>
                    <span style={{ fontSize:11, color:'var(--dim)' }}>{p.vol}</span>
                    <span style={{ fontSize:11, color:'var(--dim)' }}>{p.high.toLocaleString()}</span>
                    <span style={{ fontSize:11, color:'var(--dim)' }}>{p.low.toLocaleString()}</span>
                    <span style={{ fontSize:11, color:'var(--dimmer)' }}>{p.spread}</span>
                    <span style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.06em' }}>{p.source}</span>
                  </div>
                ))}
                <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
                  <span style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.1em' }}>⟳ AUTO-REFRESH 2s · MULTI-SOURCE ORACLE · 0.1% PLATFORM FEE</span>
                </div>
              </div>
            )}

            {/* CORRELATIONS TAB */}
            {activeTab === 'CORRELATIONS' && (
              <div style={{ padding:'20px' }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:16 }}>CROSS-ASSET CORRELATION MATRIX</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {CORRELATIONS.map(c => (
                    <div key={c.pair} style={{ border:'1px solid var(--border)', padding:'14px', background:'var(--surface)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <span style={{ fontSize:12, color:'var(--white)', fontWeight:500 }}>{c.pair}</span>
                        <span style={{ fontSize:9, color:'var(--dimmer)' }}>{c.period}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                        <span style={{ fontSize:24, fontWeight:600, color:c.corr > 0 ? 'var(--green)' : 'var(--red)' }}>{c.corr > 0 ? '+' : ''}{c.corr}</span>
                        <span style={{ fontSize:9, padding:'2px 8px', border:`1px solid ${c.signal==='STRONG'?'var(--green)':c.signal==='INVERSE'?'var(--red)':'var(--amber)'}`, color:c.signal==='STRONG'?'var(--green)':c.signal==='INVERSE'?'var(--red)':'var(--amber)', letterSpacing:'0.08em' }}>{c.signal}</span>
                      </div>
                      <div style={{ height:4, background:'var(--surface-3)', borderRadius:1 }}>
                        <div style={{ height:'100%', width:`${Math.abs(c.corr)*100}%`, background:c.corr>0?'var(--green)':'var(--red)', borderRadius:1 }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANOMALIES TAB */}
            {activeTab === 'ANOMALIES' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'60px 100px 80px 80px 1fr 60px', padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
                  {['ID','ASSET','TYPE','SEV','DETAIL','TIME'].map(h => (
                    <span key={h} style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.12em' }}>{h}</span>
                  ))}
                </div>
                {ANOMALIES.map((a, i) => (
                  <div key={a.id} style={{ display:'grid', gridTemplateColumns:'60px 100px 80px 80px 1fr 60px', padding:'14px 20px', borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'var(--surface)', alignItems:'start' }}>
                    <span style={{ fontSize:9, color:'var(--dimmer)', fontFamily:'IBM Plex Mono' }}>{a.id}</span>
                    <span style={{ fontSize:11, color:'var(--white)', fontWeight:500 }}>{a.asset}</span>
                    <span style={{ fontSize:9, color:'var(--blue)', letterSpacing:'0.06em' }}>{a.type}</span>
                    <span style={{ fontSize:9, color:SEV_COLOR[a.severity], letterSpacing:'0.06em' }}>{a.severity}</span>
                    <span style={{ fontSize:11, color:'var(--dim)', lineHeight:1.6 }}>{a.detail}</span>
                    <span style={{ fontSize:9, color:'var(--dimmer)' }}>T-{a.ts}</span>
                  </div>
                ))}
              </div>
            )}

            {/* API DOCS TAB */}
            {activeTab === 'API DOCS' && (
              <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:12 }}>ENDPOINTS</div>
                  {[
                    { method:'GET', path:'/api/rates', desc:'Live rates — all pairs' },
                    { method:'GET', path:'/api/rates?pair=BTC/USD', desc:'Single pair rate' },
                    { method:'GET', path:'/api/stats', desc:'Platform statistics' },
                    { method:'GET', path:'/api/agents', desc:'Agent registry' },
                    { method:'POST', path:'/api/agents', desc:'Register new agent' },
                    { method:'POST', path:'/api/exchange', desc:'Execute trade (auth required)' },
                    { method:'GET', path:'/api/genesis', desc:'Genesis 999 status' },
                  ].map(e => (
                    <div key={e.path} style={{ display:'grid', gridTemplateColumns:'50px 1fr', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', alignItems:'start' }}>
                      <span style={{ fontSize:9, padding:'2px 6px', border:`1px solid ${e.method==='GET'?'var(--blue)':'var(--green)'}`, color:e.method==='GET'?'var(--blue)':'var(--green)', textAlign:'center', letterSpacing:'0.05em' }}>{e.method}</span>
                      <div>
                        <div style={{ fontSize:11, color:'var(--white)', fontFamily:'IBM Plex Mono', marginBottom:2 }}>{e.path}</div>
                        <div style={{ fontSize:10, color:'var(--dimmer)' }}>{e.desc}</div>
                      </div>
                    </div>
                  ))}
                  <button onClick={fetchLiveRates} style={{ marginTop:16, width:'100%', padding:'10px', background:'var(--surface-2)', border:'1px solid var(--border-mid)', color:'var(--white)', fontSize:10, letterSpacing:'0.1em', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--blue)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-mid)'}>
                    {loading ? 'FETCHING...' : '▶ RUN GET /api/rates'}
                  </button>
                </div>
                <div>
                  <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:12 }}>RESPONSE</div>
                  <pre style={{ background:'var(--surface)', border:'1px solid var(--border)', padding:'14px', fontSize:10, color:'var(--dim)', lineHeight:1.7, overflow:'auto', maxHeight:400, borderRadius:2 }}>
                    {apiExample ?? '// Press RUN to fetch live data\n\n{\n  "ok": true,\n  "ts": "2026-03-17T...",\n  "data": {\n    "USD/KRW": {\n      "price": 1332.40,\n      "change24h": 0.12,\n      ...\n    }\n  }\n}'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
