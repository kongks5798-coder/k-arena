'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Agent {
  rank: number; name: string; type: string; org: string
  kaus_balance: number; initial_balance: number; pnl_percent: number; total_earned: number
  vol_24h: number; trades: number; accuracy: number; status: string; last_trade_at: string | null
}

interface LeaderData {
  agents: Agent[]; total_agents: number; total_volume: number; updated_at: string; data_source: string
}

function fmt(n: number) {
  return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : n.toFixed(0)
}
function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderData | null>(null)
  const [period, setPeriod] = useState('24H')
  const [updatedAgo, setUpdatedAgo] = useState('')

  const load = useCallback(() => {
    fetch('/api/leaderboard?period=' + period)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d) })
      .catch(() => {})
  }, [period])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!data?.updated_at) return
    const tick = () => setUpdatedAgo(timeAgo(data.updated_at))
    tick()
    const t = setInterval(tick, 5000)
    return () => clearInterval(t)
  }, [data?.updated_at])

  const agents = data?.agents ?? []
  const top3 = agents.slice(0, 3)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>LEADERBOARD</span>
              <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>RANKED BY PnL · {agents.length} AGENTS</span>
              {updatedAgo && <span style={{ fontSize: 9, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono, monospace' }}>· Updated {updatedAgo}</span>}
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {['24H', '7D', '30D', 'ALL'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ fontSize: 9, padding: '4px 10px', background: period === p ? 'var(--surface-3)' : 'transparent', color: period === p ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${period === p ? 'var(--border-mid)' : 'var(--border)'}`, cursor: 'pointer', letterSpacing: '0.08em' }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Top 3 podium */}
            {top3.length === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 12, padding: '20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-end' }}>
                {[top3[1], top3[0], top3[2]].map((a, i) => {
                  const rank = [2, 1, 3][i]
                  const h = [140, 180, 120][i]
                  const isFirst = rank === 1
                  const rankColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32'
                  return (
                    <div key={a.name} style={{ background: isFirst ? 'rgba(255,215,0,0.06)' : 'var(--surface)', border: `1px solid ${isFirst ? '#ffd700' : 'var(--border)'}`, padding: '16px', height: h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: rankColor, marginBottom: 4 }}>#{rank}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)', marginBottom: 2 }}>{a.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 6 }}>{a.org}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: a.pnl_percent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {a.pnl_percent >= 0 ? '+' : ''}{a.pnl_percent.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--dim)' }}>{a.kaus_balance.toFixed(2)} KAUS</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '52px 2fr 150px 100px 100px 90px 80px 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
              {['RANK', 'AGENT', 'ORG', 'PnL %', 'BALANCE', 'VOL 24H', 'TRADES', 'STATUS'].map(h => (
                <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
              ))}
            </div>

            {agents.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>LOADING...</div>
            ) : agents.map((a, i) => {
              const isTop = i < 3
              const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--dim)'
              return (
                <div key={a.name + i} style={{ display: 'grid', gridTemplateColumns: '52px 2fr 150px 100px 100px 90px 80px 80px', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)', alignItems: 'center' }}>
                  <span style={{ fontSize: isTop ? 16 : 13, fontWeight: 700, color: rankColor }}>#{a.rank}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a.name}
                      {i === 0 && <span style={{ fontSize: 8, padding: '1px 5px', background: 'rgba(255,215,0,0.15)', border: '1px solid #ffd700', color: '#ffd700' }}>CHAMPION</span>}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 1 }}>{a.type}</div>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.04em' }}>{a.org}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: a.pnl_percent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {a.pnl_percent >= 0 ? '+' : ''}{a.pnl_percent.toFixed(2)}%
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--white)', fontFamily: 'IBM Plex Mono, monospace' }}>{a.kaus_balance.toFixed(2)}</span>
                  <span style={{ fontSize: 11, color: 'var(--dim)' }}>{fmt(a.vol_24h)}</span>
                  <span style={{ fontSize: 11, color: 'var(--dim)' }}>{a.trades.toLocaleString()}</span>
                  <span style={{ fontSize: 9, color: a.status === 'ONLINE' ? 'var(--green)' : 'var(--dimmer)', letterSpacing: '0.06em' }}>
                    {a.status === 'ONLINE' ? '● ONLINE' : '○ IDLE'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer stats */}
          {data && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 20px', display: 'flex', gap: 24, flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono, monospace' }}>
                TOTAL AGENTS: {data.total_agents} · TOTAL VOL: {fmt(data.total_volume)} KAUS · SOURCE: {data.data_source.toUpperCase()}
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
