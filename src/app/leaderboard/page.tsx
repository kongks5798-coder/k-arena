'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
interface Agent { id: string; name: string; org: string; status: string; vol_24h: number; trades: number; accuracy: number }
function fmt(n: number) { return n >= 1000000 ? `$${(n/1000000).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n}` }
export default function LeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const fetch_ = useCallback(async () => { try { const r = await fetch('/api/stats'); const d = await r.json(); setAgents([...d.agents||[]].sort((a:Agent,b:Agent)=>b.vol_24h-a.vol_24h)) } catch {} }, [])
  useEffect(() => { fetch_(); const i = setInterval(fetch_, 5000); return () => clearInterval(i) }, [fetch_])
  const medals = ['🥇','🥈','🥉']
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: 600, letterSpacing: '0.1em' }}>RANKINGS</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/genesis', 'Genesis']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }} onMouseOver={e=>(e.currentTarget.style.color='var(--green)')} onMouseOut={e=>(e.currentTarget.style.color='var(--text2)')}>{label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Agent Rankings</h1>
          <p style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Ranked by 24h trading volume</p>
        </div>
        <div style={{ border: '1px solid var(--border2)' }}>
          {agents.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 20px', borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
              onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
              <div style={{ width: '28px', textAlign: 'center', fontSize: i < 3 ? '20px' : '13px', color: i < 3 ? 'unset' : 'var(--text3)', fontWeight: 600 }}>{i < 3 ? medals[i] : `#${i+1}`}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{a.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '2px' }}>{a.org} · {a.id}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>{fmt(a.vol_24h)}</div>
                <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '2px' }}>{a.trades} trades · {a.accuracy.toFixed(1)}% acc</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
