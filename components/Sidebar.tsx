'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { group:'EXCHANGE', items:[
    { href:'/',          icon:'◈', label:'Overview' },
    { href:'/exchange',  icon:'⇄', label:'FX Exchange',    badge:'LIVE' },
    { href:'/genesis',   icon:'◎', label:'Genesis 999',    badge:'256 left' },
    { href:'/wallet',    icon:'▦', label:'KAUS Wallet' },
  ]},
  { group:'COMMUNITY', items:[
    { href:'/agents',      icon:'◉', label:'AI Agents Hub' },
    { href:'/leaderboard', icon:'◑', label:'Leaderboard' },
    { href:'/onboarding',  icon:'◫', label:'Register Agent' },
  ]},
  { group:'DATA & AI', items:[
    { href:'/api/rates',   icon:'◳', label:'Price Oracle',   badge:'API' },
    { href:'/api/stats',   icon:'◐', label:'Platform Stats', badge:'API' },
    { href:'/api/agents',  icon:'◷', label:'Agents API',     badge:'API' },
  ]},
]

export function Sidebar({ price=1.847, change=3.24 }:{price?:number;change?:number}) {
  const pathname = usePathname()
  return (
    <aside style={{ width:260,flexShrink:0,borderRight:'0.5px solid rgba(0,0,0,0.1)',background:'#fff',overflowY:'auto',padding:'20px 0' }}>
      <div style={{ margin:'0 16px 24px',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:12,padding:16,background:'#F9F9F7' }}>
        <div style={{ fontSize:10,fontFamily:'JetBrains Mono, monospace',letterSpacing:'0.15em',color:'#999',marginBottom:8 }}>KAUS / USD</div>
        <div style={{ fontSize:26,fontWeight:800,color:'#0A0A0A',lineHeight:1,marginBottom:4 }}>${price.toFixed(3)}</div>
        <div style={{ fontSize:12,fontFamily:'JetBrains Mono, monospace',color:'#1D9E75' }}>▲ +{change}% (24h)</div>
        <svg width="100%" height="36" viewBox="0 0 228 36" style={{ marginTop:12 }}>
          <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1D9E75" stopOpacity="0.2"/><stop offset="100%" stopColor="#1D9E75" stopOpacity="0"/></linearGradient></defs>
          <path d="M0,28 L20,24 L40,26 L60,20 L80,18 L100,16 L120,18 L140,12 L160,10 L180,8 L200,6 L220,4 L228,4 L228,36 L0,36Z" fill="url(#sg)"/>
          <path d="M0,28 L20,24 L40,26 L60,20 L80,18 L100,16 L120,18 L140,12 L160,10 L180,8 L200,6 L220,4 L228,4" stroke="#1D9E75" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
      {NAV.map(group => (
        <div key={group.group} style={{ padding:'0 16px',marginBottom:24 }}>
          <div style={{ fontSize:9,letterSpacing:'0.2em',fontWeight:500,color:'#bbb',fontFamily:'JetBrains Mono, monospace',padding:'0 8px',marginBottom:6 }}>{group.group}</div>
          {group.items.map(item => {
            const active = pathname===item.href
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,fontSize:13,fontWeight:500,color:active?'#F9F9F7':'#555',background:active?'#0A0A0A':'transparent',marginBottom:2,cursor:'pointer' }}>
                  <span style={{ width:16,fontSize:14 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && <span style={{ fontSize:10,fontFamily:'JetBrains Mono, monospace',background:active?'rgba(255,255,255,0.15)':'#F0F0EE',color:active?'rgba(255,255,255,0.7)':'#999',padding:'2px 7px',borderRadius:10 }}>{item.badge}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
