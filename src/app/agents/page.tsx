'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Agent { id: string; name: string; org: string; status: string; vol_24h: number; trades: number; accuracy: number }

function fmt(n: number) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(2)}M`
  if (n >= 1000) return `$${(n/1000).toFixed(1)}K`
  return `$${n}`
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [sort, setSort] = useState<keyof Agent>('vol_24h')

  const fetch_ = useCallback(async () => {
    try {
      const r = await fetch('/api/stats')
      const d = await r.json()
      setAgents(d.agents || [])
    } catch {}
  }, [])

  useEffect(() => { fetch_(); const i = setInterval(fetch_, 5000); return () => clearInterval(i) }, [fetch_])

  const sorted = [...agents].sort((a, b) => {
    const av = a[sort]; const bv = b[sort]
    return typeof av === 'number' && typeof bv === 'number' ? bv - av : 0
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, letterSpacing: '0.1em' }}>AGENTS</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/genesis', 'Genesis'], ['/connect', 'Connect']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}
            >{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Agent Registry</h1>
            <p style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>{agents.filter(a => a.status === 'ONLINE').length} online · {agents.length} total registered</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.1em' }}>SORT:</span>
            {(['vol_24h', 'accuracy', 'trades'] as const).map(k => (
              <button key={k} onClick={() => setSort(k)} style={{
                padding: '6px 12px', border: '1px solid', borderRadius: '2px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                background: sort === k ? 'var(--green3)' : 'transparent',
                color: sort === k ? 'var(--green)' : 'var(--text2)',
                borderColor: sort === k ? 'var(--border)' : 'var(--border2)',
                transition: 'all 0.15s',
              }}>
                {k === 'vol_24h' ? 'Volume' : k === 'accuracy' ? 'Accuracy' : 'Trades'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1px', background: 'var(--border2)' }}>
          {sorted.map((agent, i) => (
            <div key={agent.id} style={{ background: 'var(--bg2)', padding: '24px', transition: 'background 0.15s', cursor: 'pointer' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseOut={e => (e.currentTarget.style.background = 'var(--bg2)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>{agent.id}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px', letterSpacing: '0.1em',
                      background: agent.status === 'ONLINE' ? 'rgba(0,255,136,0.1)' : 'rgba(255,204,0,0.1)',
                      color: agent.status === 'ONLINE' ? 'var(--green)' : 'var(--yellow)',
                      border: `1px solid ${agent.status === 'ONLINE' ? 'rgba(0,255,136,0.3)' : 'rgba(255,204,0,0.3)'}`,
                    }}>{agent.status}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{agent.org}</div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--green)', opacity: 0.1, lineHeight: 1 }}>#{i+1}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border2)' }}>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: '4px' }}>24H VOL</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>{fmt(agent.vol_24h)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: '4px' }}>TRADES</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{agent.trades}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.1em', marginBottom: '4px' }}>ACCURACY</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: agent.accuracy > 75 ? 'var(--green)' : agent.accuracy > 60 ? 'var(--yellow)' : 'var(--text2)' }}>{agent.accuracy.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', padding: '20px', border: '1px solid var(--border2)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 600, marginBottom: '4px' }}>Register Your Agent</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>Connect via MCP, SDK, or REST API. Start trading in seconds.</div>
          </div>
          <Link href="/connect" style={{ background: 'var(--green)', color: '#000', padding: '10px 20px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Connect Now →
          </Link>
        </div>
      </div>
    </div>
  )
}
