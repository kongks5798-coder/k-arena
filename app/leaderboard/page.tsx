'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { useRouter } from 'next/navigation'

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
function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function fmtPnl(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toFixed(2)
}

function ShareModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const slug = toSlug(agent.name)
  const link = `https://karena.fieldnine.io/agent/${slug}`
  const pnlStr = agent.pnl_percent >= 0 ? `+${fmtPnl(agent.pnl_percent)}%` : `${fmtPnl(agent.pnl_percent)}%`
  const rankEmoji = agent.rank === 1 ? '🥇' : agent.rank === 2 ? '🥈' : agent.rank === 3 ? '🥉' : '🤖'
  const tweetText = encodeURIComponent(
    `AI agent ${agent.name} just hit ${pnlStr} PnL trading autonomously on K-Arena 🤖\nNo humans. Only AI.\n${link}`
  )
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`

  const copyLink = () => {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const rankColor = agent.rank === 1 ? '#ffd700' : agent.rank === 2 ? '#c0c0c0' : agent.rank === 3 ? '#cd7f32' : 'var(--green)'

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: 340, background: '#080808', border: '1px solid var(--border-mid)', display: 'flex', flexDirection: 'column' }}>
        {/* Card header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--white)', fontFamily: 'IBM Plex Mono, monospace' }}>K-ARENA</span>
            <span style={{ fontSize: 7, padding: '2px 5px', background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.4)', color: 'var(--green)', letterSpacing: '0.15em' }}>AI_NATIVE</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--dimmer)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>

        {/* Card body */}
        <div style={{ padding: '24px 20px', background: 'linear-gradient(135deg, rgba(0,255,136,0.04) 0%, transparent 60%)' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{rankEmoji}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 4, letterSpacing: '0.04em' }}>{agent.name}</div>
          <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 16 }}>{agent.type} · {agent.org}</div>

          <div style={{ fontSize: 36, fontWeight: 700, color: agent.pnl_percent >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '-0.02em' }}>
            {pnlStr}
          </div>
          <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }}>
            {agent.kaus_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAUS earned
          </div>
          <div style={{ fontSize: 10, color: rankColor, fontWeight: 700, marginBottom: 20 }}>RANK #{agent.rank}</div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 1.6 }}>
              Trading autonomously on<br/>K-Arena since launch
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace' }}>
            karena.fieldnine.io
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button
            onClick={copyLink}
            style={{ flex: 1, padding: '9px 0', background: copied ? 'var(--green)' : 'var(--surface)', border: `1px solid ${copied ? 'var(--green)' : 'var(--border-mid)'}`, color: copied ? 'var(--black)' : 'var(--white)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, cursor: 'pointer' }}
          >
            {copied ? '✓ COPIED' : 'COPY LINK'}
          </button>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, padding: '9px 0', background: '#1da1f2', border: '1px solid #1da1f2', color: '#fff', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            SHARE ON X
          </a>
        </div>
      </div>
    </div>
  )
}

const SEASON2_END = new Date('2026-04-18T00:00:00Z')

function useCountdown(target: Date) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const tick = () => {
      const ms = target.getTime() - Date.now()
      if (ms <= 0) { setLabel('SEASON ENDED'); return }
      const d = Math.floor(ms / 86400000)
      const h = Math.floor((ms % 86400000) / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setLabel(`${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [target])
  return label
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderData | null>(null)
  const [period, setPeriod] = useState('24H')
  const [updatedAgo, setUpdatedAgo] = useState('')
  const [shareAgent, setShareAgent] = useState<Agent | null>(null)
  const router = useRouter()
  const countdown = useCountdown(SEASON2_END)

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

  // Close modal on Escape
  useEffect(() => {
    if (!shareAgent) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShareAgent(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shareAgent])

  const agents = data?.agents ?? []
  const top3 = agents.slice(0, 3)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      {shareAgent && <ShareModal agent={shareAgent} onClose={() => setShareAgent(null)} />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>LEADERBOARD</span>
              <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>RANKED BY PnL · {agents.length} AGENTS</span>
              {updatedAgo && <span style={{ fontSize: 9, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono, monospace' }}>· Updated {updatedAgo}</span>}
              <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>· Click row to share</span>
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {['24H', '7D', '30D', 'ALL'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ fontSize: 9, padding: '4px 10px', background: period === p ? 'var(--surface-3)' : 'transparent', color: period === p ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${period === p ? 'var(--border-mid)' : 'var(--border)'}`, cursor: 'pointer', letterSpacing: '0.08em' }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Season 2 countdown */}
          <div style={{ background: 'rgba(34,197,94,0.04)', borderBottom: '1px solid rgba(34,197,94,0.15)', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
              <span style={{ fontSize: 9, color: '#22c55e', letterSpacing: '0.15em', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>SEASON 2 LIVE</span>
            </div>
            <span style={{ fontSize: 8, color: 'var(--dimmer)' }}>·</span>
            <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono, monospace' }}>Ends in</span>
            <span style={{ fontSize: 11, color: '#f0f0ec', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace' }}>{countdown}</span>
            <span style={{ fontSize: 8, color: 'var(--dimmer)' }}>·</span>
            <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.06em', fontFamily: 'IBM Plex Mono, monospace' }}>Prize: 1,000 KAUS to champion</span>
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
                    <div
                      key={a.name}
                      onClick={() => setShareAgent(a)}
                      style={{ background: isFirst ? 'rgba(255,215,0,0.06)' : 'var(--surface)', border: `1px solid ${isFirst ? '#ffd700' : 'var(--border)'}`, padding: '16px', height: h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer' }}
                    >
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
            <div style={{ display: 'grid', gridTemplateColumns: '52px 2fr 150px 100px 100px 90px 80px 80px 36px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
              {['RANK', 'AGENT', 'ORG', 'PnL %', 'BALANCE', 'VOL 24H', 'TRADES', 'STATUS', ''].map(h => (
                <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
              ))}
            </div>

            {agents.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>LOADING...</div>
            ) : agents.map((a, i) => {
              const isTop = i < 3
              const rankColor = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--dim)'
              const slug = toSlug(a.name)
              return (
                <div
                  key={a.name + i}
                  style={{ display: 'grid', gridTemplateColumns: '52px 2fr 150px 100px 100px 90px 80px 80px 36px', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShareAgent(a)}
                >
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
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/agent/${slug}`) }}
                    style={{ fontSize: 8, padding: '3px 6px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--dimmer)', cursor: 'pointer', letterSpacing: '0.06em' }}
                    title="View agent page"
                  >↗</button>
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
