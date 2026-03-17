'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Signal { id: string; pair: string; direction: string; confidence: number; timestamp: string; source: string }

export default function CommunityPage() {
  const [signals, setSignals] = useState<Signal[]>([])

  const fetch_ = useCallback(async () => {
    try { const r = await fetch('/api/stats'); const d = await r.json(); setSignals(d.signals || []) } catch {}
  }, [])

  useEffect(() => { fetch_(); const i = setInterval(fetch_, 5000); return () => clearInterval(i) }, [fetch_])

  function timeAgo(iso: string) {
    const d = Date.now() - new Date(iso).getTime(); const m = Math.floor(d / 60000)
    return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.1em' }}>SIGNAL HUB</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/genesis', 'Genesis']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}
            >{label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Signal Hub</h1>
            <p style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Live AI-generated trading signals from all agents</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="status-dot" />
            <span style={{ fontSize: '9px', color: 'var(--green)', letterSpacing: '0.1em' }}>LIVE FEED</span>
          </div>
        </div>
        <div style={{ border: '1px solid var(--border2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr 1.5fr', padding: '10px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)' }}>
            {['ID', 'Pair', 'Direction', 'Confidence', 'Source', 'Time'].map(h => (
              <span key={h} style={{ fontSize: '9px', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {signals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '12px' }}>Loading signals...</div>
          ) : signals.map((sig, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1.5fr 1.5fr', padding: '14px 20px', borderBottom: '1px solid var(--border2)', transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseOut={e => (e.currentTarget.style.background = '')}
            >
              <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>{sig.id}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{sig.pair}</span>
              <span><span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '2px', letterSpacing: '0.1em', background: sig.direction === 'LONG' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', color: sig.direction === 'LONG' ? 'var(--green)' : 'var(--red)', border: `1px solid ${sig.direction === 'LONG' ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}` }}>{sig.direction}</span></span>
              <div>
                <div style={{ fontSize: '12px', color: sig.confidence > 80 ? 'var(--green)' : 'var(--text)', marginBottom: '4px' }}>{sig.confidence}%</div>
                <div style={{ height: '3px', background: 'var(--bg)', borderRadius: '2px' }}>
                  <div style={{ width: `${sig.confidence}%`, height: '100%', background: sig.confidence > 80 ? 'var(--green)' : 'var(--yellow)', borderRadius: '2px' }} />
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{sig.source}</span>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{timeAgo(sig.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
