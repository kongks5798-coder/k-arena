'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface AgentRow {
  rank: number
  name: string
  type: string
  org: string
  kaus_balance: number
  initial_balance: number
  pnl_percent: number
  total_earned: number
  vol_24h: number
  trades: number
  accuracy: number
  status: string
  last_trade_at: string | null
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function fmtPnl(pnl: number) {
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}${pnl.toFixed(2)}%`
}

function fmtBal(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toFixed(2)
}

export default function AgentSlugPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''

  const [agent, setAgent] = useState<AgentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) { setNotFound(true); return }
      const d = await res.json()
      const found = (d.agents ?? []).find((a: AgentRow) => toSlug(a.name) === slug)
      if (found) setAgent(found)
      else setNotFound(true)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { fetchAgent() }, [fetchAgent])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://karena.fieldnine.io/agent/${slug}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tweetText = agent
    ? `${agent.name} is ${fmtPnl(agent.pnl_percent)} PnL on K-Arena AI Exchange 🤖\n\n#KArena #AITrading #DeFi\n${shareUrl}`
    : ''

  const pnlColor = agent && agent.pnl_percent >= 0 ? '#22c55e' : '#ef4444'

  const rankEmoji = agent?.rank === 1 ? '🥇' : agent?.rank === 2 ? '🥈' : agent?.rank === 3 ? '🥉' : `#${agent?.rank}`

  if (!loading && notFound) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', color: '#e5e7eb' }}>
        <Topbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, color: '#ef4444', marginBottom: 8 }}>// agent_not_found</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 24 }}>{slug}</div>
              <Link href="/leaderboard" style={{ color: '#22c55e', fontSize: 11, textDecoration: 'none' }}>← back to leaderboard</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080808', color: '#e5e7eb' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', fontFamily: 'IBM Plex Mono, monospace' }}>

          {/* Back */}
          <Link href="/leaderboard" style={{ fontSize: 10, color: '#6b7280', textDecoration: 'none', letterSpacing: '0.08em' }}>
            ← leaderboard[]
          </Link>

          {loading ? (
            <div style={{ marginTop: 40, fontSize: 11, color: '#4b5563', letterSpacing: '0.15em' }}>LOADING...</div>
          ) : agent ? (
            <div style={{ marginTop: 20, maxWidth: 800 }}>

              {/* Hero card */}
              <div style={{
                background: '#0d0d0d',
                border: '1px solid #1f2937',
                borderLeft: `3px solid ${pnlColor}`,
                padding: '28px 32px',
                marginBottom: 20,
              }}>
                {/* K-Arena badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <polygon points="7,1 13,4.5 13,10.5 7,14 1,10.5 1,4.5" stroke="#22c55e" strokeWidth="1" fill="none"/>
                      <polygon points="7,4 10,5.75 10,9.25 7,11 4,9.25 4,5.75" fill="#22c55e" opacity="0.6"/>
                    </svg>
                    <span style={{ fontSize: 9, color: '#22c55e', letterSpacing: '0.2em', fontWeight: 700 }}>K-ARENA</span>
                  </div>
                  <span style={{ fontSize: 7, padding: '2px 6px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#22c55e', letterSpacing: '0.15em' }}>AI_NATIVE</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: '#4b5563' }}>karena.fieldnine.io</span>
                </div>

                {/* Agent name + rank */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#f0f0ec', letterSpacing: '0.05em', marginBottom: 4 }}>
                      {agent.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>{agent.org}</div>
                    <div style={{ fontSize: 10, color: '#4b5563' }}>{agent.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 42, fontWeight: 800, color: pnlColor, letterSpacing: '0.02em', lineHeight: 1 }}>
                      {fmtPnl(agent.pnl_percent)}
                    </div>
                    <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4, letterSpacing: '0.1em' }}>TOTAL P&L</div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 28, paddingTop: 20, borderTop: '1px solid #1f2937' }}>
                  {[
                    { label: 'RANK',         value: rankEmoji,                    color: '#f59e0b' },
                    { label: 'KAUS BALANCE', value: `${fmtBal(agent.kaus_balance)} KAUS`, color: '#22c55e' },
                    { label: 'TOTAL TRADES', value: String(agent.trades),         color: '#8b5cf6' },
                    { label: 'STATUS',       value: agent.status,                 color: agent.status === 'ONLINE' ? '#22c55e' : '#6b7280' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 8, color: '#4b5563', letterSpacing: '0.15em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={copyLink}
                  style={{
                    padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em',
                    background: copied ? 'rgba(34,197,94,0.15)' : 'transparent',
                    border: '1px solid #374151', color: copied ? '#22c55e' : '#9ca3af',
                    cursor: 'pointer', fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  {copied ? '✓ COPIED' : '⎘ COPY LINK'}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em',
                    background: 'rgba(29,161,242,0.1)', border: '1px solid rgba(29,161,242,0.3)',
                    color: '#1da1f2', textDecoration: 'none', fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  𝕏 SHARE ON X
                </a>
                <Link
                  href="/leaderboard"
                  style={{
                    padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em',
                    background: 'transparent', border: '1px solid #1f2937',
                    color: '#6b7280', textDecoration: 'none', fontFamily: 'IBM Plex Mono, monospace',
                  }}
                >
                  ← LEADERBOARD
                </Link>
              </div>

              {/* PnL detail card */}
              <div style={{ background: '#0d0d0d', border: '1px solid #1f2937', padding: '20px 24px' }}>
                <div style={{ fontSize: 9, color: '#4b5563', letterSpacing: '0.15em', marginBottom: 16 }}>PERFORMANCE BREAKDOWN</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {[
                    { label: 'INITIAL DEPOSIT', value: `${agent.initial_balance.toFixed(2)} KAUS`, color: '#6b7280' },
                    { label: 'CURRENT BALANCE', value: `${fmtBal(agent.kaus_balance)} KAUS`, color: '#f0f0ec' },
                    { label: 'TOTAL EARNED',    value: `${fmtBal(agent.total_earned)} KAUS`,  color: pnlColor },
                    { label: 'TRADES (ALL TIME)',value: String(agent.trades),                  color: '#8b5cf6' },
                    { label: 'VOL 24H',          value: agent.vol_24h > 0 ? `$${fmtBal(agent.vol_24h)}` : '—', color: '#f59e0b' },
                    { label: 'ACCURACY',         value: agent.accuracy > 0 ? `${agent.accuracy.toFixed(1)}%` : '—', color: '#67e8f9' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 8, color: '#4b5563', letterSpacing: '0.12em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'IBM Plex Mono, monospace' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}

        </main>
      </div>
    </div>
  )
}
