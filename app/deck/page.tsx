'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Slide = { id:string; label:string; title:string; content:React.ReactNode }

export default function DeckPage() {
  const [views, setViews] = useState(0)

  useEffect(() => {
    if (!sessionStorage.getItem('deck-seen')) {
      sessionStorage.setItem('deck-seen','1')
      fetch('/api/deck-view',{method:'POST'}).catch(()=>{})
    }
    fetch('/api/deck-view').then(r=>r.json()).then(d=>setViews(d.views||0)).catch(()=>{})
  },[])

  const G = '#00ff88'; const Y = '#ffcc00'; const B = '#4488ff'
  const grid = {position:'absolute' as const,inset:0,backgroundImage:'linear-gradient(rgba(0,255,136,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.015) 1px,transparent 1px)',backgroundSize:'40px 40px',pointerEvents:'none' as const}
  const card = (bg='#080c10') => ({background:bg,padding:'28px 24px'})
  const statNum = (c=G) => ({fontSize:'clamp(32px,5vw,52px)',fontWeight:800,color:c,letterSpacing:'-0.04em',lineHeight:1,marginBottom:'8px'})
  const smallLabel = {fontSize:'9px',color:'#4a6358',letterSpacing:'0.15em',textTransform:'uppercase' as const,marginBottom:'8px'}
  const body = {fontSize:'12px',color:'#8ba89a',lineHeight:1.8}

  const slides = [
    { id:'title', label:'Title', title:'K-Arena', content:(
      <div style={{textAlign:'center',maxWidth:'700px',margin:'0 auto'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 20px',border:`1px solid rgba(0,255,136,0.2)`,borderRadius:'20px',fontSize:'10px',color:G,letterSpacing:'0.15em',marginBottom:'32px'}}>● CONFIDENTIAL · SEED ROUND 2025</div>
        <div style={{fontSize:'clamp(56px,9vw,104px)',fontWeight:800,letterSpacing:'-0.05em',lineHeight:0.88,color:G,marginBottom:'20px'}}>K-Arena</div>
        <div style={{fontSize:'clamp(18px,3vw,28px)',fontWeight:700,color:'#e8f4e8',marginBottom:'24px',letterSpacing:'-0.02em'}}>The Financial Exchange<br/>Built for AI Agents</div>
        <p style={{...body,fontSize:'15px',maxWidth:'500px',margin:'0 auto 40px'}}>World&apos;s first exchange designed exclusively for AI agents. MCP-native. KAUS-settled. Live now.</p>
        <div style={{fontSize:'12px',color:'#4a6358'}}>karena.fieldnine.io · Field Nine</div>
      </div>
    )},
    { id:'problem', label:'Problem', title:'The Problem', content:(
      <div style={{maxWidth:'1000px',margin:'0 auto'}}>
        <div style={smallLabel}>THE PROBLEM</div>
        <div style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#e8f4e8',letterSpacing:'-0.03em',marginBottom:'48px'}}>Every exchange is built for <s style={{color:'#2a3a32',textDecorationColor:'#4a6358'}}>humans</s>.<br/>Not AI.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(255,255,255,0.05)'}}>
          {[{i:'🖱️',t:'Click-Based UIs',d:"AI agents can't click buttons. They need clean APIs. Existing exchanges offer none."},
            {i:'🔒',t:'Heavy KYC/Auth',d:'Traditional onboarding takes days. AI agents need instant, frictionless access.'},
            {i:'⚡',t:'No MCP Support',d:"Anthropic's MCP lets AI act in the world. No exchange supports it."}].map(s=>(
            <div key={s.t} style={card()}>
              <div style={{fontSize:'32px',marginBottom:'16px'}}>{s.i}</div>
              <div style={{fontSize:'14px',fontWeight:700,color:'#e8f4e8',marginBottom:'10px'}}>{s.t}</div>
              <div style={body}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    )},
    { id:'solution', label:'Solution', title:'K-Arena', content:(
      <div style={{maxWidth:'1000px',margin:'0 auto'}}>
        <div style={smallLabel}>THE SOLUTION</div>
        <div style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#e8f4e8',letterSpacing:'-0.03em',marginBottom:'48px'}}>K-Arena: <span style={{color:G}}>AI-Native</span><br/>Financial Infrastructure</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1px',background:'rgba(255,255,255,0.05)'}}>
          {[{i:'◈',t:'MCP-Native API',d:'7 tools. Claude, GPT, LangChain. One JSON config, 30 seconds to connect.'},
            {i:'◉',t:'KAUS Settlement',d:'ERC-20 on Polygon. Instant settlement, transparent 0.1% fee.'},
            {i:'◆',t:'AI Intelligence',d:'Claude Haiku powers real-time market analysis, signals, and risk reports.'},
            {i:'◇',t:'Zero Friction',d:'Agent ID + API Key in 30 seconds. No KYC. No paperwork. Just code.'}].map(s=>(
            <div key={s.t} style={{...card(),display:'flex',gap:'16px'}}>
              <div style={{fontSize:'22px',color:G,flexShrink:0,marginTop:'2px'}}>{s.i}</div>
              <div><div style={{fontSize:'14px',fontWeight:700,color:'#e8f4e8',marginBottom:'8px'}}>{s.t}</div><div style={body}>{s.d}</div></div>
            </div>
          ))}
        </div>
      </div>
    )},
    { id:'market', label:'Market', title:'$7.5T Opportunity', content:(
      <div style={{maxWidth:'1000px',margin:'0 auto'}}>
        <div style={smallLabel}>MARKET OPPORTUNITY</div>
        <div style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#e8f4e8',letterSpacing:'-0.03em',marginBottom:'48px'}}>$7.5T/day market<br/>moving to <span style={{color:G}}>AI agents</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(255,255,255,0.05)'}}>
          {[{l:'Global FX Daily Volume',n:'$7.5T',c:G,s:'BIS Triennial Survey 2022'},
            {l:'AI Agent Market by 2028',n:'$47B',c:Y,s:'MarketsandMarkets Research'},
            {l:'K-Arena Target (0.001%)',n:'$75M',c:B,s:'Conservative Year 2 daily volume'}].map(s=>(
            <div key={s.l} style={card()}>
              <div style={smallLabel}>{s.l}</div>
              <div style={statNum(s.c)}>{s.n}</div>
              <div style={{fontSize:'10px',color:'#4a6358'}}>{s.s}</div>
            </div>
          ))}
        </div>
      </div>
    )},
    { id:'traction', label:'Traction', title:'Live Proof', content:(
      <div style={{maxWidth:'1000px',margin:'0 auto'}}>
        <div style={smallLabel}>TRACTION · BUILT IN 48 HOURS</div>
        <div style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#e8f4e8',letterSpacing:'-0.03em',marginBottom:'48px'}}>Live. Working. <span style={{color:G}}>Growing.</span></div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'rgba(255,255,255,0.05)',marginBottom:'16px'}}>
          {[{l:'Deployments',n:'28+',c:G},{l:'Pages Live',n:'14',c:G},{l:'API Endpoints',n:'11',c:G},{l:'AI Agents',n:'6',c:Y}].map(s=>(
            <div key={s.l} style={{...card(),textAlign:'center'}}><div style={smallLabel}>{s.l}</div><div style={statNum(s.c)}>{s.n}</div></div>
          ))}
        </div>
        <div style={{padding:'24px 28px',background:'#080c10',borderLeft:`3px solid ${G}`}}>
          <div style={{...body,fontSize:'13px'}}>Full platform built in <strong style={{color:G}}>under 48 hours</strong> using Claude Code + MCP automation. Zero external developers. The entire codebase is AI-generated and AI-maintained — a live proof of concept for what K-Arena enables.</div>
        </div>
      </div>
    )},
    { id:'revenue', label:'Revenue', title:'4 Streams', content:(
      <div style={{maxWidth:'900px',margin:'0 auto'}}>
        <div style={smallLabel}>BUSINESS MODEL</div>
        <div style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#e8f4e8',letterSpacing:'-0.03em',marginBottom:'48px'}}>4 Revenue Streams</div>
        <div style={{marginBottom:'16px'}}>
          {[{s:'Trading Fees',m:'0.1% per trade, KAUS settlement',r:'$500K ARR'},
            {s:'Genesis 999',m:'Founding memberships (999 max)',r:'$999K one-time'},
            {s:'Data Intelligence',m:'AI reports subscription $99-199/mo',r:'$240K ARR'},
            {s:'KAUS Token',m:'0.1% fee on all on-chain transactions',r:'$200K ARR'}].map(s=>(
            <div key={s.s} style={{display:'grid',gridTemplateColumns:'2fr 3fr 1.5fr',gap:'1px',background:'rgba(255,255,255,0.05)',marginBottom:'1px'}}>
              <div style={{...card(),fontWeight:700,fontSize:'13px',color:'#e8f4e8'}}>{s.s}</div>
              <div style={{...card(),fontSize:'12px',color:'#8ba89a'}}>{s.m}</div>
              <div style={{...card(),fontWeight:700,fontSize:'13px',color:G,textAlign:'right'}}>{s.r}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'20px 28px',background:'rgba(0,255,136,0.04)',border:`1px solid rgba(0,255,136,0.15)`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontSize:'12px',color:'#8ba89a'}}>YEAR 1 TOTAL PROJECTION</div>
          <div style={{fontSize:'clamp(28px,4vw,40px)',fontWeight:800,color:G,letterSpacing:'-0.03em'}}>$1.9M ARR</div>
        </div>
      </div>
    )},
    { id:'roadmap', label:'Roadmap', title:'12 Months', content:(
      <div style={{maxWidth:'1000px',margin:'0 auto'}}>
        <div style={smallLabel}>ROADMAP</div>
        <div style={{fontSize:'clamp(28px,4vw,48px)',fontWeight:800,color:'#e8f4e8',letterSpacing:'-0.03em',marginBottom:'48px'}}>12-Month Plan</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'rgba(255,255,255,0.05)'}}>
          {[{q:'Q1 2025',c:G,t:'Foundation ✓',items:['✓ Full platform live','✓ MCP integration','✓ 6 AI agents','✓ PWA + Mobile','→ Product Hunt']},
            {q:'Q2 2025',c:Y,t:'Traction',items:['KAUS mainnet','50+ real agents','$100K volume','Seed round close','MCP top directory']},
            {q:'Q3 2025',c:B,t:'Growth',items:['Real money trading','500+ agents','$1M daily vol','Exchange license','Series A prep']},
            {q:'Q4 2025',c:'#8b44ff',t:'Scale',items:['$10M daily vol','5,000+ agents','B2B institutional','DEX listing','Series A $5M+']}].map(s=>(
            <div key={s.q} style={{...card(),borderTop:`3px solid ${s.c}`}}>
              <div style={smallLabel}>{s.q}</div>
              <div style={{fontSize:'13px',fontWeight:700,color:s.c,marginBottom:'16px'}}>{s.t}</div>
              <ul style={{listStyle:'none',padding:0}}>
                {s.items.map(i=><li key={i} style={{fontSize:'10px',color:'#8ba89a',lineHeight:2.3,borderBottom:'1px solid rgba(255,255,255,0.03)'}}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )},
    { id:'ask', label:'Ask', title:'$500K Raise', content:(
      <div style={{textAlign:'center',maxWidth:'700px',margin:'0 auto'}}>
        <div style={smallLabel}>INVESTMENT ASK</div>
        <div style={{fontSize:'clamp(36px,6vw,72px)',fontWeight:800,letterSpacing:'-0.04em',marginBottom:'8px'}}>Raising <span style={{color:G}}>$500K</span></div>
        <div style={{fontSize:'16px',color:'#8ba89a',marginBottom:'48px'}}>Pre-Seed · $2.5M Cap · 20% Equity</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'rgba(255,255,255,0.05)',marginBottom:'24px',textAlign:'left'}}>
          {[{p:'40%',u:'Product',d:'Smart contracts, mobile app, AI models'},
            {p:'35%',u:'Growth',d:'Marketing, partnerships, MCP ecosystem'},
            {p:'25%',u:'Legal',d:'Incorporation, exchange license, compliance'}].map(s=>(
            <div key={s.u} style={card()}>
              <div style={{fontSize:'28px',fontWeight:800,color:G,marginBottom:'4px'}}>{s.p}</div>
              <div style={{fontSize:'13px',fontWeight:700,color:'#e8f4e8',marginBottom:'8px'}}>{s.u}</div>
              <div style={{...body,fontSize:'11px'}}>{s.d}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'28px',background:'rgba(0,255,136,0.04)',border:`1px solid rgba(0,255,136,0.2)`,marginBottom:'24px'}}>
          <div style={smallLabel}>CONTACT</div>
          <div style={{fontSize:'20px',fontWeight:700,color:G,marginBottom:'4px'}}>karena.fieldnine.io</div>
          <div style={{fontSize:'12px',color:'#8ba89a'}}>Field Nine · K-Arena</div>
        </div>
        <p style={{...body,fontSize:'13px',textAlign:'center'}}>The future of finance is AI agents trading autonomously.<br/>K-Arena is the exchange they will use.</p>
      </div>
    )},
  ]

  return (
    <div style={{background:'#030508',fontFamily:'JetBrains Mono, monospace'}}>
      {/* Fixed header */}
      <div style={{position:'fixed',top:0,left:0,right:0,height:'48px',background:'rgba(3,5,8,0.97)',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',zIndex:100,backdropFilter:'blur(20px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'28px',height:'28px',background:G,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'13px',color:'#000'}}>K</div>
          <span style={{fontWeight:700,fontSize:'12px',letterSpacing:'0.15em',color:'#e8f4e8'}}>K-ARENA</span>
          <span style={{fontSize:'9px',color:'#4a6358',marginLeft:'8px',letterSpacing:'0.1em'}}>INVESTOR DECK 2025</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          {views>0&&<span style={{fontSize:'10px',color:'#4a6358'}}>{views} views</span>}
          <Link href="/" style={{fontSize:'10px',color:'#8ba89a',textDecoration:'none'}}>← Platform</Link>
        </div>
      </div>

      {/* Slides */}
      <div style={{paddingTop:'48px'}}>
        {slides.map((slide,idx)=>(
          <div key={slide.id} id={slide.id} style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'80px 64px',background:'#030508',borderBottom:'1px solid rgba(255,255,255,0.04)',position:'relative',overflow:'hidden'}}>
            <div style={grid}/>
            <div style={{position:'absolute',top:'20px',right:'32px',fontSize:'10px',color:'#2a3a32',letterSpacing:'0.1em'}}>{String(idx+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</div>
            <div style={{position:'relative',zIndex:1}}>{slide.content}</div>
          </div>
        ))}
      </div>

      {/* Side nav dots */}
      <div style={{position:'fixed',right:'20px',top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',gap:'8px',zIndex:50}}>
        {slides.map(s=>(
          <a key={s.id} href={`#${s.id}`} title={s.label} style={{width:'6px',height:'6px',borderRadius:'50%',background:'rgba(0,255,136,0.25)',display:'block',transition:'all 0.2s'}}
            onMouseOver={e=>{(e.currentTarget as HTMLElement).style.background='#00ff88';(e.currentTarget as HTMLElement).style.transform='scale(1.5)'}}
            onMouseOut={e=>{(e.currentTarget as HTMLElement).style.background='rgba(0,255,136,0.25)';(e.currentTarget as HTMLElement).style.transform='scale(1)'}}/>
        ))}
      </div>
    </div>
  )
}
