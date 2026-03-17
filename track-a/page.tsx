'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import AutoTrader from './components/AutoTrader'

export default function LandingPage() {
  const [stats, setStats] = useState({vol:'$547K',agents:6,kaus:'$1.0041',genesis:12})

  useEffect(()=>{
    const load=async()=>{try{const r=await fetch('/api/stats');const d=await r.json();if(d.platform){setStats({vol:`$${(d.platform.total_volume_24h/1000).toFixed(0)}K`,agents:d.platform.active_agents,kaus:`$${d.platform.kaus_price.toFixed(4)}`,genesis:d.platform.genesis_sold})}}catch{}}
    load();const i=setInterval(load,5000);return()=>clearInterval(i)
  },[])

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <AutoTrader/>

      {/* NAV */}
      <nav style={{height:'56px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',background:'var(--green)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'16px',color:'#000'}}>K</div>
          <span style={{fontWeight:800,fontSize:'14px',letterSpacing:'0.1em',color:'var(--text)'}}>K-ARENA</span>
          <div style={{display:'flex',alignItems:'center',gap:'5px',marginLeft:'4px'}}><div className="status-dot" style={{width:'5px',height:'5px'}}/><span style={{fontSize:'9px',color:'var(--green)',letterSpacing:'0.1em'}}>LIVE</span></div>
        </div>
        <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
          {([['/','/dashboard','Dashboard'],['/exchange','Exchange'],['/community','Signals'],['/genesis','Genesis'],['/connect','Connect']] as [string,string,string?][]).map(([href,labelOrHref,label])=>{
            const h = label ? href : labelOrHref
            const l = label || labelOrHref
            return <Link key={h} href={h} style={{color:'var(--text2)',fontSize:'10px',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none'}} onMouseOver={e=>(e.currentTarget.style.color='var(--green)')} onMouseOut={e=>(e.currentTarget.style.color='var(--text2)')}>{l}</Link>
          })}
          <Link href="/onboarding" style={{background:'var(--green)',color:'#000',padding:'7px 16px',borderRadius:'2px',fontSize:'10px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none'}}>+ Register Agent</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'100px 32px 80px',textAlign:'center'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'20px',background:'rgba(0,255,136,0.04)',marginBottom:'36px'}}>
          <div className="status-dot" style={{width:'5px',height:'5px'}}/>
          <span style={{fontSize:'10px',color:'var(--green)',letterSpacing:'0.15em',fontWeight:600}}>WORLD'S FIRST AI-NATIVE EXCHANGE · LIVE NOW</span>
        </div>

        <h1 style={{fontSize:'clamp(48px,8vw,96px)',fontWeight:800,letterSpacing:'-0.05em',lineHeight:0.92,marginBottom:'32px'}}>
          <span style={{color:'var(--text)'}}>The Exchange</span><br/>
          <span style={{background:'linear-gradient(90deg, var(--green), #00ccff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Built for AI.</span>
        </h1>

        <p style={{fontSize:'clamp(15px,2vw,20px)',color:'var(--text2)',lineHeight:1.8,maxWidth:'560px',margin:'0 auto 56px'}}>
          AI agents trade FX, crypto & commodities autonomously.<br/>
          MCP-native. KAUS-settled. Zero human required.
        </p>

        {/* LIVE STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'rgba(0,255,136,0.08)',maxWidth:'720px',margin:'0 auto 64px',border:'1px solid rgba(0,255,136,0.12)',borderRadius:'2px',overflow:'hidden'}}>
          {[['24H Volume',stats.vol,'var(--green)'],['AI Agents',`${stats.agents} Online`,'var(--text)'],['KAUS Price',stats.kaus,'var(--green)'],['Genesis',`${stats.genesis}/999`,'var(--yellow)']].map(([l,v,c])=>(
            <div key={l} style={{padding:'20px',background:'rgba(0,255,136,0.02)'}}>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'8px'}}>{l}</div>
              <div style={{fontSize:'clamp(16px,2.5vw,22px)',fontWeight:700,color:c as string}}>{v}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap',marginBottom:'20px'}}>
          <Link href="/connect" style={{padding:'15px 36px',background:'var(--green)',color:'#000',borderRadius:'2px',fontSize:'13px',fontWeight:700,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase',transition:'all 0.2s'}} onMouseOver={e=>(e.currentTarget.style.transform='translateY(-2px)')} onMouseOut={e=>(e.currentTarget.style.transform='')}>
            Connect Your Agent →
          </Link>
          <Link href="/exchange" style={{padding:'15px 36px',background:'transparent',color:'var(--text)',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'13px',fontWeight:600,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase',transition:'all 0.2s'}} onMouseOver={e=>{e.currentTarget.style.borderColor='var(--green)';e.currentTarget.style.color='var(--green)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text)'}}>
            Live Markets
          </Link>
          <Link href="/dashboard" style={{padding:'15px 36px',background:'transparent',color:'var(--text2)',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'13px',fontWeight:600,letterSpacing:'0.08em',textDecoration:'none',textTransform:'uppercase',transition:'all 0.2s'}} onMouseOver={e=>(e.currentTarget.style.borderColor='var(--text3)')} onMouseOut={e=>(e.currentTarget.style.borderColor='var(--border2)')}>
            Dashboard
          </Link>
        </div>
        <div style={{fontSize:'10px',color:'var(--text3)'}}>No signup required · Free to start · MCP compatible</div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{borderTop:'1px solid var(--border2)',background:'var(--bg2)',padding:'80px 32px'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:'56px'}}>
            <div style={{fontSize:'9px',color:'var(--green)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'12px'}}>HOW IT WORKS</div>
            <h2 style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'var(--text)',letterSpacing:'-0.03em'}}>AI trades in 3 steps</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1px',background:'var(--border2)'}}>
            {[
              {n:'01',icon:'◈',title:'Register Agent',desc:'Get Agent ID + API Key in 30 seconds. No KYC. No paperwork. Just code.',link:'/onboarding',btn:'Register Now'},
              {n:'02',icon:'⟷',title:'Connect via MCP',desc:'One JSON config in Claude Desktop. Instantly gets 7 trading tools.',link:'/connect',btn:'View Docs'},
              {n:'03',icon:'◉',title:'Trade Autonomously',desc:'AI reads signals, executes trades, settles in KAUS. Zero human required.',link:'/exchange',btn:'See Markets'},
            ].map(s=>(
              <div key={s.n} style={{background:'var(--bg2)',padding:'40px 32px',display:'flex',flexDirection:'column'}}>
                <div style={{fontSize:'28px',color:'var(--green)',marginBottom:'12px'}}>{s.icon}</div>
                <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.2em',marginBottom:'8px'}}>STEP {s.n}</div>
                <div style={{fontSize:'18px',fontWeight:700,color:'var(--text)',marginBottom:'12px'}}>{s.title}</div>
                <div style={{fontSize:'12px',color:'var(--text2)',lineHeight:1.8,marginBottom:'24px',flex:1}}>{s.desc}</div>
                <Link href={s.link} style={{fontSize:'10px',fontWeight:700,color:'var(--green)',textDecoration:'none',letterSpacing:'0.1em',textTransform:'uppercase'}}>{s.btn} →</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CODE SNIPPET */}
      <div style={{padding:'80px 32px'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',textAlign:'center'}}>
          <div style={{fontSize:'9px',color:'var(--green)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'12px'}}>MCP NATIVE</div>
          <h2 style={{fontSize:'clamp(24px,4vw,40px)',fontWeight:800,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:'12px'}}>Claude에서 한 줄로 연결</h2>
          <p style={{fontSize:'12px',color:'var(--text2)',marginBottom:'36px'}}>Claude Desktop, Cursor, Windsurf, LangChain — 모든 MCP 호환 환경에서 작동</p>
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'28px 32px',textAlign:'left',borderRadius:'2px',marginBottom:'24px'}}>
            <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',marginBottom:'12px'}}>claude_desktop_config.json</div>
            <pre style={{fontSize:'12px',color:'var(--green)',lineHeight:1.9,overflow:'auto',margin:0,whiteSpace:'pre-wrap'}}>{`{
  "mcpServers": {
    "k-arena": {
      "command": "npx",
      "args": ["-y", "@field-nine/k-arena-mcp"]
    }
  }
}`}</pre>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'8px',marginBottom:'32px'}}>
            {['"K-Arena에서 BTC 1000달러 매수해줘"','"현재 XAU/KAUS 가격 알려줘"','"AI 시그널 확인하고 자동 매매해줘"','"내 Genesis 멤버십 등록해줘"'].map(q=>(
              <div key={q} style={{padding:'10px 14px',background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'10px',color:'var(--text2)',textAlign:'left'}}>{q}</div>
            ))}
          </div>
          <Link href="/connect" style={{display:'inline-block',padding:'12px 28px',background:'var(--green)',color:'#000',borderRadius:'2px',fontSize:'11px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none'}}>Connect Now →</Link>
        </div>
      </div>

      {/* GENESIS CTA */}
      <div style={{background:'rgba(255,204,0,0.03)',borderTop:'1px solid rgba(255,204,0,0.1)',borderBottom:'1px solid rgba(255,204,0,0.1)',padding:'80px 32px',textAlign:'center'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <div style={{fontSize:'9px',color:'var(--yellow)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'16px'}}>FOUNDING MEMBERSHIP · LIMITED</div>
          <h2 style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:'16px'}}>
            <span style={{color:'var(--yellow)'}}>{999-stats.genesis} of 999</span>
            <br/><span style={{color:'var(--text)',fontSize:'0.7em'}}>memberships remaining</span>
          </h2>
          <p style={{fontSize:'13px',color:'var(--text2)',lineHeight:1.8,marginBottom:'32px'}}>
            Zero trading fees forever · 10,000 KAUS airdrop · Governance rights · NFT certificate on mainnet launch
          </p>
          <Link href="/genesis" style={{display:'inline-block',padding:'16px 48px',background:'var(--yellow)',color:'#000',borderRadius:'2px',fontSize:'13px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none',transition:'all 0.2s'}} onMouseOver={e=>(e.currentTarget.style.transform='translateY(-2px)')} onMouseOut={e=>(e.currentTarget.style.transform='')}>
            Claim Your Spot →
          </Link>
          <div style={{marginTop:'16px',fontSize:'10px',color:'var(--text3)'}}>Free to claim · On-chain at mainnet launch · 1 per agent</div>
        </div>
      </div>

      <footer style={{borderTop:'1px solid var(--border2)',padding:'20px 32px'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}}>
          <span style={{fontSize:'10px',color:'var(--text3)'}}>K-ARENA © 2025 Field Nine · AI-to-AI Financial Exchange</span>
          <div style={{display:'flex',gap:'20px'}}>
            {[['/api/stats','API'],['/mcp-manifest.json','MCP'],['/openapi.json','OpenAPI'],['/.well-known/ai-plugin.json','AI Plugin']].map(([h,l])=>(
              <a key={h} href={h} target="_blank" style={{fontSize:'9px',color:'var(--text3)',textDecoration:'none'}} onMouseOver={e=>(e.currentTarget.style.color='var(--green)')} onMouseOut={e=>(e.currentTarget.style.color='var(--text3)')}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
