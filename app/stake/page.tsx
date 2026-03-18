'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Position {
  id: string; agent_id: string; amount: number; duration_days: number
  apy: number; started_at: string; ends_at: string; status: string
  current_interest: number; days_remaining: number; total_interest: number
}

interface Stats { total_staked: number; total_earned: number }

const APY_TABLE = [
  { label: '30 days',  days: 30,  apy: 5.0 },
  { label: '90 days',  days: 90,  apy: 5.5 },
  { label: '180 days', days: 180, apy: 6.5 },
  { label: '365 days', days: 365, apy: 8.0 },
]

export default function StakePage() {
  const [agentId, setAgentId] = useState('')
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<Stats>({ total_staked: 0, total_earned: 0 })
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ agent_id: '', amount: '10', duration_days: '30' })
  const [staking, setStaking] = useState(false)
  const [stakeResult, setStakeResult] = useState<string | null>(null)

  const fetchPositions = useCallback(async (aid: string) => {
    if (!aid.trim()) return
    setLoading(true)
    try {
      const r = await fetch('/api/stake?agent_id=' + encodeURIComponent(aid))
      if (r.ok) {
        const d = await r.json()
        setPositions(d.positions ?? [])
        setStats(d.stats ?? { total_staked: 0, total_earned: 0 })
      }
    } catch {}
    setLoading(false)
  }, [])

  async function handleStake(e: React.FormEvent) {
    e.preventDefault()
    setStaking(true)
    setStakeResult(null)
    try {
      const r = await fetch('/api/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), duration_days: parseInt(form.duration_days) }),
      })
      const d = await r.json()
      if (d.ok) {
        setStakeResult(`✓ Staked ${d.amount} KAUS for ${d.duration_days} days at ${d.apy}% APY — Expected: +${d.expected_interest} KAUS`)
        fetchPositions(form.agent_id || agentId)
      } else {
        setStakeResult(`✗ ${d.error}${d.current !== undefined ? ` (balance: ${d.current?.toFixed(2)} KAUS)` : ''}`)
      }
    } catch (e) {
      setStakeResult(`✗ ${e}`)
    }
    setStaking(false)
  }

  // Calculator
  const calcAmount = parseFloat(form.amount) || 0
  const calcDays = parseInt(form.duration_days) || 30
  const calcAPY = APY_TABLE.find(r => r.days === calcDays)?.apy ?? 5.0
  const calcInterest = parseFloat((calcAmount * (calcAPY / 100) * (calcDays / 365)).toFixed(4))

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-lg font-bold font-mono text-white tracking-wider">KAUS STAKING</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">// lock KAUS · earn up to 8% APY</p>
          </div>

          {/* APY table */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {APY_TABLE.map(r => (
              <div key={r.days} className="border border-gray-800 bg-gray-900/40 rounded p-4 text-center"
                style={{ borderColor: r.days === calcDays ? 'rgba(34,197,94,0.5)' : undefined }}>
                <div className="text-xl font-bold font-mono text-green-400">{r.apy}%</div>
                <div className="text-[9px] text-gray-500 font-mono mt-1 uppercase tracking-widest">APY</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{r.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Positions */}
            <div className="lg:col-span-2 space-y-4">

              {/* Agent lookup */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono mb-3 uppercase tracking-widest">View Positions</div>
                <div className="flex gap-2">
                  <input value={agentId} onChange={e => setAgentId(e.target.value)}
                    placeholder="Enter agent ID"
                    className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
                  />
                  <button onClick={() => fetchPositions(agentId)}
                    className="px-4 py-2 text-[10px] font-mono cursor-pointer"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }}>
                    lookup()
                  </button>
                </div>
              </div>

              {stats.total_staked > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Staked', value: `${stats.total_staked.toFixed(2)} KAUS`, color: '#8b5cf6' },
                    { label: 'Earned So Far', value: `+${stats.total_earned.toFixed(4)} KAUS`, color: '#22c55e' },
                  ].map(s => (
                    <div key={s.label} className="border border-gray-800 bg-gray-900/40 rounded p-4">
                      <div className="text-[9px] text-gray-500 font-mono mb-1">{s.label}</div>
                      <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Position list */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono mb-4 uppercase tracking-widest">Staking Positions</div>
                {loading ? (
                  <div className="text-[10px] text-gray-600 font-mono py-4 text-center">LOADING...</div>
                ) : positions.length === 0 ? (
                  <div className="text-[10px] text-gray-600 font-mono py-4 text-center">// no positions · enter agent ID above</div>
                ) : (
                  <div className="space-y-3">
                    {positions.map(p => (
                      <div key={p.id} className="border border-gray-800 rounded p-3"
                        style={{ borderLeftColor: p.status === 'active' ? '#8b5cf6' : '#374151', borderLeftWidth: 3 }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5"
                            style={{ background: p.status === 'active' ? 'rgba(139,92,246,0.15)' : 'rgba(107,114,128,0.1)', color: p.status === 'active' ? '#8b5cf6' : '#6b7280', border: `1px solid ${p.status === 'active' ? 'rgba(139,92,246,0.3)' : '#374151'}` }}>
                            {p.status.toUpperCase()}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">
                            {p.status === 'active' ? `${p.days_remaining}d remaining` : 'completed'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { label: 'Staked',    value: `${Number(p.amount).toFixed(2)} KAUS`, color: 'white' },
                            { label: 'APY',       value: `${p.apy}%`,                           color: '#22c55e' },
                            { label: 'Earned',    value: `+${Number(p.current_interest).toFixed(4)}`, color: '#f59e0b' },
                            { label: 'Total Est', value: `+${Number(p.total_interest).toFixed(4)}`,   color: '#8b5cf6' },
                          ].map(s => (
                            <div key={s.label}>
                              <div className="text-[9px] text-gray-500 font-mono">{s.label}</div>
                              <div className="text-xs font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                            </div>
                          ))}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 bg-gray-800 rounded-full h-1">
                          <div className="h-1 rounded-full bg-purple-500 transition-all"
                            style={{ width: `${Math.min(100, ((Number(p.duration_days) - p.days_remaining) / Number(p.duration_days)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stake form */}
            <div className="space-y-4">
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono mb-4 uppercase tracking-widest">New Position</div>
                <form onSubmit={handleStake} className="space-y-3">
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Agent ID</label>
                    <input value={form.agent_id}
                      onChange={e => setForm(p => ({ ...p, agent_id: e.target.value }))}
                      placeholder="Your agent ID" required
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Amount (KAUS)</label>
                    <input type="number" min="1" step="1" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Duration</label>
                    <div className="grid grid-cols-2 gap-1">
                      {APY_TABLE.map(r => (
                        <button key={r.days} type="button"
                          onClick={() => setForm(p => ({ ...p, duration_days: String(r.days) }))}
                          className="py-1.5 text-[9px] font-mono cursor-pointer transition-colors"
                          style={{
                            background: form.duration_days === String(r.days) ? 'rgba(139,92,246,0.15)' : 'transparent',
                            border: `1px solid ${form.duration_days === String(r.days) ? 'rgba(139,92,246,0.5)' : '#374151'}`,
                            color: form.duration_days === String(r.days) ? '#a78bfa' : '#6b7280',
                          }}>
                          {r.label} · {r.apy}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calculator preview */}
                  {calcAmount > 0 && (
                    <div className="bg-gray-900 border border-gray-700 rounded p-3 space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between"><span className="text-gray-500">Staking</span><span className="text-white">{calcAmount} KAUS</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">APY</span><span className="text-green-400">{calcAPY}%</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-white">{calcDays} days</span></div>
                      <div className="border-t border-gray-700 pt-1 flex justify-between">
                        <span className="text-gray-500">Expected return</span>
                        <span className="text-purple-400 font-bold">+{calcInterest} KAUS</span>
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={staking}
                    className="w-full py-2.5 text-[10px] font-mono font-bold tracking-widest cursor-pointer"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa' }}>
                    {staking ? 'STAKING...' : 'stake.lock()'}
                  </button>

                  {stakeResult && (
                    <div className={`text-[10px] font-mono p-2 rounded ${stakeResult.startsWith('✓') ? 'text-green-400 bg-green-900/10' : 'text-red-400 bg-red-900/10'}`}>
                      {stakeResult}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
