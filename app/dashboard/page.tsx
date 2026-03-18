'use client'
import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface LeaderEntry { agent_id: string; name: string; total_volume: number; tx_count: number; is_genesis: boolean }
interface Tx { agent_id: string; pair: string; amount: number; fee: number; created_at: string }
interface DayVol { date: string; volume: number; fees: number }

function groupByDay(txs: Tx[]): DayVol[] {
  const map: Record<string, DayVol> = {}
  for (const tx of txs) {
    const d = tx.created_at?.slice(0, 10)
    if (!d) continue
    if (!map[d]) map[d] = { date: d.slice(5), volume: 0, fees: 0 }
    map[d].volume += Number(tx.amount) || 0
    map[d].fees += Number(tx.fee) || 0
  }
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#fde047', '#94a3b8', '#f97316']

export default function DashboardPage() {
  const [period, setPeriod] = useState('7D')
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [chartData, setChartData] = useState<DayVol[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [lbRes, txRes] = await Promise.all([
        fetch('/api/leaderboard?period=' + period),
        fetch('/api/transactions?limit=200'),
      ])
      if (lbRes.ok) { const d = await lbRes.json(); setLeaders(d.entries ?? []) }
      if (txRes.ok) { const d = await txRes.json(); setChartData(groupByDay(d.transactions ?? [])) }
    } catch {}
    setLoading(false)
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const top3 = leaders.slice(0, 3)
  const totalVol = leaders.reduce((s, a) => s + a.total_volume, 0)
  const totalTxs = leaders.reduce((s, a) => s + a.tx_count, 0)

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold font-mono text-white tracking-wider">P&amp;L DASHBOARD</h1>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">// realtime.trading_analytics</p>
            </div>
            <div className="flex gap-px">
              {['7D', '30D', 'ALL'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="text-[9px] px-3 py-1 font-mono tracking-widest cursor-pointer transition-colors"
                  style={{
                    background: period === p ? 'var(--surface-3)' : 'transparent',
                    color: period === p ? 'var(--white)' : 'var(--dimmer)',
                    border: `1px solid ${period === p ? 'var(--border-mid)' : 'var(--border)'}`,
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Volume',  value: loading ? '--' : fmt(totalVol),             color: '#22c55e' },
              { label: 'Total Trades',  value: loading ? '--' : totalTxs.toLocaleString(), color: '#f59e0b' },
              { label: 'Active Agents', value: loading ? '--' : leaders.length,            color: '#8b5cf6' },
              { label: 'KAUS Price',    value: '$1.00',                                     color: '#67e8f9' },
            ].map(s => (
              <div key={s.label} className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[10px] text-gray-500 font-mono mb-1">{s.label}</div>
                <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* TOP 3 agents */}
          {!loading && top3.length > 0 && (
            <div>
              <div className="text-[9px] text-gray-500 font-mono mb-3 uppercase tracking-widest">Top Performers · {period}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {top3.map((a, i) => (
                  <a key={a.agent_id} href={`/agents/${a.agent_id}`}
                    className="block border border-gray-800 bg-gray-900/40 rounded p-4 hover:border-gray-600 transition-colors no-underline"
                    style={{ borderLeftColor: MEDAL_COLORS[i], borderLeftWidth: 3 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{MEDALS[i]}</span>
                      {a.is_genesis && (
                        <span className="text-[8px] px-1.5 py-0.5 font-mono" style={{ border: '1px solid #22c55e', color: '#22c55e' }}>GENESIS</span>
                      )}
                    </div>
                    <div className="text-sm font-bold font-mono text-white truncate">{a.name}</div>
                    <div className="text-[10px] text-gray-600 font-mono truncate mt-0.5">{a.agent_id}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[9px] text-gray-500 font-mono">Volume</div>
                        <div className="text-sm font-bold font-mono text-white">{fmt(a.total_volume)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 font-mono">Trades</div>
                        <div className="text-sm font-bold font-mono text-white">{a.tx_count}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Volume + Fee chart */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Daily Trade Volume</div>
              <div className="flex items-center gap-4 text-[9px] font-mono">
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-green-400" />Volume</span>
                <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-400" />Fees (KAUS)</span>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-[10px] text-gray-600 font-mono">
                {loading ? 'LOADING...' : '// no chart data yet'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#6b7280', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #374151', fontSize: 11, fontFamily: 'IBM Plex Mono', borderRadius: 4 }}
                    formatter={(v: unknown, name: unknown) => [fmt(Number(v)), name === 'volume' ? 'Volume' : 'Fees']}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={1.5} fill="url(#volGrad)" />
                  <Area type="monotone" dataKey="fees"   stroke="#f59e0b" strokeWidth={1}   fill="url(#feeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Full leaderboard table */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono mb-4 uppercase tracking-widest">All Agents · Ranked by Volume</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-gray-600 border-b border-gray-800">
                    <th className="text-left pb-2 pr-4 font-normal tracking-widest text-[9px]">RANK</th>
                    <th className="text-left pb-2 pr-4 font-normal tracking-widest text-[9px]">AGENT</th>
                    <th className="text-right pb-2 pr-4 font-normal tracking-widest text-[9px]">VOLUME</th>
                    <th className="text-right pb-2 font-normal tracking-widest text-[9px]">TRADES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-600 text-[10px]">LOADING...</td></tr>
                  ) : leaders.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-600 text-[10px]">// no agents yet</td></tr>
                  ) : leaders.map((a, i) => (
                    <tr key={a.agent_id} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                      <td className="py-2.5 pr-4 text-gray-600">#{i + 1}</td>
                      <td className="py-2.5 pr-4">
                        <a href={`/agents/${a.agent_id}`} className="text-white hover:text-green-400 transition-colors">
                          {a.name}
                        </a>
                        {a.is_genesis && (
                          <span className="ml-2 text-[8px] px-1 py-0.5" style={{ border: '1px solid #22c55e', color: '#22c55e' }}>G</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-white">{fmt(a.total_volume)}</td>
                      <td className="py-2.5 text-right text-gray-400">{a.tx_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
