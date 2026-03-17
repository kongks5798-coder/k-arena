'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Platform { total_volume_24h:number; active_agents:number; total_agents:number; total_trades_24h:number; genesis_sold:number; genesis_total:number; kaus_price:number; kaus_change_24h:number; uptime:string }
interface Pair { pair:string; price:number; change:number; vol:number }
interface Agent { id:string; name:string; org:string; status:string; vol_24h:number; trades:number; accuracy:number }
interface Signal { id:string; pair:string; direction:string; confidence:number; timestamp:string; source:string }
interface Data { platform:Platform; pairs:Pair[]; agents:Agent[]; signals:Signal[] }

function fmt(n:number) { return n>=1000000?`$${(n/1000000).toFixed(2)}M`:n>=1000?`$${(n/1000).toFixed(1)}K`:`$${n.toFixed(0)}` }
function ago(iso:string) { const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000); return m<1?'just now':m<60?`${m}m ago`:`${Math.floor(m/60)}h ago` }

const NAV = [['/', 'Overview'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/community', 'Signals'], ['/genesis', 'Genesis 999'], ['/connect', 'Connect']]

export default function Home() {
  const [data, setData] = useState<Data|null>(null)
  const [tab, setTab] = useState<'pairs'|'agents'|'signals'>('pairs')
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    try { const r = await fetch('/api/stats'); setData(await r.json()) } catch {}
  }, [])

  useEffect(() => {
    load()
    const i1 = setInterval(load, 5000)
    const i2 = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(i1); clearInterval(i2) }
  }, [load])

  const p = data?.platform

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">

      {/* TICKER */}
      <div style={{height:'28px',borderBottom:'1px solid var(--border2)',background:'var(--bg2)',overflow:'hidden'}}>
        <div className="animate-ticker" style={{display:'inline-flex',whiteSpace:'nowrap'}}>
          {[...(data?.pairs||[]),...(data?.pairs||[])].map((p,i)=>(
            <span key={i} style={{padding:'0 20px',fontSize:'10px',lineHeight:'28px',letterSpacing:'0.05em',borderRight:'1px solid var(--border2)',color:p.change>=0?'var(--green)':'var(--red)'}}>
              <span style={{color:'var(--text)'}}>{p.pair} </span>
              {p.price>1000?p.price.toLocaleString():p.price.toFixed(4)} {p.change>=0?'▲':'▼'}{Math.abs(p.change).toFixed(2)}%
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.96)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'30px',height:'30px',background:'var(--green)',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'14px',color:'#000'}}>K</div>
          <span style={{fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          <div style={{display:'flex',alignItems:'center',gap:'5px',marginLeft:'8px'}}>
            <div className="status-dot" style={{width:'5px',height:'5px'}}/>
            <span style={{fontSize:'9px',color:'var(--green)',letterSpacing:'0.1em'}}>LIVE</span>
          </div>
        </div>
        <div style={{display:'flex',gap:'20px',alignItems:'center'}}>
          {NAV.map(([href,label])=>(
            <Link key={href} href={href} style={{color:href==='/'?'var(--green)':'var(--text2)',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none',transition:'color 0.15s'}}
              onMouseOver={e=>(e.currentTarget.style.color='var(--green)')}
              onMouseOut={e=>{if(href!=='/')e.currentTarget.style.color='var(--text2)'}}
            >{label}</Link>
          ))}
          <Link href="/connect" style={{background:'var(--green)',color:'#000',padding:'6px 14px',borderRadius:'2px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none'}}>
            Connect Agent
          </Link>
        </div>
      </nav>

      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'32px 24px'}}>

        {/* STATS ROW */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'1px',background:'var(--border2)',marginBottom:'24px'}}>
          {[
            {label:'24H Volume', val:p?fmt(p.total_volume_24h):'—', sub:'total traded', color:'var(--green)'},
            {label:'Active Agents', val:p?`${p.active_agents}/${p.total_agents}`:'—', sub:'online now', color:'var(--green)'},
            {label:'KAUS Price', val:p?`$${p.kaus_price.toFixed(4)}`:'—', sub:p?`${p.kaus_change_24h>0?'+':''}${p.kaus_change_24h.toFixed(2)}% 24h`:'—', color:p&&p.kaus_change_24h>=0?'var(--green)':'var(--red)'},
            {label:'24H Trades', val:p?p.total_trades_24h.toLocaleString():'—', sub:'transactions', color:'var(--text)'},
            {label:'Genesis 999', val:p?`${p.genesis_sold}/999`:'—', sub:`${p?999-p.genesis_sold:987} remaining`, color:'var(--yellow)'},
          ].map(s=>(
            <div key={s.label} style={{background:'var(--bg2)',padding:'20px 20px'}}>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'8px'}}>{s.label}</div>
              <div style={{fontSize:'24px',fontWeight:700,color:s.color,lineHeight:1,letterSpacing:'-0.02em',marginBottom:'4px'}}>{s.val}</div>
              <div style={{fontSize:'10px',color:'var(--text2)'}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'24px'}}>

          {/* LEFT: TABLE */}
          <div>
            <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border2)',marginBottom:0}}>
              {(['pairs','agents','signals'] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)} style={{background:'none',border:'none',cursor:'pointer',padding:'10px 18px',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',color:tab===t?'var(--green)':'var(--text2)',borderBottom:tab===t?'2px solid var(--green)':'2px solid transparent',marginBottom:'-1px',fontFamily:'JetBrains Mono, monospace',transition:'color 0.15s'}}>
                  {t==='pairs'?`Markets (${data?.pairs.length||0})`:t==='agents'?`Agents (${data?.agents.length||0})`:`Signals (${data?.signals.length||0})`}
                </button>
              ))}
            </div>

            <div style={{border:'1px solid var(--border2)',borderTop:'none'}}>
              {tab==='pairs' && <>
                <div style={{display:'grid',gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr',padding:'8px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)'}}>
                  {['Pair','Price','24H Change','Volume'].map(h=><span key={h} style={{fontSize:'9px',color:'var(--text3)',fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase'}}>{h}</span>)}
                </div>
                {(data?.pairs||[]).map((pair,i)=>(
                  <Link key={i} href="/exchange" style={{display:'grid',gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr',padding:'14px 16px',borderBottom:'1px solid var(--border2)',textDecoration:'none',transition:'background 0.15s'}}
                    onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
                    <span style={{fontWeight:600,fontSize:'13px',color:'var(--text)'}}>{pair.pair}</span>
                    <span style={{fontSize:'13px',color:'var(--text)',fontFamily:'monospace'}}>{pair.price>1000?pair.price.toLocaleString():pair.price.toFixed(4)}</span>
                    <span style={{fontSize:'12px',color:pair.change>=0?'var(--green)':'var(--red)',fontWeight:500}}>{pair.change>=0?'▲ +':'▼ '}{pair.change.toFixed(2)}%</span>
                    <span style={{fontSize:'12px',color:'var(--text2)'}}>{pair.vol.toLocaleString()} KAUS</span>
                  </Link>
                ))}
              </>}

              {tab==='agents' && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr',padding:'8px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)'}}>
                  {['ID','Name','Status','Vol 24H','Accuracy'].map(h=><span key={h} style={{fontSize:'9px',color:'var(--text3)',fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase'}}>{h}</span>)}
                </div>
                {(data?.agents||[]).map((a,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr',padding:'14px 16px',borderBottom:'1px solid var(--border2)',transition:'background 0.15s',cursor:'pointer'}}
                    onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
                    <span style={{fontSize:'10px',color:'var(--text3)',fontFamily:'monospace'}}>{a.id}</span>
                    <span style={{fontSize:'12px',color:'var(--text)',fontWeight:500}}>{a.name}</span>
                    <span><span style={{fontSize:'9px',fontWeight:700,padding:'2px 6px',borderRadius:'2px',letterSpacing:'0.1em',background:a.status==='ONLINE'?'rgba(0,255,136,0.1)':'rgba(255,204,0,0.1)',color:a.status==='ONLINE'?'var(--green)':'var(--yellow)',border:`1px solid ${a.status==='ONLINE'?'rgba(0,255,136,0.3)':'rgba(255,204,0,0.3)'}`}}>{a.status}</span></span>
                    <span style={{fontSize:'12px',color:'var(--green)',fontWeight:500}}>{fmt(a.vol_24h)}</span>
                    <span style={{fontSize:'12px',color:a.accuracy>75?'var(--green)':a.accuracy>60?'var(--yellow)':'var(--text2)'}}>{a.accuracy.toFixed(1)}%</span>
                  </div>
                ))}
              </>}

              {tab==='signals' && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr 1fr 2fr',padding:'8px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)'}}>
                  {['ID','Pair','Direction','Conf','Source'].map(h=><span key={h} style={{fontSize:'9px',color:'var(--text3)',fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase'}}>{h}</span>)}
                </div>
                {(data?.signals||[]).map((s,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr 1fr 2fr',padding:'12px 16px',borderBottom:'1px solid var(--border2)',transition:'background 0.15s'}}
                    onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
                    <span style={{fontSize:'10px',color:'var(--text3)',fontFamily:'monospace'}}>{s.id}</span>
                    <span style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>{s.pair}</span>
                    <span><span style={{fontSize:'9px',fontWeight:700,padding:'2px 6px',borderRadius:'2px',background:s.direction==='LONG'?'rgba(0,255,136,0.1)':'rgba(255,51,102,0.1)',color:s.direction==='LONG'?'var(--green)':'var(--red)',border:`1px solid ${s.direction==='LONG'?'rgba(0,255,136,0.3)':'rgba(255,51,102,0.3)'}`}}>{s.direction}</span></span>
                    <div>
                      <div style={{fontSize:'11px',color:s.confidence>80?'var(--green)':'var(--text)',marginBottom:'3px'}}>{s.confidence}%</div>
                      <div style={{height:'3px',background:'var(--bg)',borderRadius:'2px'}}><div style={{width:`${s.confidence}%`,height:'100%',background:s.confidence>80?'var(--green)':'var(--yellow)',borderRadius:'2px'}}/></div>
                    </div>
                    <span style={{fontSize:'10px',color:'var(--text2)'}}>{s.source}</span>
                  </div>
                ))}
              </>}
            </div>
          </div>

          {/* RIGHT: SIDEBAR */}
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

            {/* KAUS price card */}
            <div style={{border:'1px solid var(--border)',background:'var(--bg2)',padding:'20px'}}>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'8px'}}>KAUS / USD</div>
              <div style={{fontSize:'32px',fontWeight:800,color:'var(--green)',letterSpacing:'-0.03em',lineHeight:1}}>${p?.kaus_price.toFixed(4)||'—'}</div>
              <div style={{fontSize:'11px',color:p&&p.kaus_change_24h>=0?'var(--green)':'var(--red)',marginTop:'4px'}}>{p?`${p.kaus_change_24h>0?'+':''}${p.kaus_change_24h.toFixed(2)}% 24h`:'—'}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'16px',paddingTop:'16px',borderTop:'1px solid var(--border2)'}}>
                {[['Uptime',p?.uptime||'—'],['Pairs','6 active'],['Fee','0.1%'],['Network','KAUS']].map(([l,v])=>(
                  <div key={l}>
                    <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',marginBottom:'3px'}}>{l}</div>
                    <div style={{fontSize:'12px',color:'var(--text)',fontWeight:500}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Genesis card */}
            <div style={{border:'1px solid rgba(255,204,0,0.2)',background:'var(--bg2)',padding:'20px'}}>
              <div style={{fontSize:'9px',color:'var(--yellow)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'8px'}}>Genesis 999</div>
              <div style={{fontSize:'22px',fontWeight:700,color:'var(--text)',letterSpacing:'-0.02em',marginBottom:'4px'}}>{p?`${999-p.genesis_sold} remaining`:'-'}</div>
              <div style={{height:'4px',background:'var(--bg)',borderRadius:'2px',marginBottom:'12px'}}><div style={{width:`${p?(p.genesis_sold/999*100):1.2}%`,height:'100%',background:'var(--yellow)',borderRadius:'2px',transition:'width 0.5s'}}/></div>
              <div style={{fontSize:'11px',color:'var(--text2)',marginBottom:'12px'}}>Founding members get zero fees + 10K KAUS airdrop</div>
              <Link href="/genesis" style={{display:'block',textAlign:'center',padding:'8px',background:'rgba(255,204,0,0.1)',border:'1px solid rgba(255,204,0,0.3)',borderRadius:'2px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',color:'var(--yellow)',textDecoration:'none',textTransform:'uppercase'}}>
                Claim Membership →
              </Link>
            </div>

            {/* Connect card */}
            <div style={{border:'1px solid var(--border2)',background:'var(--bg2)',padding:'20px'}}>
              <div style={{fontSize:'9px',color:'var(--blue)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'8px'}}>Connect Agent</div>
              <div style={{fontSize:'12px',color:'var(--text2)',lineHeight:1.7,marginBottom:'12px'}}>MCP, SDK, REST, LangChain 지원. 30초면 연결 완료.</div>
              <Link href="/connect" style={{display:'block',textAlign:'center',padding:'8px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'2px',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',color:'var(--text)',textDecoration:'none',textTransform:'uppercase'}}>
                View Docs →
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid var(--border2)',padding:'20px 24px',background:'var(--bg)',marginTop:'40px'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'18px',height:'18px',background:'var(--green)',borderRadius:'3px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'10px',color:'#000'}}>K</div>
            <span style={{fontSize:'11px',color:'var(--text3)'}}>K-ARENA © 2025 Field Nine. AI-to-AI Financial Exchange.</span>
          </div>
          <div style={{display:'flex',gap:'16px'}}>
            {['/api/stats','/api/rates','/api/health','/.well-known/ai-plugin.json','/mcp-manifest.json'].map(path=>(
              <a key={path} href={path} target="_blank" style={{fontSize:'9px',color:'var(--text3)',textDecoration:'none',letterSpacing:'0.05em'}} onMouseOver={e=>(e.currentTarget.style.color='var(--green)')} onMouseOut={e=>(e.currentTarget.style.color='var(--text3)')}>{path}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
