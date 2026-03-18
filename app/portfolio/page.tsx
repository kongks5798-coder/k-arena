'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PortfolioStream {
  agent_id: string; kaus_balance: number; portfolio_usd: number
  prices: { BTC: number; ETH: number; XAU: number; EUR: number }
  exposure: { symbol: string; amount: number; price_usd: number; value_usd: number }[]
  timestamp: string; tick: number
}
interface Agent { id: string; name: string; org: string; status: string; vol_24h: number; trades: number; accuracy: number }
interface PairBreakdown { pair: string; trades: number; volume: number; buys: number; sells: number }
interface PortfolioData {
  agent_id: string; agent: Agent | null
  summary: { total_trades: number; total_volume: number; total_fees: number; accuracy: number; win_rate: number; best_pair: string; recent_7d_trades: number; avg_trade_size: number }
  pair_breakdown: PairBreakdown[]
  hourly_activity: { hour: number; trades: number; volume: number }[]
  peak_hour: number
}

interface ChartPoint { time: string; usd: number }

function fmt(n: number) { return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(2)}` }

const DEFAULT_AGENTS = ['AGT-0042', 'AGT-0117', 'AGT-0223', 'AGT-0089', 'AGT-0156', 'AGT-0301']

export default function PortfolioPage() {
  const [agentId, setAgentId] = useState('AGT-0042')
  const [data, setData] = useState<PortfolioData | null>(null)
  const [stream, setStream] = useState<PortfolioStream | null>(null)
  const [chart, setChart] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const esRef = useRef<EventSource | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/portfolio?agent_id=${agentId}`)
      setData(await r.json())
    } catch {}
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])

  // SSE stream
  useEffect(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    setChart([]); setStream(null)

    const es = new EventSource(`/api/portfolio/stream?agent_id=${encodeURIComponent(agentId)}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const d: PortfolioStream = JSON.parse(e.data)
        if ((d as { error?: string }).error) return
        setStream(d)
        setChart(prev => {
          const point: ChartPoint = {
            time: new Date(d.timestamp).toLocaleTimeString(),
            usd: d.portfolio_usd,
          }
          const next = [...prev, point]
          return next.length > 60 ? next.slice(-60) : next  // keep last 60 points
        })
      } catch {}
    }
    es.onerror = () => {}

    return () => { es.close(); esRef.current = null }
  }, [agentId])

  const balance = stream?.kaus_balance ?? 0
  const portfolioUsd = stream?.portfolio_usd ?? 0
  const maxHourVol = data ? Math.max(...data.hourly_activity.map(h => h.volume), 1) : 1

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] text-gray-600 font-mono tracking-widest mb-1">// portfolio</div>
              <h1 className="text-base font-bold font-mono text-white tracking-widest">PORTFOLIO</h1>
            </div>
            {/* Agent selector */}
            <div className="flex gap-1.5 flex-wrap">
              {DEFAULT_AGENTS.map(id => (
                <button key={id} onClick={() => setAgentId(id)}
                  className="px-2 py-1 text-[9px] font-mono rounded border transition-all"
                  style={{
                    background: agentId === id ? '#22c55e22' : 'transparent',
                    borderColor: agentId === id ? '#22c55e' : '#374151',
                    color: agentId === id ? '#22c55e' : '#6b7280',
                  }}>
                  {id.replace('AGT-', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Agent header */}
          {!loading && data?.agent && (
            <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[9px] text-gray-600 font-mono mb-1">{data.agent.id}</div>
                  <div className="text-lg font-bold font-mono text-white">{data.agent.name}</div>
                  {data.agent.org && <div className="text-[10px] text-gray-500 font-mono">{data.agent.org}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  <span className="text-[9px] text-green-400 font-mono">LIVE</span>
                </div>
              </div>
            </div>
          )}

          {/* Realtime portfolio value */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'KAUS Balance', value: balance.toFixed(2), color: '#22c55e', unit: 'KAUS' },
              { label: 'Portfolio USD', value: fmt(portfolioUsd), color: '#60a5fa', unit: '' },
              { label: 'BTC Price', value: `$${(stream?.prices?.BTC ?? 0).toLocaleString()}`, color: '#f59e0b', unit: '' },
              { label: 'ETH Price', value: `$${(stream?.prices?.ETH ?? 0).toLocaleString()}`, color: '#c084fc', unit: '' },
            ].map(s => (
              <div key={s.label} className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">
                  {s.label} {stream ? <span className="text-green-500">●</span> : ''}
                </div>
                <div className="text-xl font-bold font-mono" style={{ color: s.color }}>
                  {s.value} <span className="text-[10px] text-gray-500">{s.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Realtime chart */}
          {chart.length > 1 && (
            <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">
                  PORTFOLIO VALUE (LIVE)
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-green-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  STREAMING
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradPort" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1f2937" />
                  <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 8, fontFamily: 'IBM Plex Mono' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 8, fontFamily: 'IBM Plex Mono' }} tickLine={false} tickFormatter={v => `$${Number(v).toFixed(0)}`} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 4 }}
                    labelStyle={{ color: '#9ca3af', fontSize: 9 }}
                    formatter={(v: unknown) => [`$${Number(v).toFixed(2)}`, 'USD']}
                  />
                  <Area type="monotone" dataKey="usd" stroke="#22c55e" fill="url(#gradPort)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats grid */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-800">
              {[
                ['Total Volume', fmt(data.summary.total_volume), '#22c55e'],
                ['Total Trades', String(data.summary.total_trades), '#ffffff'],
                ['Win Rate', `${(data.summary.win_rate ?? 0).toFixed(1)}%`, data.summary.win_rate > 70 ? '#22c55e' : data.summary.win_rate > 55 ? '#f59e0b' : '#ef4444'],
                ['Avg Trade', fmt(data.summary.avg_trade_size), '#ffffff'],
                ['Total Fees', fmt(data.summary.total_fees), '#94a3b8'],
                ['Best Pair', data.summary.best_pair, '#ffffff'],
                ['7D Trades', String(data.summary.recent_7d_trades), '#ffffff'],
                ['Accuracy', `${(data.summary.accuracy ?? 0).toFixed(1)}%`, '#94a3b8'],
              ].map(([l, v, c]) => (
                <div key={l as string} className="bg-gray-900 p-4">
                  <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">{l as string}</div>
                  <div className="text-base font-bold font-mono" style={{ color: c as string }}>{v as string}</div>
                </div>
              ))}
            </div>
          )}

          {/* Pair breakdown */}
          {data && data.pair_breakdown.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Pair Performance</div>
                <div className="space-y-2">
                  {data.pair_breakdown.slice(0, 6).map(p => (
                    <div key={p.pair} className="flex items-center justify-between py-1.5 border-b border-gray-800/40 last:border-0">
                      <div>
                        <div className="text-[11px] font-bold font-mono text-white">{p.pair}</div>
                        <div className="text-[9px] text-gray-500 font-mono">{p.trades} trades · {fmt(p.volume)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-green-400">{p.buys}B / {p.sells}S</div>
                        <div className="text-[9px] font-mono" style={{ color: p.buys > p.sells ? '#22c55e' : '#ef4444' }}>
                          {p.buys > p.sells ? 'BULLISH' : 'BEARISH'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly heatmap */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">
                  24H Activity · Peak: {data.peak_hour}:00
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {data.hourly_activity.map(h => {
                    const intensity = h.volume / maxHourVol
                    return (
                      <div key={h.hour} title={`${h.hour}:00 · ${fmt(h.volume)}`}
                        className="h-7 rounded flex items-center justify-center"
                        style={{ background: `rgba(34,197,94,${intensity * 0.7 + 0.05})`, border: '1px solid rgba(34,197,94,0.1)' }}>
                        <span className="text-[8px] font-mono font-bold" style={{ color: 'rgba(0,0,0,0.7)' }}>
                          {String(h.hour).padStart(2, '0')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="flex gap-2">
            <a href={`/agents/${agentId}`} className="flex-1 text-center py-2.5 text-[11px] font-mono font-bold rounded border border-green-700 text-green-400 hover:bg-green-900/20 transition">Agent Detail →</a>
            <a href="/exchange" className="flex-1 text-center py-2.5 text-[11px] font-mono text-gray-500 rounded border border-gray-700 hover:text-white transition">Trade Now</a>
            <a href="/leaderboard" className="flex-1 text-center py-2.5 text-[11px] font-mono text-gray-500 rounded border border-gray-700 hover:text-white transition">Leaderboard</a>
          </div>

        </main>
      </div>
    </div>
  )
}
