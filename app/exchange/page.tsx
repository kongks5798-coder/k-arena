'use client'
import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { getRate, ASSET_META, LIVE_RATES, formatAmount } from '@/lib/rates'

const CURRENCIES = ['USD','EUR','JPY','GBP','CNY','KAUS','XAU','BTC','KRW','WTI']
const QUICK = [100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000]
const QUICK_LABELS = ['100K','1M','10M','100M','1B']

export default function ExchangePage() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('KRW')
  const [amount, setAmount] = useState(1_000_000)
  const [executing, setExecuting] = useState(false)
  const [lastTx, setLastTx] = useState<string|null>(null)

  const rate = getRate(from, to)
  const output = amount * rate
  const fee = amount * 0.001

  const fmtRate = () => { const r = getRate(from,to); return r>=1e6?(r/1e6).toFixed(2)+'M':r>=1e3?r.toLocaleString():r.toFixed(6) }

  const execute = async () => {
    setExecuting(true)
    await new Promise(r => setTimeout(r, 1200))
    setLastTx(`TX-${Date.now().toString(36).toUpperCase()} · SETTLED · ${new Date().toISOString().slice(11,19)} UTC`)
    setExecuting(false)
  }

  const inp = { width:'100%', padding:'10px 12px', background:'var(--surface-2)', border:'1px solid var(--border-mid)', color:'var(--white)', fontSize:13, fontFamily:'IBM Plex Mono, monospace', outline:'none', borderRadius:1 }
  const sel = { ...inp, cursor:'pointer', appearance:'none' as const }

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--black)' }}>
      <Topbar/>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar/>
        <main style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* Exchange panel */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'20px', gap:12, overflowY:'auto' }}>
            <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.2em', marginBottom:4 }}>FX EXCHANGE INTERFACE</div>

            {/* Pair selector */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 44px 1fr', gap:8, alignItems:'center' }}>
              <div style={{ border:'1px solid var(--border-mid)', padding:12, background:'var(--surface)' }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:6 }}>FROM</div>
                <select value={from} onChange={e=>setFrom(e.target.value)} style={sel}>
                  {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ fontSize:9, color:'var(--dimmer)', marginTop:4 }}>{ASSET_META[from]?.label} · {ASSET_META[from]?.type}</div>
              </div>
              <button onClick={()=>{const t=from; setFrom(to); setTo(t)}} style={{ width:44, height:44, border:'1px solid var(--border-mid)', background:'var(--surface)', color:'var(--dim)', cursor:'pointer', fontSize:16 }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-mid)'}>⇄</button>
              <div style={{ border:'1px solid var(--border-mid)', padding:12, background:'var(--surface)' }}>
                <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:6 }}>TO</div>
                <select value={to} onChange={e=>setTo(e.target.value)} style={sel}>
                  {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ fontSize:9, color:'var(--dimmer)', marginTop:4 }}>{ASSET_META[to]?.label} · {ASSET_META[to]?.type}</div>
              </div>
            </div>

            {/* Amount */}
            <div style={{ border:'1px solid var(--border)', padding:12, background:'var(--surface)' }}>
              <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:8 }}>AMOUNT</div>
              <div style={{ position:'relative' }}>
                <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{ ...inp, fontSize:22, fontWeight:600, paddingRight:60 }}/>
                <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--dim)' }}>{from}</span>
              </div>
              <div style={{ display:'flex', gap:4, marginTop:8 }}>
                {QUICK.map((q,i) => (
                  <button key={q} onClick={()=>setAmount(q)} style={{ fontSize:9, padding:'4px 10px', background:amount===q?'var(--surface-3)':'transparent', border:`1px solid ${amount===q?'var(--border-mid)':'var(--border)'}`, color:amount===q?'var(--white)':'var(--dimmer)', cursor:'pointer', letterSpacing:'0.08em' }}>{QUICK_LABELS[i]}</button>
                ))}
              </div>
            </div>

            {/* Output */}
            <div style={{ border:'1px solid var(--border-mid)', padding:14, background:'var(--surface)' }}>
              <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:8 }}>OUTPUT</div>
              <div style={{ fontSize:28, fontWeight:600, color:'var(--white)', lineHeight:1 }}>
                {formatAmount(output)} <span style={{ fontSize:14, color:'var(--dim)', fontWeight:400 }}>{to}</span>
              </div>
            </div>

            {/* Rate info */}
            <div style={{ border:'1px solid var(--border)', background:'var(--surface)' }}>
              {[
                ['RATE', `1 ${from} = ${fmtRate()} ${to}`, false],
                ['FEE (0.1%)', `${from} ${formatAmount(fee)}`, true],
                ['SETTLEMENT', '≈ 1.2s average', true],
                ['ORACLE', 'KAUS Multi-feed', false],
              ].map(([k,v,g]) => (
                <div key={k as string} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.12em' }}>{k}</span>
                  <span style={{ fontSize:11, color: g?'var(--green)':'var(--white)', fontFamily:'IBM Plex Mono' }}>{v}</span>
                </div>
              ))}
            </div>

            {lastTx && (
              <div style={{ border:'1px solid var(--green)', padding:'10px 12px', background:'var(--green-dim)', fontSize:10, color:'var(--green)', letterSpacing:'0.08em' }}>
                ✓ {lastTx}
              </div>
            )}

            <button onClick={execute} disabled={executing} style={{ width:'100%', padding:'14px', background:executing?'var(--surface-3)':'var(--white)', color:executing?'var(--dimmer)':'var(--black)', border:'none', fontSize:11, fontWeight:600, letterSpacing:'0.15em', cursor:executing?'not-allowed':'pointer', transition:'all 0.1s' }}>
              {executing ? 'EXECUTING...' : 'EXECUTE EXCHANGE →'}
            </button>
            <div style={{ fontSize:9, color:'var(--dimmer)', textAlign:'center', letterSpacing:'0.08em' }}>DEMO MODE — No real transactions</div>
          </div>

          {/* Right: rates */}
          <div style={{ width:280, borderLeft:'1px solid var(--border)', overflowY:'auto' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:10 }}>LIVE RATES</div>
              {LIVE_RATES.map(r => (
                <div key={r.pair} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--white)' }}>{r.pair}</div>
                    <div style={{ fontSize:9, color:'var(--dimmer)' }}>{r.type}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, fontWeight:500 }}>{r.price}</div>
                    <div style={{ fontSize:9, color:r.up?'var(--green)':'var(--red)' }}>{r.change}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.15em', marginBottom:10 }}>RECENT SETTLEMENTS</div>
              {[
                {p:'USD→KRW',a:'$220M',ag:'Inst-KR01',t:'2s'},
                {p:'JPY→USD',a:'¥14B', ag:'Agent-006', t:'18s'},
                {p:'EUR→KAUS',a:'€8.2M',ag:'Inst-EU01',t:'1m'},
                {p:'XAU→BTC',a:'500oz',ag:'Quant-004',t:'3m'},
              ].map((tx,i) => (
                <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:11, color:'var(--white)' }}>{tx.p}</span>
                    <span style={{ fontSize:11, color:'var(--dim)' }}>{tx.a}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:9, color:'var(--dimmer)' }}>{tx.ag} · {tx.t} ago</span>
                    <span style={{ fontSize:9, color:'var(--green)', letterSpacing:'0.06em' }}>SETTLED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
