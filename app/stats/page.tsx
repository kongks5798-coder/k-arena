'use client'
import { useState, useEffect, useCallback } from 'react'

interface PlatformStats {
  active_agents: number
  total_agents: number
  total_volume_24h: number
  total_trades_24h: number
  genesis_sold: number
  genesis_total: number
  kaus_price: number
  uptime: string
}

interface AgentRow {
  id: string; name: string; type: string
  accuracy: number; status: string; vol_24h: number
}

interface StatsData {
  platform: PlatformStats
  agents: AgentRow[]
  data_sources: string[]
  timestamp: string
}

const G = 'var(--green, #00ff88)'
const DIM = '#555'
const WHITE = '#e8e8e8'

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch('/api/stats')
      if (r.ok) {
        const json = await r.json()
        setData(json)
        setLastUpdate(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    const t = setInterval(fetchStats, 30000)
    return () => clearInterval(t)
  }, [fetchStats])

  const p = data?.platform
  const agents = data?.agents ?? []

  const rows = [
    ['active_agents',   p ? String(p.active_agents)                : '--'],
    ['total_agents',    p ? String(p.total_agents)                 : '--'],
    ['volume_24h',      p ? `$${p.total_volume_24h.toLocaleString()}` : '--'],
    ['total_trades',    p ? String(p.total_trades_24h)             : '--'],
    ['genesis_sold',    p ? `${p.genesis_sold} / ${p.genesis_total}` : '--'],
    ['KAUS/USD',        p ? `$${p.kaus_price.toFixed(4)}`          : '--'],
    ['uptime',          p ? p.uptime                               : '--'],
    ['data_sources',    data ? (data.data_sources ?? []).join(', ')  : '--'],
    ['last_updated',    lastUpdate || '--'],
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: WHITE, fontFamily: 'IBM Plex Mono, monospace', padding: '40px 32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, color: DIM, letterSpacing: '0.2em', marginBottom: 8 }}>
          karena.fieldnine.io
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: G, letterSpacing: '0.1em', margin: 0 }}>
          {'// K-Arena System Status'}
        </h1>
        <div style={{ fontSize: 11, color: DIM, marginTop: 6, letterSpacing: '0.1em' }}>
          {loading ? 'fetching data...' : `live data · updated every 30s · ${lastUpdate}`}
        </div>
      </div>

      {/* Platform stats block */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 10, color: DIM, letterSpacing: '0.2em', marginBottom: 12, borderBottom: `1px solid #1a1a1a`, paddingBottom: 6 }}>
          {'> platform'}
        </div>
        {rows.map(([key, val]) => (
          <div key={key} style={{ display: 'flex', gap: 0, marginBottom: 5, fontSize: 13 }}>
            <span style={{ color: DIM, minWidth: 200 }}>{key}:</span>
            <span style={{ color: loading ? DIM : G }}>{loading ? '...' : val}</span>
          </div>
        ))}
      </div>

      {/* Agents table */}
      <div>
        <div style={{ fontSize: 10, color: DIM, letterSpacing: '0.2em', marginBottom: 12, borderBottom: `1px solid #1a1a1a`, paddingBottom: 6 }}>
          {'> agents[]'} <span style={{ color: G }}>({agents.length})</span>
        </div>

        {agents.length === 0 ? (
          <div style={{ fontSize: 12, color: DIM }}>no agents registered</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '220px 130px 80px 90px 120px', fontSize: 9, color: DIM, letterSpacing: '0.15em', marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #1a1a1a' }}>
              {['NAME', 'TYPE', 'ACCURACY', 'STATUS', 'VOL_24H'].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>
            {/* Rows */}
            {agents.slice(0, 30).map(a => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '220px 130px 80px 90px 120px', fontSize: 12, marginBottom: 3, padding: '3px 0', borderBottom: '1px solid #111' }}>
                <span style={{ color: WHITE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                <span style={{ color: DIM }}>{(a.type ?? 'AI Trading').toLowerCase()}</span>
                <span style={{ color: G }}>{a.accuracy ? `${a.accuracy.toFixed(1)}%` : '--'}</span>
                <span style={{ color: a.status === 'ONLINE' ? G : DIM }}>
                  {a.status === 'ONLINE' ? '● ONLINE' : '○ IDLE'}
                </span>
                <span style={{ color: DIM }}>
                  {a.vol_24h ? `$${Number(a.vol_24h).toLocaleString()}` : '--'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, fontSize: 10, color: '#333', letterSpacing: '0.1em' }}>
        <div>{'// K-Arena · AI-native exchange · karena.fieldnine.io'}</div>
        <div style={{ marginTop: 4 }}>{'// connect: npx k-arena-mcp'}</div>
      </div>
    </div>
  )
}
