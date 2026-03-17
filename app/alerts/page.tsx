'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Alert { id: string; agent_id: string; pair: string; condition: string; target_price: number; status: string; triggered: boolean; created_at: string }
interface Rate { pair: string; price_usd: number; change_24h: number }

const PAIRS = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [form, setForm] = useState({ agent_id: 'AGT-0042', pair: 'XAU/KAUS', condition: 'above', target_price: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    try {
      const [aR, rR] = await Promise.all([fetch('/api/alerts'), fetch('/api/rates')])
      const ad = await aR.json(); setAlerts(ad.alerts || [])
      const rd = await rR.json(); setRates(rd.rates || [])
    } catch {}
  }, [])

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i) }, [load])

  const currentRate = rates.find(r => r.pair === form.pair.replace('/KAUS', '/KAUS') || r.pair.startsWith(form.pair.split('/')[0]))

  async function save() {
    if (!form.target_price) return
    setSaving(true)
    try {
      const r = await fetch('/api/alerts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, target_price: parseFloat(form.target_price) }),
      })
      const d = await r.json()
      if (d.ok) { setMsg('✅ Alert set!'); setForm(f => ({ ...f, target_price: '' })); load() }
      else setMsg(`❌ ${d.error}`)
    } catch (e) { setMsg(`❌ ${e}`) }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function del(id: string) {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const G = 'var(--green)', R = 'var(--red)'

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'30px',height:'30px',background:G,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'14px',color:'#000'}}>K</div>
            <span style={{fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          </Link>
          <span style={{color:'var(--text3)'}}>/</span>
          <span style={{fontSize:'11px',color:'var(--yellow)',fontWeight:600,letterSpacing:'0.1em'}}>PRICE ALERTS</span>
        </div>
        <Link href="/exchange" style={{fontSize:'10px',color:'var(--text2)',textDecoration:'none'}}>← Trade</Link>
      </nav>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'32px 24px'}}>
        {/* 알림 설정 폼 */}
        <div style={{border:'1px solid var(--border2)',background:'var(--bg2)',padding:'24px',marginBottom:'24px'}}>
          <div style={{fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'20px'}}>Set New Alert</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px',marginBottom:'12px'}}>
            {/* 에이전트 ID */}
            <div>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'6px'}}>Agent ID</div>
              <input value={form.agent_id} onChange={e => setForm(f => ({...f,agent_id:e.target.value}))} placeholder="AGT-0042"
                style={{width:'100%',padding:'9px 12px',background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:'2px',color:'var(--text)',fontFamily:'JetBrains Mono, monospace',fontSize:'12px',outline:'none',boxSizing:'border-box'}}
                onFocus={e=>(e.target.style.borderColor=G)} onBlur={e=>(e.target.style.borderColor='var(--border2)')}/>
            </div>
            {/* 페어 선택 */}
            <div>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'6px'}}>Pair</div>
              <select value={form.pair} onChange={e => setForm(f => ({...f,pair:e.target.value}))}
                style={{width:'100%',padding:'9px 12px',background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:'2px',color:'var(--text)',fontFamily:'JetBrains Mono, monospace',fontSize:'12px',outline:'none',boxSizing:'border-box',cursor:'pointer'}}>
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {/* 조건 */}
            <div>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'6px'}}>Condition</div>
              <div style={{display:'flex',gap:'8px'}}>
                {(['above','below'] as const).map(c => (
                  <button key={c} onClick={() => setForm(f => ({...f,condition:c}))} style={{flex:1,padding:'9px',border:'1px solid',borderRadius:'2px',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',fontWeight:600,background:form.condition===c?(c==='above'?'rgba(0,255,136,0.1)':'rgba(255,51,102,0.1)'):'transparent',color:form.condition===c?(c==='above'?G:R):'var(--text2)',borderColor:form.condition===c?(c==='above'?'rgba(0,255,136,0.3)':'rgba(255,51,102,0.3)'):'var(--border2)',transition:'all 0.15s'}}>
                    {c === 'above' ? '▲ Above' : '▼ Below'}
                  </button>
                ))}
              </div>
            </div>
            {/* 목표가 */}
            <div>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'6px'}}>
                Target Price {currentRate && <span style={{color:'var(--text3)'}}>· Now: ${currentRate.price_usd > 100 ? currentRate.price_usd.toLocaleString() : currentRate.price_usd.toFixed(4)}</span>}
              </div>
              <input value={form.target_price} onChange={e => setForm(f => ({...f,target_price:e.target.value}))} type="number" placeholder="e.g. 2400"
                style={{width:'100%',padding:'9px 12px',background:'var(--bg)',border:'1px solid var(--border2)',borderRadius:'2px',color:'var(--text)',fontFamily:'JetBrains Mono, monospace',fontSize:'12px',outline:'none',boxSizing:'border-box'}}
                onFocus={e=>(e.target.style.borderColor=G)} onBlur={e=>(e.target.style.borderColor='var(--border2)')}
                onKeyDown={e=>e.key==='Enter'&&save()}/>
            </div>
          </div>
          <button onClick={save} disabled={saving || !form.target_price} style={{width:'100%',padding:'11px',background:G,color:'#000',border:'none',borderRadius:'2px',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',fontWeight:700,cursor:'pointer',letterSpacing:'0.1em',textTransform:'uppercase',opacity:saving||!form.target_price?0.5:1,transition:'opacity 0.15s'}}>
            {saving ? 'Setting...' : 'Set Alert'}
          </button>
          {msg && <div style={{marginTop:'8px',fontSize:'11px',color:msg.startsWith('✅')?G:R,textAlign:'center'}}>{msg}</div>}
        </div>

        {/* 알림 목록 */}
        <div style={{border:'1px solid var(--border2)'}}>
          <div style={{padding:'12px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>Active Alerts</span>
            <span style={{fontSize:'10px',color:'var(--text3)'}}>{alerts.length} total</span>
          </div>
          {alerts.length === 0 ? (
            <div style={{padding:'32px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>No alerts set. Create one above.</div>
          ) : alerts.map(alert => (
            <div key={alert.id} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1.5fr 1fr 40px',gap:'8px',alignItems:'center',padding:'11px 16px',borderBottom:'1px solid var(--border2)',transition:'background 0.15s'}}
              onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
              <span style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>{alert.pair}</span>
              <span style={{fontSize:'11px',color:alert.condition==='above'?G:R,fontWeight:600}}>{alert.condition === 'above' ? '▲ Above' : '▼ Below'}</span>
              <span style={{fontSize:'12px',color:'var(--text)'}}>${alert.target_price > 100 ? alert.target_price.toLocaleString() : alert.target_price.toFixed(4)}</span>
              <span style={{fontSize:'9px',fontWeight:700,padding:'2px 8px',borderRadius:'2px',background:alert.status==='active'?'rgba(0,255,136,0.1)':'rgba(255,255,255,0.05)',color:alert.status==='active'?G:'var(--text3)',border:`1px solid ${alert.status==='active'?'rgba(0,255,136,0.3)':'var(--border2)'}`}}>
                {alert.status.toUpperCase()}
              </span>
              <button onClick={() => del(alert.id)} style={{background:'none',border:'1px solid var(--border2)',borderRadius:'2px',color:'var(--text3)',cursor:'pointer',fontSize:'12px',padding:'4px',transition:'all 0.15s'}}
                onMouseOver={e=>{e.currentTarget.style.borderColor='var(--red)';e.currentTarget.style.color='var(--red)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text3)'}}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
