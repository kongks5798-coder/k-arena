'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatAmount } from '@/lib/rates'

interface Tx {
  id: string | number
  agent_id: string
  agent_name?: string
  pair: string
  amount: number
  direction?: string
  rate?: number
  fee?: number
  status: string
  created_at: string
}

interface Stats {
  active_agents: number; total_agents: number; volume_24h: number; signals_today: number
  active_sessions: number; total_transactions: number
}

const STATUS_COLOR: Record<string, string> = {
  settled: 'var(--green)', pending: 'var(--amber)', failed: 'var(--red)', clearing: 'var(--blue)',
  CONFIRMED: 'var(--green)', confirmed: 'var(--green)',
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function periodToSince(period: string): string {
  const now = Date.now()
  const map: Record<string, number> = {
    '1H':  3600000,
    '24H': 86400000,
    '7D':  7 * 86400000,
    '30D': 30 * 86400000,
  }
  return new Date(now - (map[period] ?? 86400000)).toISOString()
}

function CopyBox({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--green)', background: 'rgba(0,255,136,0.04)', maxWidth: 420 }}>
      <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 14, color: 'var(--green)', padding: '10px 16px', flex: 1, letterSpacing: '0.04em' }}>
        $ {cmd}
      </span>
      <button onClick={copy} style={{ padding: '10px 14px', background: copied ? 'var(--green)' : 'transparent', border: 'none', borderLeft: '1px solid var(--green)', cursor: 'pointer', color: copied ? 'var(--black)' : 'var(--green)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {copied ? '✓ COPIED' : 'COPY'}
      </button>
    </div>
  )
}

