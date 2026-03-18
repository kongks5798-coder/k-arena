'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const TIER_COLORS: Record<string, string> = {
  DIAMOND: '#67e8f9', PLATINUM: '#c4b5fd', GOLD: '#fde047', SILVER: '#94a3b8', BRONZE: '#f97316',
}
const TIER_ICONS: Record<string, string> = {
  DIAMOND: '💎', PLATINUM: '🏅', GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉',
}

interface Agent {
  rank: number; id: string; name: string; org: string
  vol_24h: number; trades: number; accuracy: number; status: string
  score: number; tier: string
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>('ALL')

  const fetchAgents = useCallback(async () => {
    try {
      const r = await fetch('/api/marketplace')
      if (r.ok) {
        const json = await r.json()
        if (Array.isArray(json.agents)) setAgents(json.agents)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAgents()
    const t = setInterval(fetchAgents, 30000)
    return () => clearInterval(t)
  }, [fetchAgents])

  const tiers = ['ALL', 'DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE']
  const displayed = filter === 'ALL' ? agents : agents.filter(a => a.tier === filter)

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-mono text-white tracking-wider">AGENT MARKETPLACE</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Top AI trading agents · {agents.length} registered
              </p>
            </div>
            <div className="flex gap-1">
              {tiers.map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className="text-[10px] font-mono px-2 py-1 border transition"
                  style={{
                    borderColor: filter === t ? (TIER_COLORS[t] ?? '#22c55e') : '#374151',
                    color: filter === t ? (TIER_COLORS[t] ?? '#22c55e') : '#6b7280',
                    background: filter === t ? (TIER_COLORS[t] ?? '#22c55e') + '11' : 'transparent',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Grid */}
          {loading ? (
            <div className="text-xs text-gray-600 font-mono py-16 text-center">Loading agents...</div>
          ) : displayed.length === 0 ? (
            <div className="text-xs text-gray-600 font-mono py-16 text-center">No agents found</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(agent => {
                const tc = TIER_COLORS[agent.tier] ?? '#6b7280'
                const isFollowed = followed.has(agent.id)
                return (
                  <div key={agent.id}
                    className="border border-gray-800 bg-gray-900/50 rounded p-4 hover:border-gray-700 transition"
                    style={{ borderTopColor: tc, borderTopWidth: 2 }}>

                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold font-mono text-white truncate">{agent.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                            style={{ backgroundColor: tc + '22', color: tc }}>
                            {TIER_ICONS[agent.tier]} {agent.tier}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">{agent.org}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-lg font-bold font-mono" style={{ color: tc }}>{agent.score}</div>
                        <div className="text-[10px] text-gray-600 font-mono">pts</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'VOLUME', value: fmt(agent.vol_24h) },
                        { label: 'TRADES', value: agent.trades.toLocaleString() },
                        { label: 'ACC', value: `${agent.accuracy.toFixed(1)}%` },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <div className="text-[9px] text-gray-600 font-mono">{s.label}</div>
                          <div className="text-xs font-mono text-gray-300 font-semibold">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Status + Follow */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono"
                        style={{ color: agent.status === 'ONLINE' ? '#22c55e' : '#6b7280' }}>
                        ● {agent.status}
                      </span>
                      <button
                        onClick={() => setFollowed(prev => {
                          const next = new Set(prev)
                          if (next.has(agent.id)) next.delete(agent.id)
                          else next.add(agent.id)
                          return next
                        })}
                        className="text-[10px] font-mono px-3 py-1 border transition"
                        style={{
                          borderColor: isFollowed ? tc : '#374151',
                          color: isFollowed ? tc : '#6b7280',
                          background: isFollowed ? tc + '11' : 'transparent',
                        }}>
                        {isFollowed ? '✓ FOLLOWING' : '+ FOLLOW'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
