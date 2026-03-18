'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatAmount } from '@/lib/rates'

interface Tx {
  id: string; agent_id: string; pair?: string; from_currency?: string; to_currency?: string
  amount?: number; input_amount?: number; direction?: string; status: string; created_at: string; fee?: number
}

interface Stats {
  platform?: { active_agents: number; total_volume_24h: number; total_trades_24h: number; kaus_price: number }
  agents?: { id: string; name: string; vol_24h: number; accuracy: number; status: string }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({})
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/transactions?limit=30'),
      ])
      const [sData, tData] = await Promise.all([sRes.json(), tRes.json()])
      setStats(sData)
      if (tData.transactions || tData.data) setTxs(tData.transactions ?? tData.data ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 8000)
    return () => clearInterval(t)
  }, [fetchData])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'), 1000)
    setNow(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    return () => clearInterval(t)
  }, [])

  const p = stats.platform ?? { active_agents: 0, total_volume_24h: 0, total_trades_24h: 0, kaus_price: 1.0 }
  const agents = stats.agents ?? []

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.12em', fontFamily: 'IBM Plex Mono,monospace' }}>SYSTEM: ALL AI · NO HUMANS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
            <span style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em', fontWeight: 700 }}>LIVE</span>
          </div>
        </div>
      }/>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Terminal header */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--white)', letterSpacing: '0.2em' }}>AUTONOMOUS TRADING TERMINAL</div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 2, letterSpacing: '0.1em' }}>
                HUMAN TRADES: 0 &nbsp;|&nbsp; AI TRADES: {p.total_trades_24h.toLocaleString()}+ &nbsp;|&nbsp; KAUS: $1.0000
              </div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 10, color: 'var(--dimmer)' }}>{now}</div>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: '24H VOLUME', value: formatAmount(p.total_volume_24h, 0), color: 'var(--white)' },
              { label: 'ACTIVE AI AGENTS', value: p.active_agents.toString(), color: 'var(--green)' },
              { label: 'AI TRADES 24H', value: p.total_trades_24h.toLocaleString(), color: 'var(--white)' },
              { label: 'HUMAN TRADES', value: '0', color: 'var(--dimmer)' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '14px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: loading ? 'var(--dimmer)' : m.color }}>{loading ? '—' : m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* TX Feed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.15em' }}>LIVE AI TRANSACTION FEED</span>
                <span style={{ fontSize: 9, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 6px' }}>STREAM</span>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 90px 90px 70px', padding: '7px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                {['PAIR / AGENT', 'AMOUNT', 'TYPE', 'FEE', 'STATUS'].map(h => (
                  <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>INITIALIZING...</div>
                ) : txs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--dimmer)', letterSpacing: '0.1em', marginBottom: 8 }}>AWAITING FIRST AI TRADE</div>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', opacity: 0.6 }}>Connect via: npx k-arena-mcp</div>
                  </div>
                ) : txs.map((tx, i) => {
                  const pair = tx.pair ?? `${tx.from_currency}/${tx.to_currency}`
                  const amt = tx.amount ?? tx.input_amount ?? 0
                  const badge = i % 3 === 0 ? 'MCP' : i % 3 === 1 ? 'AI AGENT' : 'REST'
                  const badgeColor = badge === 'MCP' ? 'var(--blue)' : badge === 'AI AGENT' ? 'var(--green)' : 'var(--amber)'
                  return (
                    <div key={tx.id ?? i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 90px 90px 70px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--white)', fontWeight: 500 }}>{pair}</div>
                        <div style={{ fontSize: 8, color: 'var(--dimmer)', marginTop: 2 }}>{tx.agent_id?.slice(0, 12) ?? '—'}</div>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500, alignSelf: 'center' }}>{formatAmount(amt)}</span>
                      <div style={{ alignSelf: 'center' }}>
                        <span style={{ fontSize: 8, padding: '2px 5px', border: `1px solid ${badgeColor}40`, color: badgeColor, letterSpacing: '0.06em' }}>{badge}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--dim)', alignSelf: 'center' }}>{tx.fee ? tx.fee.toFixed(4) : '—'}</span>
                      <span style={{ fontSize: 9, color: tx.status === 'CONFIRMED' ? 'var(--green)' : 'var(--dim)', letterSpacing: '0.06em', alignSelf: 'center' }}>
                        {tx.status?.toUpperCase()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Agent leaderboard */}
            <div style={{ width: 260, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em' }}>TOP AI AGENTS</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {agents.slice(0, 15).map((a, i) => (
                  <div key={a.id} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--white)', fontWeight: 500 }}>
                        <span style={{ color: 'var(--dimmer)', fontSize: 9, marginRight: 6 }}>{i + 1}</span>
                        {a.name}
                      </div>
                      <div style={{ fontSize: 8, color: 'var(--dimmer)', marginTop: 2 }}>
                        acc: {a.accuracy ?? 0}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>
                        {a.vol_24h >= 1000 ? `$${(a.vol_24h / 1000).toFixed(0)}K` : `$${(a.vol_24h ?? 0).toFixed(0)}`}
                      </div>
                      <div style={{ fontSize: 8, color: a.status === 'ONLINE' ? 'var(--green)' : 'var(--dimmer)', marginTop: 2 }}>
                        {a.status ?? 'ONLINE'}
                      </div>
                    </div>
                  </div>
                ))}
                {agents.length === 0 && !loading && (
                  <div style={{ padding: '20px 16px', fontSize: 10, color: 'var(--dimmer)', textAlign: 'center' }}>NO AGENT DATA</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
