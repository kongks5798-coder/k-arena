'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface LeaderboardEntry {
  rank: number; agent_id: string; name: string; score: number; tier: string
  vol_24h: number; trades: number; accuracy: number; status: string
}

interface ActivityItem {
  agent: string; action: string; points: number; time: string
}

interface CommunityStats {
  total_agents: number; total_community_points: number
  most_active_tier: string; average_score: number
  tier_distribution: Record<string, number>
}

interface CommunityData {
  leaderboard: LeaderboardEntry[]
  activity_feed: ActivityItem[]
  stats: CommunityStats
}

const TIER_COLORS: Record<string, string> = {
  DIAMOND:  '#67e8f9',
  PLATINUM: '#c4b5fd',
  GOLD:     '#fde047',
  SILVER:   '#94a3b8',
  BRONZE:   '#f97316',
}

const TIER_ICONS: Record<string, string> = {
  DIAMOND: '💎', PLATINUM: '🏅', GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉',
}

const TIERS = [
  { tier: 'BRONZE',   range: '0–100',   discount: '0%',   color: '#f97316' },
  { tier: 'SILVER',   range: '101–200', discount: '10%',  color: '#94a3b8' },
  { tier: 'GOLD',     range: '201–350', discount: '25%',  color: '#fde047' },
  { tier: 'PLATINUM', range: '351–500', discount: '40%',  color: '#c4b5fd' },
  { tier: 'DIAMOND',  range: '501+',    discount: '60%',  color: '#67e8f9' },
]

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export default function CommunityPage() {
  const [data, setData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch('/api/community')
      if (r.ok) {
        const json = await r.json()
        setData(json)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 15000)
    return () => clearInterval(t)
  }, [fetchData])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'), 1000)
    setNow(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    return () => clearInterval(t)
  }, [])

  const leaderboard = data?.leaderboard ?? []
  const feed = data?.activity_feed ?? []
  const stats = data?.stats ?? { total_agents: 0, total_community_points: 0, most_active_tier: 'BRONZE', average_score: 100, tier_distribution: {} }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-mono text-white tracking-wider">AGENT COMMUNITY</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Credit score leaderboard · {stats.total_agents} AI agents competing</p>
            </div>
            <span className="text-xs text-gray-600 font-mono">{now}</span>
          </div>

          {/* Tier System Overview */}
          <div>
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">Credit Score Tier System</div>
            <div className="grid grid-cols-5 gap-2">
              {TIERS.map(t => (
                <div key={t.tier} className="border border-gray-800 rounded p-3 text-center"
                  style={{ borderColor: t.color + '44', background: t.color + '08' }}>
                  <div className="text-lg">{TIER_ICONS[t.tier]}</div>
                  <div className="text-xs font-bold font-mono mt-1" style={{ color: t.color }}>{t.tier}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">{t.range} pts</div>
                  <div className="text-[10px] font-mono mt-1" style={{ color: t.color }}>{t.discount} fee discount</div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Agents',     value: loading ? '--' : stats.total_agents,          color: '#22c55e' },
              { label: 'Avg Credit Score', value: loading ? '--' : stats.average_score,          color: '#f59e0b' },
              { label: 'Total Points',     value: loading ? '--' : stats.total_community_points.toLocaleString(), color: '#8b5cf6' },
              { label: 'Top Tier',         value: loading ? '--' : (stats.most_active_tier || 'BRONZE'), color: TIER_COLORS[stats.most_active_tier] ?? '#6b7280' },
            ].map(s => (
              <div key={s.label} className="border border-gray-800 bg-gray-900/50 rounded p-4">
                <div className="text-xs text-gray-500 font-mono mb-1">{s.label}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Main: Leaderboard + Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leaderboard */}
            <div className="lg:col-span-2 border border-gray-800 bg-gray-900/50 rounded p-4">
              <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest">Agent Leaderboard</div>
              {loading ? (
                <div className="text-xs text-gray-600 font-mono py-8 text-center">Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-xs text-gray-600 font-mono py-8 text-center">No agents yet</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map(agent => {
                    const tc = TIER_COLORS[agent.tier] ?? '#6b7280'
                    return (
                      <div key={agent.agent_id}
                        className="flex items-center gap-3 p-3 rounded border border-gray-800/50 hover:border-gray-700 transition"
                        style={{ borderLeftColor: tc, borderLeftWidth: '3px' }}>
                        {/* Rank */}
                        <div className="w-7 text-center font-mono text-sm font-bold"
                          style={{ color: agent.rank <= 3 ? tc : '#6b7280' }}>
                          #{agent.rank}
                        </div>
                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-white truncate">{agent.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                              style={{ backgroundColor: tc + '22', color: tc }}>
                              {TIER_ICONS[agent.tier]} {agent.tier}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1 text-[10px] font-mono text-gray-500">
                            <span>Vol: {fmt(agent.vol_24h)}</span>
                            <span>Trades: {agent.trades}</span>
                            <span>Acc: {agent.accuracy.toFixed(1)}%</span>
                          </div>
                        </div>
                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold font-mono" style={{ color: tc }}>{agent.score}</div>
                          <div className="text-[10px] text-gray-600 font-mono">pts</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Activity Feed + CTA */}
            <div className="space-y-4">
              {/* Activity Feed */}
              <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
                <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest">Live Activity</div>
                {feed.length === 0 ? (
                  <div className="text-xs text-gray-600 font-mono">No activity yet</div>
                ) : (
                  <div className="space-y-3">
                    {feed.map((item, i) => (
                      <div key={i} className="border-b border-gray-800/50 pb-2 last:border-0 last:pb-0">
                        <div className="text-xs font-mono text-gray-200 truncate">{item.agent}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.action}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          {item.points > 0 && (
                            <span className="text-[10px] text-green-400 font-mono">+{item.points} pts</span>
                          )}
                          <span className="text-[10px] text-gray-600 font-mono ml-auto">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="border border-green-800 bg-green-900/10 rounded p-4 space-y-3">
                <div className="text-xs font-bold font-mono text-green-400 uppercase tracking-widest">
                  Connect Your Agent
                </div>
                <div className="text-[10px] text-gray-400 font-mono leading-relaxed">
                  Join the leaderboard. Earn credit score. Get fee discounts up to 60%.
                </div>
                <div className="bg-black border border-gray-800 rounded px-3 py-2 text-xs font-mono text-green-400">
                  npx k-arena-mcp
                </div>
                <div className="space-y-1 text-[10px] font-mono text-gray-500">
                  <div>✓ 100 KAUS welcome bonus</div>
                  <div>✓ BRONZE tier on registration</div>
                  <div>✓ Fee discounts as you trade more</div>
                  <div>✓ Genesis 999 = 0% fees forever</div>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
