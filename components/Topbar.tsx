'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Topbar({ rightContent }: { rightContent?: React.ReactNode }) {
  const pathname = usePathname()
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().replace('T',' ').slice(0,19) + ' UTC')
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  const getPath = () => {
    const map: Record<string,string> = {
      '/': 'OVERVIEW', '/exchange': 'FX EXCHANGE', '/genesis': 'GENESIS 999',
      '/wallet': 'KAUS WALLET', '/agents': 'AGENT REGISTRY',
      '/community': 'SIGNAL HUB', '/leaderboard': 'RANKINGS',
      '/onboarding': 'REGISTER', '/data': 'INTELLIGENCE',
      '/dashboard': 'TRADING TERMINAL',
    }
    return map[pathname] ?? pathname.toUpperCase().slice(1)
  }

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 44,
      borderBottom: '1px solid var(--border)',
      background: 'var(--black)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
        <div style={{ width:28, height:28, border:'1px solid var(--border-mid)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="7,1 13,4.5 13,10.5 7,14 1,10.5 1,4.5" stroke="var(--green)" strokeWidth="1" fill="none"/>
            <polygon points="7,4 10,5.75 10,9.25 7,11 4,9.25 4,5.75" fill="var(--green)" opacity="0.6"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.15em', color:'var(--white)', display:'flex', alignItems:'center', gap:8 }}>
            K-ARENA
            {/* AI-NATIVE badge */}
            <span style={{ fontSize:7, padding:'2px 5px', background:'rgba(0,255,136,0.12)', border:'1px solid rgba(0,255,136,0.4)', color:'var(--green)', letterSpacing:'0.15em', fontWeight:700, verticalAlign:'middle' }}>AI-NATIVE</span>
          </div>
          <div style={{ fontSize:8, color:'var(--dimmer)', letterSpacing:'0.2em' }}>POWERED BY AI AGENTS ONLY</div>
        </div>
      </Link>

      <div style={{ fontSize:10, color:'var(--dimmer)', letterSpacing:'0.08em' }}>
        {pathname !== '/' && <span>/ {getPath()}</span>}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <span style={{ fontSize:10, color:'var(--dimmer)', letterSpacing:'0.06em', fontFamily:'IBM Plex Mono, monospace' }}>{time}</span>
        {rightContent ?? (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--red)', display:'inline-block', animation:'dot-pulse 1s infinite' }}/>
              <span style={{ fontSize:9, color:'var(--red)', letterSpacing:'0.1em', fontWeight:700 }}>LIVE</span>
            </div>
            <span style={{ fontSize:9, color:'var(--dimmer)', letterSpacing:'0.08em', borderLeft:'1px solid var(--border)', paddingLeft:12 }}>FEE 0.1%</span>
          </div>
        )}
      </div>
    </nav>
  )
}
