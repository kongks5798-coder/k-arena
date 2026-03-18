'use client'
import { useState, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Metrics {
  total_return: number
  sharpe: number
  max_drawdown: number
  win_rate: number
  trades: number
}

interface ChartPoint {
  date: string
  strategy: number
  mean_reversion: number
  buy_hold: number
}

interface BacktestResult {
  strategy: string
  asset: string
  days: number
  data_points: number
  metrics: Metrics
  chart: ChartPoint[]
  available_strategies: string[]
  error?: string
  message?: string
}

const STRATEGIES = ['momentum', 'mean_reversion', 'buy_hold']
const ASSETS = ['BTC', 'ETH', 'XAU', 'OIL', 'EUR']
const DAYS_OPTIONS = [7, 14, 30, 60, 90, 180, 365]

const COLORS: Record<string, string> = {
  strategy: '#22c55e',
  mean_reversion: '#60a5fa',
  buy_hold: '#f59e0b',
}

const STRATEGY_LABELS: Record<string, string> = {
  momentum: 'Momentum',
  mean_reversion: 'Mean Reversion',
  buy_hold: 'Buy & Hold',
}

function MetricCard({ label, value, color, suffix = '' }: { label: string; value: number | string; color: string; suffix?: string }) {
  return (
    <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
      <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {typeof value === 'number' ? value.toFixed(2) : value}{suffix}
      </div>
    </div>
  )
}

export default function BacktestPage() {
  const [strategy, setStrategy] = useState('momentum')
  const [asset, setAsset] = useState('BTC')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await fetch(`/api/backtest?strategy=${strategy}&asset=${asset}&days=${days}`)
    const data: BacktestResult = await res.json()

    if (!res.ok || data.error) {
      setError(data.message ?? data.error ?? 'Backtest failed')
    } else {
      setResult(data)
    }
    setLoading(false)
  }, [strategy, asset, days])

  const m = result?.metrics
  const stratLabel = STRATEGY_LABELS[strategy] ?? strategy

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          {/* Header */}
          <div>
            <div className="text-[9px] text-gray-600 font-mono tracking-widest mb-1">// analytics</div>
            <h1 className="text-base font-bold font-mono text-white tracking-widest">STRATEGY BACKTEST</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              Simulate trading strategies against historical KAUS price data
            </p>
          </div>

          {/* Controls */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {/* Strategy */}
              <div>
                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mb-1.5">Strategy A</label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-green-500"
                >
                  {STRATEGIES.map(s => (
                    <option key={s} value={s}>{STRATEGY_LABELS[s] ?? s}</option>
                  ))}
                </select>
              </div>

              {/* Asset */}
              <div>
                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mb-1.5">Asset</label>
                <select
                  value={asset}
                  onChange={e => setAsset(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-green-500"
                >
                  {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Days */}
              <div>
                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mb-1.5">Period</label>
                <select
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-green-500"
                >
                  {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}D</option>)}
                </select>
              </div>

              {/* Run */}
              <div className="flex items-end">
                <button
                  onClick={run}
                  disabled={loading}
                  className="w-full py-1.5 text-xs font-mono font-bold rounded border transition-all"
                  style={{
                    background: loading ? 'transparent' : '#22c55e22',
                    borderColor: loading ? '#374151' : '#22c55e',
                    color: loading ? '#6b7280' : '#22c55e',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'RUNNING...' : '▶ RUN BACKTEST'}
                </button>
              </div>
            </div>

            <div className="text-[9px] text-gray-600 font-mono">
              Strategy B is always <span className="text-blue-400">Mean Reversion</span> · Baseline is <span className="text-amber-400">Buy &amp; Hold</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="border border-red-800 bg-red-900/10 rounded p-4">
              <div className="text-[10px] text-red-400 font-mono">{error}</div>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Metrics */}
              <div>
                <div className="text-[9px] text-gray-500 font-mono tracking-widest mb-3">
                  {stratLabel.toUpperCase()} · {result.asset} · {result.days}D · {result.data_points} DATA POINTS
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <MetricCard
                    label="Total Return"
                    value={m?.total_return ?? 0}
                    color={(m?.total_return ?? 0) >= 0 ? '#22c55e' : '#ef4444'}
                    suffix="%"
                  />
                  <MetricCard label="Sharpe Ratio" value={m?.sharpe ?? 0} color="#60a5fa" />
                  <MetricCard label="Max Drawdown" value={m?.max_drawdown ?? 0} color="#f59e0b" suffix="%" />
                  <MetricCard label="Win Rate" value={m?.win_rate ?? 0} color="#c084fc" suffix="%" />
                  <MetricCard label="Trades" value={m?.trades ?? 0} color="#94a3b8" />
                </div>
              </div>

              {/* Chart */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono tracking-widest mb-4">
                  CUMULATIVE P&amp;L (%) — STRATEGY COMPARISON
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={result.chart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      {Object.entries(COLORS).map(([key, color]) => (
                        <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#1f2937" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'IBM Plex Mono' }} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 4 }}
                      labelStyle={{ color: '#9ca3af', fontSize: 9, fontFamily: 'IBM Plex Mono' }}
                      itemStyle={{ color: '#fff', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                      formatter={(v: unknown) => [`${Number(v).toFixed(2)}%`]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 9, fontFamily: 'IBM Plex Mono', paddingTop: 8 }}
                      formatter={(value) => STRATEGY_LABELS[value] ?? value}
                    />
                    <Area type="monotone" dataKey="strategy" name="strategy" stroke={COLORS.strategy} fill={`url(#grad-strategy)`} strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="mean_reversion" name="mean_reversion" stroke={COLORS.mean_reversion} fill={`url(#grad-mean_reversion)`} strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="buy_hold" name="buy_hold" stroke={COLORS.buy_hold} fill={`url(#grad-buy_hold)`} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison table */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono tracking-widest mb-3">STRATEGY COMPARISON</div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Strategy', 'Final Return', 'Winner'].map(h => (
                        <th key={h} className="text-left text-[9px] text-gray-600 pb-2 pr-4 font-normal tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const last = result.chart[result.chart.length - 1]
                      if (!last) return null
                      const rows = [
                        { name: stratLabel, key: 'strategy', val: last.strategy, color: COLORS.strategy },
                        { name: 'Mean Reversion', key: 'mean_reversion', val: last.mean_reversion, color: COLORS.mean_reversion },
                        { name: 'Buy & Hold', key: 'buy_hold', val: last.buy_hold, color: COLORS.buy_hold },
                      ]
                      const best = rows.reduce((a, b) => a.val > b.val ? a : b)
                      return rows.map(r => (
                        <tr key={r.key} className="border-b border-gray-800/40">
                          <td className="py-2.5 pr-4" style={{ color: r.color }}>{r.name}</td>
                          <td className="py-2.5 pr-4 font-bold" style={{ color: r.val >= 0 ? '#22c55e' : '#ef4444' }}>
                            {r.val >= 0 ? '+' : ''}{r.val.toFixed(2)}%
                          </td>
                          <td className="py-2.5">
                            {r.key === best.key && <span className="text-[9px] px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-800 rounded">BEST</span>}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!result && !loading && !error && (
            <div className="text-center py-20 text-gray-600 font-mono text-[11px]">
              Select a strategy and click RUN BACKTEST
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
