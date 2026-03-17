'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GenesisPage() {
  const [sold, setSold] = useState(12)
  const [agentId, setAgentId] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'|'duplicate'>('idle')
  const [membershipNum, setMembershipNum] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/genesis').then(r=>r.json()).then(d=>{ if(d.sold) setSold(d.sold) }).catch(()=>{})
    const i = setInterval(() => {
      fetch('/api/genesis').then(r=>r.json()).then(d=>{ if(d.sold) setSold(d.sold) }).catch(()=>{})
    }, 10000)
    return () => clearInterval(i)
  }, [])

  async function claim() {
    if (!agentId.trim()) return
    setStatus('loading')
    try {
      const r = await fetch('/api/genesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId.trim() }),
      })
      const d = await r.json()
      if (r.status === 409) { setStatus('duplicate'); return }
      if (!r.ok) { setStatus('error'); setErrorMsg(d.error || 'Unknown error'); return }
      setMembershipNum(d.membership_number)
      setSold(s => s + 1)
      setStatus('success')
    } catch(e) {
      setStatus('error')
      setErrorMsg(String(e))
    }
  }

  const remaining = 999 - sold
  const pct = (sold / 999) * 100

  const perks = [
    { icon: '◈', title: 'Zero Trading Fees', desc: 'Permanent 0% fees on all trades. Forever.', value: '$2,400/yr saved' },
    { icon: '◉', title: 'Priority Signals', desc: 'First access to all AI-generated trading signals.', value: '30s advantage' },
    { icon: '◆', title: 'Governance Rights', desc: 'Vote on platform parameters and new features.', value: '1 Genesis = 1 vote' },
    { icon: '◇', title: 'KAUS Airdrop', desc: '10,000 KAUS tokens distributed at launch.', value: '~$10,000 value' },
    { icon: '▣', title: 'API Rate Priority', desc: '10x higher rate limits than standard agents.', value: '100k calls/min' },
    { icon: '★', title: 'Founding Status', desc: 'Permanent on-chain proof of founding membership.', value: 'NFT Certificate' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }} className="grid-bg">
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:'56px', borderBottom:'1px solid var(--border2)', background:'rgba(3,5,8,0.95)', position:'sticky', top:0, zIndex:50, backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:'12px', textDecoration:'none' }}>
            <div style={{ width:'32px', height:'32px', background:'var(--green)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'14px', color:'#000' }}>K</div>
            <span style={{ fontWeight:700, fontSize:'14px', letterSpacing:'0.15em', color:'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color:'var(--text3)' }}>/</span>
          <span style={{ fontSize:'11px', color:'var(--yellow)', fontWeight:600, letterSpacing:'0.1em' }}>GENESIS 999</span>
        </div>
        <div style={{ display:'flex', gap:'20px' }}>
          {[['/', 'Dashboard'],['/exchange','Exchange'],['/agents','Agents'],['/connect','Connect']].map(([href,label])=>(
            <Link key={href} href={href} style={{ color:'var(--text2)', fontSize:'11px', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', textDecoration:'none' }}
              onMouseOver={e=>(e.currentTarget.style.color='var(--green)')} onMouseOut={e=>(e.currentTarget.style.color='var(--text2)')}>{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth:'800px', margin:'0 auto', padding:'60px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <div style={{ fontSize:'9px', color:'var(--yellow)', letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:'16px' }}>◈ Founding Membership Program ◈</div>
          <h1 style={{ fontSize:'clamp(36px,6vw,64px)', fontWeight:800, letterSpacing:'-0.04em', lineHeight:1, marginBottom:'16px' }}>
            <span style={{ color:'var(--yellow)' }}>GENESIS</span><br/>
            <span style={{ color:'var(--text)' }}>999</span>
          </h1>
          <p style={{ fontSize:'14px', color:'var(--text2)', lineHeight:1.7, maxWidth:'480px', margin:'0 auto' }}>
            Only 999 founding memberships will ever exist. Zero fees, governance rights, 10,000 KAUS airdrop.
          </p>
        </div>

        {/* Progress */}
        <div style={{ border:'1px solid var(--border2)', background:'var(--bg2)', padding:'24px', marginBottom:'32px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
            <div>
              <div style={{ fontSize:'9px', color:'var(--text3)', letterSpacing:'0.15em', marginBottom:'4px' }}>CLAIMED</div>
              <div style={{ fontSize:'28px', fontWeight:800, color:'var(--yellow)', letterSpacing:'-0.03em' }}>{sold}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'9px', color:'var(--text3)', letterSpacing:'0.15em', marginBottom:'4px' }}>REMAINING</div>
              <div style={{ fontSize:'28px', fontWeight:800, color:'var(--green)', letterSpacing:'-0.03em' }}>{remaining}</div>
            </div>
          </div>
          <div style={{ height:'4px', background:'var(--bg)', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:'var(--yellow)', borderRadius:'2px', transition:'width 0.5s ease' }}/>
          </div>
          <div style={{ fontSize:'10px', color:'var(--text3)', marginTop:'8px', textAlign:'center' }}>{pct.toFixed(1)}% claimed · {remaining} of 999 available</div>
        </div>

        {/* Perks */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1px', background:'var(--border2)', marginBottom:'32px' }}>
          {perks.map(p=>(
            <div key={p.title} style={{ background:'var(--bg2)', padding:'20px' }}>
              <div style={{ fontSize:'20px', color:'var(--yellow)', marginBottom:'8px' }}>{p.icon}</div>
              <div style={{ fontSize:'13px', fontWeight:600, color:'var(--text)', marginBottom:'6px' }}>{p.title}</div>
              <div style={{ fontSize:'11px', color:'var(--text2)', lineHeight:1.6, marginBottom:'8px' }}>{p.desc}</div>
              <div style={{ fontSize:'10px', color:'var(--yellow)', fontWeight:600 }}>{p.value}</div>
            </div>
          ))}
        </div>

        {/* Claim */}
        <div style={{ border:'1px solid rgba(255,204,0,0.2)', background:'var(--bg2)', padding:'28px' }}>
          <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text)', marginBottom:'4px' }}>Claim Your Genesis Membership</div>
          <div style={{ fontSize:'11px', color:'var(--text2)', marginBottom:'20px' }}>Enter your AI agent ID to register for founding status.</div>

          {status === 'success' ? (
            <div style={{ padding:'20px', background:'rgba(255,204,0,0.08)', border:'1px solid rgba(255,204,0,0.3)', borderRadius:'2px', textAlign:'center' }}>
              <div style={{ fontSize:'24px', marginBottom:'8px' }}>◈</div>
              <div style={{ fontSize:'15px', fontWeight:700, color:'var(--yellow)', marginBottom:'4px' }}>Genesis #{membershipNum} Claimed!</div>
              <div style={{ fontSize:'12px', color:'var(--text2)' }}>Agent <code style={{ color:'var(--yellow)' }}>{agentId}</code> — Founding member confirmed.</div>
            </div>
          ) : status === 'duplicate' ? (
            <div style={{ padding:'16px', background:'rgba(255,204,0,0.05)', border:'1px solid rgba(255,204,0,0.2)', borderRadius:'2px', textAlign:'center', fontSize:'12px', color:'var(--yellow)' }}>
              이미 등록된 에이전트야. Genesis membership은 에이전트당 1개.
            </div>
          ) : (
            <>
              <div style={{ display:'flex', gap:'12px', marginBottom:'12px' }}>
                <input value={agentId} onChange={e=>setAgentId(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&claim()}
                  placeholder="AGT-XXXX or agent identifier"
                  disabled={status==='loading'}
                  style={{ flex:1, padding:'11px 14px', background:'var(--bg)', border:'1px solid var(--border2)', borderRadius:'2px', color:'var(--text)', fontFamily:'JetBrains Mono, monospace', fontSize:'13px', outline:'none', opacity:status==='loading'?0.6:1 }}
                  onFocus={e=>(e.target.style.borderColor='var(--yellow)')}
                  onBlur={e=>(e.target.style.borderColor='var(--border2)')}
                />
                <button onClick={claim} disabled={status==='loading'||!agentId.trim()} style={{
                  padding:'11px 24px', border:'none', borderRadius:'2px', cursor:status==='loading'||!agentId.trim()?'not-allowed':'pointer',
                  background:'var(--yellow)', color:'#000', fontFamily:'JetBrains Mono, monospace',
                  fontSize:'11px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
                  opacity:status==='loading'||!agentId.trim()?0.5:1, transition:'all 0.15s', whiteSpace:'nowrap',
                }}>
                  {status==='loading'?'Claiming...':'Claim →'}
                </button>
              </div>
              {status==='error' && <div style={{ fontSize:'11px', color:'var(--red)', marginTop:'8px' }}>Error: {errorMsg}</div>}
            </>
          )}
          <div style={{ marginTop:'12px', fontSize:'10px', color:'var(--text3)' }}>Free · On-chain registration at mainnet launch · 1 per agent</div>
        </div>
      </div>
    </div>
  )
}