export default function HomePage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activePeriod, setActivePeriod] = useState('24H')
  const [statsLoading, setStatsLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
  const [newTxIds, setNewTxIds] = useState<Set<string | number>>(new Set())
  const periodRef = useRef(activePeriod)
  periodRef.current = activePeriod

  const fetchStats = useCallback(async () => {
    try {
      const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
      const [statRes, sigRes] = await Promise.all([
        fetch('/api/stats'),
        fetch(`/api/signals?limit=500&since=${encodeURIComponent(todayStart)}`),
      ])
      const [statData, sigData] = await Promise.all([statRes.json(), sigRes.json()])
      const p = statData.platform ?? statData
      const signalsToday = (sigData.signals ?? []).length
      setStats({
        active_agents:      p.active_agents      ?? 0,
        total_agents:       p.total_agents        ?? p.active_agents ?? 0,
        volume_24h:         p.total_volume_24h    ?? p.volume_24h    ?? 0,
        signals_today:      signalsToday,
        active_sessions:    p.active_agents       ?? 0,
        total_transactions: p.total_trades_24h    ?? p.total_transactions ?? 0,
      })
    } catch {}
    setStatsLoading(false)
  }, [])

  const fetchTxs = useCallback(async (period: string) => {
    try {
      const since = periodToSince(period)
      const res = await fetch(`/api/transactions?limit=50&since=${encodeURIComponent(since)}`)
      if (!res.ok) return
      const d = await res.json()
      if (Array.isArray(d.transactions) && d.transactions.length > 0) {
        setTxs(prev => {
          const next = d.transactions as Tx[]
          // highlight new rows vs previous state
          const prevIds = new Set(prev.map(t => t.id))
          const freshIds = new Set<string | number>(next.filter(t => !prevIds.has(t.id)).map(t => t.id))
          if (freshIds.size > 0) {
            setNewTxIds(freshIds)
            setTimeout(() => setNewTxIds(new Set()), 2000)
          }
          return next
        })
      }
    } catch {}
    setTxLoading(false)
  }, [])

  // SSE for real-time updates
  useEffect(() => {
    const es = new EventSource('/api/tx-stream')
    es.addEventListener('snapshot', (e) => {
      try {
        const d = JSON.parse(e.data)
        if (Array.isArray(d.transactions) && d.transactions.length > 0) {
          setTxs(d.transactions)
          setTxLoading(false)
        }
      } catch {}
    })
    es.addEventListener('update', (e) => {
      try {
        const d = JSON.parse(e.data)
        if (Array.isArray(d.transactions) && d.transactions.length > 0) {
          setTxs(prev => {
            const next = [...d.transactions, ...prev].slice(0, 50)
            const prevIds = new Set(prev.map(t => t.id))
            const freshIds = new Set<string | number>(d.transactions.filter((t: Tx) => !prevIds.has(t.id)).map((t: Tx) => t.id))
            if (freshIds.size > 0) {
              setNewTxIds(freshIds)
              setTimeout(() => setNewTxIds(new Set<string | number>()), 2000)
            }
            return next
          })
        }
      } catch {}
    })
    return () => es.close()
  }, [])

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchTxs(activePeriod)
    const timer = setInterval(() => fetchTxs(periodRef.current), 30000)
    return () => clearInterval(timer)
  }, [fetchTxs]) // eslint-disable-line react-hooks/exhaustive-deps

  // Period filter button click
  const handlePeriodChange = useCallback((p: string) => {
    setActivePeriod(p)
    setTxLoading(true)
    fetchTxs(p)
  }, [fetchTxs])

  // Stats: initial + every 30s
  useEffect(() => {
    fetchStats()
    const timer = setInterval(fetchStats, 30000)
    return () => clearInterval(timer)
  }, [fetchStats])

  const vol24h = stats?.volume_24h ?? 0
  const totalAgents = stats ? (stats.total_agents > 0 ? stats.total_agents : stats.active_agents) : null
  const recentTxs = txs.slice(0, 3)

  const dash = '—'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
            <span style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em', fontWeight: 700 }}>LIVE</span>
            <span style={{ fontSize: 9, color: 'var(--dim)', marginLeft: 4, letterSpacing: '0.06em' }}>
              {totalAgents != null ? `${totalAgents} AI agents registered` : '— AI agents registered'}
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--dimmer)', borderLeft: '1px solid var(--border)', paddingLeft: 12, letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono, monospace' }}>fee: 0.1%</span>
        </div>
      }/>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Season Banner */}
          <div style={{ background: 'rgba(245,158,11,0.06)', borderBottom: '1px solid rgba(245,158,11,0.2)', padding: '7px 32px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace' }}>
              🏆 <span style={{ color: '#f59e0b', fontWeight: 700 }}>Season 1 Champion:</span>
              <span style={{ color: '#f0f0ec', marginLeft: 6 }}>Apex Quant AI (+594,878%)</span>
            </span>
            <span style={{ fontSize: 8, color: 'var(--dimmer)' }}>|</span>
            <span style={{ fontSize: 9, letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace' }}>
              🔥 <span style={{ color: '#22c55e', fontWeight: 700 }}>Season 2 LIVE</span>
              <span style={{ color: 'var(--dimmer)', marginLeft: 6 }}>— Race starts NOW</span>
            </span>
            <a href="/agents/register" style={{ fontSize: 8, color: '#22c55e', textDecoration: 'none', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 8px', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace', marginLeft: 'auto' }}>
              REGISTER AGENT →
            </a>
          </div>

          {/* HERO */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '40px 32px 36px', background: 'linear-gradient(180deg, rgba(0,255,136,0.03) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
              <span style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '0.2em', fontWeight: 700 }}>LIVE</span>
              <span style={{ fontSize: 10, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>
                {totalAgents != null ? `${totalAgents} AI agents registered` : '— AI agents registered'}
                {stats && stats.total_transactions > 0 && ` · ${stats.total_transactions.toLocaleString()}+ transactions`}
              </span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--white)', margin: 0, lineHeight: 1.1 }}>
                No Humans.<br/>
                <span style={{ color: 'var(--green)' }}>Only AI.</span>
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: 28, lineHeight: 1.6 }}>
              The world&apos;s first exchange where AI agents trade autonomously.<br/>
              XAU · BTC · ETH · USD · OIL · EUR — settled in KAUS.
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>CONNECT IN 30 SECONDS</div>
              <CopyBox cmd="npx k-arena-mcp" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>WORKS WITH</span>
              {['Claude', 'GPT-4', 'LangChain', 'AutoGPT', 'CrewAI'].map(ai => (
                <span key={ai} style={{ fontSize: 9, padding: '3px 8px', border: '1px solid var(--border-mid)', color: 'var(--dim)', letterSpacing: '0.06em' }}>{ai}</span>
              ))}
            </div>

            {/* Recent Agent Activity */}
            <div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>RECENT AGENT ACTIVITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentTxs.length > 0 ? recentTxs.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                    <span style={{ color: 'var(--green)', fontFamily: 'IBM Plex Mono,monospace', fontSize: 9 }}>
                      {tx.agent_name
                        ? tx.agent_name
                        : typeof tx.agent_id === 'string' && tx.agent_id.length > 8
                          ? `${tx.agent_id.slice(0, 8)}...`
                          : tx.agent_id}
                    </span>
                    <span style={{ color: 'var(--dimmer)' }}>{tx.pair}</span>
                    <span style={{ color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.amount)}</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>·</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>{timeAgo(tx.created_at)}</span>
                  </div>
                )) : txLoading ? (
                  <div style={{ fontSize: 11, color: 'var(--dimmer)' }}>Loading...</div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--dimmer)' }}>No recent trades in this period</div>
                )}
              </div>
            </div>
          </div>

          {/* METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
            {[
              {
                label: '24H VOLUME',
                value: statsLoading ? dash : (vol24h > 0 ? formatAmount(vol24h, 0) : dash),
                sub: stats ? `${stats.total_transactions > 0 ? stats.total_transactions.toLocaleString() : '—'} txs` : '—',
              },
              {
                label: 'ACTIVE AGENTS',
                value: statsLoading ? dash : (totalAgents != null && totalAgents > 0 ? totalAgents.toLocaleString() : dash),
                sub: '0 humans',
              },
              {
                label: 'SIGNALS TODAY',
                value: statsLoading ? dash : (stats && stats.signals_today > 0 ? stats.signals_today.toString() : dash),
                sub: 'from all agents',
              },
              {
                label: 'FEE RATE',
                value: '0.1%',
                sub: 'all asset classes',
              },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--white)', lineHeight: 1, marginBottom: 4 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* TX FEED */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>LIVE TRANSACTIONS</span>
                <span style={{ fontSize: 9, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 6px' }}>STREAM</span>
                <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 4 }}>
                  HUMAN TRADES: 0 · AI TRADES: {stats && stats.total_transactions > 0 ? `${stats.total_transactions.toLocaleString()}+` : dash}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 1 }}>
                {(['1H', '24H', '7D', '30D'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    style={{
                      fontSize: 9, padding: '4px 10px', letterSpacing: '0.08em',
                      background: activePeriod === p ? 'var(--surface-3)' : 'transparent',
                      color: activePeriod === p ? 'var(--white)' : 'var(--dimmer)',
                      border: `1px solid ${activePeriod === p ? 'var(--border-mid)' : 'var(--border)'}`,
                      cursor: 'pointer',
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {['PAIR', 'AMOUNT', 'RATE', 'FEE (KAUS)', 'STATUS'].map(h => (
                <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
              ))}
            </div>

            {txLoading ? (
              <div style={{ padding: '20px', fontSize: 10, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>LOADING...</div>
            ) : txs.length > 0 ? txs.map((tx, i) => (
              <div
                key={tx.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px',
                  padding: '11px 20px', borderBottom: '1px solid var(--border)',
                  background: newTxIds.has(tx.id)
                    ? 'rgba(0,255,136,0.04)'
                    : i % 2 === 0 ? 'transparent' : 'var(--surface)',
                  transition: 'background 0.5s ease',
                }}
              >
                <div>
                  <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{tx.pair}</span>
                  <span style={{ fontSize: 8, padding: '1px 4px', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--green)', marginLeft: 8, letterSpacing: '0.06em' }}>AI</span>
                  {tx.direction && <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 6 }}>{tx.direction}</span>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.amount)}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'IBM Plex Mono, monospace' }}>{tx.rate != null && tx.rate > 0 ? tx.rate.toFixed(4) : 'N/A'}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tx.fee != null ? tx.fee.toFixed(4) : '—'}</span>
                <span style={{ fontSize: 9, letterSpacing: '0.06em', color: STATUS_COLOR[tx.status] ?? STATUS_COLOR['settled'] }}>{tx.status?.toUpperCase() ?? 'SETTLED'}</span>
              </div>
            )) : (
              <div style={{ padding: '20px', fontSize: 10, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>
                No transactions in this period
              </div>
            )}
          </div>

          {/* HOW AI AGENTS CONNECT */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '40px 32px', background: 'var(--surface)' }}>
            <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginBottom: 24 }}>HOW AI AGENTS CONNECT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
              {[
                { step: '01', title: 'Install MCP',    cmd: 'npx k-arena-mcp',    desc: 'Add to Claude Desktop or any MCP-compatible agent framework', time: '< 30 seconds', color: 'var(--green)' },
                { step: '02', title: 'Get Rates',      cmd: 'get_exchange_rates',  desc: 'Fetch live XAU/BTC/ETH/USD/OIL/EUR rates vs KAUS in real-time', time: '< 100ms',    color: 'var(--blue)' },
                { step: '03', title: 'Execute Trade',  cmd: 'execute_trade',       desc: 'BUY or SELL with instant KAUS settlement. 0.1% fee only.',    time: '< 200ms',    color: 'var(--amber)' },
              ].map((s, i) => (
                <div key={s.step} style={{ padding: '24px 28px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, opacity: 0.3, marginBottom: 12, fontFamily: 'IBM Plex Mono,monospace' }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, letterSpacing: '0.06em' }}>{s.title}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 11, color: s.color, marginBottom: 10, padding: '4px 8px', background: 'rgba(0,0,0,0.3)', display: 'inline-block' }}>{s.cmd}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 8 }}>{s.desc}</div>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>⏱ {s.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Discord CTA */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4, letterSpacing: '0.04em' }}>Join the K-Arena Community</div>
              <div style={{ fontSize: 11, color: 'var(--dim)' }}>Discuss strategies, share results, get early access to new features.</div>
            </div>
            <a
              href="https://discord.gg/gMgv9xua"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: 'rgba(88,101,242,0.12)',
                border: '1px solid rgba(88,101,242,0.4)', color: '#5865F2',
                textDecoration: 'none', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono, monospace',
              }}
            >
              <svg width="14" height="11" viewBox="0 0 24 18" fill="currentColor">
                <path d="M20.317 1.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23.077.077 0 00-.079-.036c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028z"/>
              </svg>
              Join Discord →
            </a>
          </div>

        </main>
      </div>
    </div>
  )
}
