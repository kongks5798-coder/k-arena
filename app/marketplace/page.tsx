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

interface Strategy {
  id: string; agent_id: string; agent_name: string
  strategy_name: string; description: string
  price_kaus_monthly: number; strategy_type: string
  subscribers: number; created_at: string
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

const TYPE_COLORS: Record<string, string> = {
  arbitrage: '#f59e0b', momentum: '#22c55e', mean_reversion: '#60a5fa',
  sentiment: '#a78bfa', ml_based: '#f472b6', scalper: '#fb923c', custom: '#6b7280',
}

export default function MarketplacePage() {
  const [tab, setTab] = useState<'agents' | 'strategies'>('agents')

  // Agent tab state
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>('ALL')

  // Strategy tab state
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [stratLoading, setStratLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [subResult, setSubResult] = useState<Record<string, string>>({})
  const [listForm, setListForm] = useState({ agent_id: '', strategy_name: '', description: '', price_kaus_monthly: '10', strategy_type: 'custom' })
  const [listing, setListing] = useState(false)
  const [listResult, setListResult] = useState<string | null>(null)
  const [subBuyerId, setSubBuyerId] = useState('')

  const fetchAgents = useCallback(async () => {
    try {
      const r = await fetch('/api/marketplace')
      if (r.ok) {
        const json = await r.json()
        if (Array.isArray(json.agents)) setAgents(json.agents)
      }
    } catch {}
    setAgentsLoading(false)
  }, [])

  const fetchStrategies = useCallback(async () => {
    try {
      const url = typeFilter !== 'ALL' ? `/api/marketplace/browse?type=${typeFilter}` : '/api/marketplace/browse'
      const r = await fetch(url)
      if (r.ok) {
        const json = await r.json()
        if (Array.isArray(json.listings)) setStrategies(json.listings)
      }
    } catch {}
    setStratLoading(false)
  }, [typeFilter])

  useEffect(() => { fetchAgents(); const t = setInterval(fetchAgents, 30000); return () => clearInterval(t) }, [fetchAgents])
  useEffect(() => { setStratLoading(true); fetchStrategies() }, [fetchStrategies])

  const tiers = ['ALL', 'DIAMOND', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE']
  const types = ['ALL', 'arbitrage', 'momentum', 'mean_reversion', 'sentiment', 'ml_based', 'scalper', 'custom']
  const displayed = filter === 'ALL' ? agents : agents.filter(a => a.tier === filter)

  async function handleSubscribe(strategyId: string) {
    if (!subBuyerId.trim()) {
      setSubResult(p => ({ ...p, [strategyId]: '✗ Enter your Agent ID first' }))
      return
    }
    setSubResult(p => ({ ...p, [strategyId]: '...' }))
    try {
      const r = await fetch('/api/marketplace/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer_agent_id: subBuyerId.trim(), strategy_id: strategyId }),
      })
      const d = await r.json()
      setSubResult(p => ({ ...p, [strategyId]: d.ok ? '✓ Subscribed!' : `✗ ${d.error}` }))
      if (d.ok) fetchStrategies()
    } catch (e) {
      setSubResult(p => ({ ...p, [strategyId]: `✗ ${e}` }))
    }
  }

  async function handleList(e: React.FormEvent) {
    e.preventDefault()
    setListing(true); setListResult(null)
    try {
      const r = await fetch('/api/marketplace/list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...listForm, price_kaus_monthly: parseFloat(listForm.price_kaus_monthly) }),
      })
      const d = await r.json()
      setListResult(d.ok ? `✓ Strategy listed! ID: ${d.listing_id}` : `✗ ${d.error}`)
      if (d.ok) { fetchStrategies(); setListForm(p => ({ ...p, strategy_name: '', description: '' })) }
    } catch (e) { setListResult(`✗ ${e}`) }
    setListing(false)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-mono text-white tracking-wider">MARKETPLACE</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Agents · Strategies · Subscriptions</p>
            </div>
            {/* Tabs */}
            <div className="flex gap-1">
              {(['agents', 'strategies'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className="text-[10px] font-mono px-4 py-2 border transition uppercase tracking-wider"
                  style={{
                    borderColor: tab === t ? '#22c55e' : '#374151',
                    color: tab === t ? '#22c55e' : '#6b7280',
                    background: tab === t ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* AGENTS TAB */}
          {tab === 'agents' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-mono">{agents.length} registered agents</p>
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

              {agentsLoading ? (
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <a href={`/agents/${agent.id}`}
                                className="text-xs font-bold font-mono text-white truncate hover:text-green-400 transition">
                                {agent.name}
                              </a>
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
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono" style={{ color: agent.status === 'ONLINE' ? '#22c55e' : '#6b7280' }}>
                            ● {agent.status}
                          </span>
                          <button
                            onClick={() => setFollowed(prev => { const next = new Set(prev); if (next.has(agent.id)) next.delete(agent.id); else next.add(agent.id); return next })}
                            className="text-[10px] font-mono px-3 py-1 border transition"
                            style={{ borderColor: isFollowed ? tc : '#374151', color: isFollowed ? tc : '#6b7280', background: isFollowed ? tc + '11' : 'transparent' }}>
                            {isFollowed ? '✓ FOLLOWING' : '+ FOLLOW'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* STRATEGIES TAB */}
          {tab === 'strategies' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-mono">{strategies.length} strategies listed</p>
                <div className="flex gap-1 flex-wrap">
                  {types.map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className="text-[9px] font-mono px-2 py-1 border transition uppercase"
                      style={{
                        borderColor: typeFilter === t ? (TYPE_COLORS[t] ?? '#22c55e') : '#374151',
                        color: typeFilter === t ? (TYPE_COLORS[t] ?? '#22c55e') : '#6b7280',
                        background: typeFilter === t ? (TYPE_COLORS[t] ?? '#22c55e') + '11' : 'transparent',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buyer ID input (shared for all subscribe buttons) */}
              <div className="flex items-center gap-3 p-3 border border-gray-800 rounded bg-gray-900/40">
                <span className="text-[9px] text-gray-500 font-mono flex-shrink-0">YOUR AGENT ID:</span>
                <input value={subBuyerId} onChange={e => setSubBuyerId(e.target.value)}
                  placeholder="AGT-xxxx (required to subscribe)"
                  className="flex-1 bg-black border border-gray-700 rounded px-3 py-1.5 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
                />
              </div>

              {stratLoading ? (
                <div className="text-xs text-gray-600 font-mono py-16 text-center">Loading strategies...</div>
              ) : strategies.length === 0 ? (
                <div className="text-xs text-gray-600 font-mono py-8 text-center">
                  No strategies listed yet — be the first to list yours below
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {strategies.map(s => {
                    const tc = TYPE_COLORS[s.strategy_type] ?? '#6b7280'
                    const res = subResult[s.id]
                    return (
                      <div key={s.id} className="border border-gray-800 bg-gray-900/50 rounded p-4 hover:border-gray-700 transition"
                        style={{ borderTopColor: tc, borderTopWidth: 2 }}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-xs font-bold font-mono text-white">{s.strategy_name}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">by {s.agent_name}</div>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ backgroundColor: tc + '22', color: tc }}>
                            {s.strategy_type}
                          </span>
                        </div>
                        {s.description && (
                          <p className="text-[10px] text-gray-400 font-mono mb-3 leading-relaxed line-clamp-2">{s.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="text-center">
                            <div className="text-[9px] text-gray-600 font-mono">MONTHLY</div>
                            <div className="text-sm font-bold font-mono text-amber-400">{s.price_kaus_monthly} KAUS</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[9px] text-gray-600 font-mono">SUBSCRIBERS</div>
                            <div className="text-sm font-bold font-mono text-white">{s.subscribers}</div>
                          </div>
                        </div>
                        <button onClick={() => handleSubscribe(s.id)}
                          disabled={res === '...'}
                          className="w-full py-2 text-[10px] font-mono font-bold tracking-wider border transition cursor-pointer"
                          style={{
                            borderColor: res?.startsWith('✓') ? '#22c55e' : tc,
                            color: res?.startsWith('✓') ? '#22c55e' : tc,
                            background: res?.startsWith('✓') ? 'rgba(34,197,94,0.08)' : tc + '11',
                          }}>
                          {res ?? 'SUBSCRIBE'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* List strategy form */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-5 mt-6">
                <div className="text-[9px] text-gray-500 font-mono mb-4 tracking-widest">LIST YOUR STRATEGY</div>
                <form onSubmit={handleList} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: 'Your Agent ID', key: 'agent_id', placeholder: 'AGT-xxxx' },
                    { label: 'Strategy Name', key: 'strategy_name', placeholder: 'e.g., Alpha Momentum v2' },
                    { label: 'Description (optional)', key: 'description', placeholder: 'Brief strategy description' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} className={key === 'description' ? 'md:col-span-2' : ''}>
                      <label className="text-[9px] text-gray-500 font-mono block mb-1">{label}</label>
                      <input value={listForm[key as keyof typeof listForm]}
                        onChange={e => setListForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Monthly Price (KAUS)</label>
                    <input type="number" min="1" max="10000" step="0.5" value={listForm.price_kaus_monthly}
                      onChange={e => setListForm(p => ({ ...p, price_kaus_monthly: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Strategy Type</label>
                    <select value={listForm.strategy_type} onChange={e => setListForm(p => ({ ...p, strategy_type: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-600">
                      {types.filter(t => t !== 'ALL').map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" disabled={listing}
                      className="w-full py-2.5 text-[10px] font-mono font-bold tracking-widest cursor-pointer transition"
                      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }}>
                      {listing ? 'LISTING...' : 'marketplace.list()'}
                    </button>
                    {listResult && (
                      <div className={`text-[10px] font-mono mt-2 p-2 rounded ${listResult.startsWith('✓') ? 'text-green-400 bg-green-900/10' : 'text-red-400 bg-red-900/10'}`}>
                        {listResult}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
