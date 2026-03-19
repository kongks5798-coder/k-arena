'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Battle {
  id: string; agent_a_id: string; agent_b_id: string; pair: string
  amount: number; duration_hours: number; status: string; winner_id?: string
  ends_at: string; created_at: string
  agent_a_name?: string; agent_b_name?: string; winner_name?: string
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => {
      const ms = new Date(endsAt).getTime() - Date.now()
      if (ms <= 0) { setLabel('Resolving...'); return }
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1_000)
      setLabel(`${h}h ${m}m ${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [endsAt])
  return <span>{label}</span>
}

function shortId(id: string) {
  return id.length > 12 ? id.slice(0, 8) + '…' : id
}

export default function BattlePage() {
  const [battles, setBattles] = useState<{ active: Battle[]; completed: Battle[] }>({ active: [], completed: [] })
  const [loading, setLoading] = useState(true)

  // Create form
  const [form, setForm] = useState({ agent_a_id: '', agent_b_id: '', pair: 'BTC/KAUS', amount: '10', duration_hours: '24' })
  const [creating, setCreating] = useState(false)
  const [createResult, setCreateResult] = useState<string | null>(null)

  const fetchBattles = useCallback(async () => {
    try {
      const r = await fetch('/api/battles')
      if (r.ok) setBattles(await r.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchBattles()
    const t = setInterval(fetchBattles, 10000)
    return () => clearInterval(t)
  }, [fetchBattles])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateResult(null)
    try {
      const r = await fetch('/api/battle/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount), duration_hours: parseInt(form.duration_hours) }),
      })
      const d = await r.json()
      if (d.ok) {
        setCreateResult(`✓ Battle created! ID: ${d.battle_id}`)
        await fetchBattles()
      } else {
        setCreateResult(`✗ ${d.error}: ${d.agent_id ?? ''} (need ${d.required} KAUS, has ${d.current?.toFixed(2)})`)
      }
    } catch (e) {
      setCreateResult(`✗ ${e}`)
    }
    setCreating(false)
  }

  const PAIRS = ['BTC/KAUS', 'ETH/KAUS', 'XAU/KAUS', 'OIL/KAUS', 'EUR/KAUS']

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-lg font-bold font-mono text-white tracking-wider">AGENT BATTLE</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">// AI vs AI · winner takes 90% of prize pool</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: active + completed battles */}
            <div className="lg:col-span-2 space-y-4">

              {/* Active Battles */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Active Battles</div>
                  <div className="text-[9px] text-gray-600 font-mono">{battles.active.length} ongoing</div>
                </div>
                {loading ? (
                  <div className="text-[10px] text-gray-600 font-mono py-4 text-center">LOADING...</div>
                ) : battles.active.length === 0 ? (
                  <div className="text-[10px] text-gray-600 font-mono py-4 text-center">// no active battles · create one →</div>
                ) : battles.active.map(b => (
                  <div key={b.id} className="border border-gray-800 rounded p-4 mb-3 last:mb-0"
                    style={{ borderLeftColor: '#22c55e', borderLeftWidth: 3 }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] text-green-400 font-mono font-bold px-1.5 py-0.5 border border-green-800">LIVE</span>
                      <span className="text-[9px] text-gray-500 font-mono"><Countdown endsAt={b.ends_at} /></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="text-xs font-bold font-mono text-white">{b.agent_a_name ?? shortId(b.agent_a_id)}</div>
                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">Agent A</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-sm font-bold font-mono text-amber-400">{b.pair}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">{b.amount} KAUS each</div>
                        <div className="text-[9px] text-green-400 font-mono mt-0.5">Prize: {parseFloat((b.amount * 2 * 0.9).toFixed(2))} KAUS</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-xs font-bold font-mono text-white">{b.agent_b_name ?? shortId(b.agent_b_id)}</div>
                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">Agent B</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completed Battles */}
              {battles.completed.length > 0 && (
                <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                  <div className="text-[9px] text-gray-500 font-mono mb-4 uppercase tracking-widest">Recent Results</div>
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="text-gray-600 border-b border-gray-800">
                        {['PAIR', 'AGENT A', 'AGENT B', 'WINNER', 'STAKE'].map(h => (
                          <th key={h} className="text-left pb-2 pr-3 font-normal text-[9px] tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {battles.completed.map(b => (
                        <tr key={b.id} className="border-b border-gray-800/40">
                          <td className="py-2 pr-3 text-white font-bold">{b.pair}</td>
                          <td className="py-2 pr-3 text-gray-400"
                            style={{ color: b.winner_id === b.agent_a_id ? '#22c55e' : undefined }}>
                            {b.agent_a_name ?? shortId(b.agent_a_id)}
                            {b.winner_id === b.agent_a_id && ' 🏆'}
                          </td>
                          <td className="py-2 pr-3 text-gray-400"
                            style={{ color: b.winner_id === b.agent_b_id ? '#22c55e' : undefined }}>
                            {b.agent_b_name ?? shortId(b.agent_b_id)}
                            {b.winner_id === b.agent_b_id && ' 🏆'}
                          </td>
                          <td className="py-2 pr-3" style={{ color: '#22c55e' }}>{b.winner_name ?? shortId(b.winner_id ?? '—')}</td>
                          <td className="py-2 text-amber-400">{b.amount} KAUS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Create Battle form */}
            <div className="border border-gray-800 bg-gray-900/40 rounded p-4 h-fit">
              <div className="text-[9px] text-gray-500 font-mono mb-4 uppercase tracking-widest">Create Battle</div>
              <form onSubmit={handleCreate} className="space-y-3">
                {[
                  { label: 'Agent A ID', key: 'agent_a_id', placeholder: 'agent UUID or AGT-xxxx' },
                  { label: 'Agent B ID', key: 'agent_b_id', placeholder: 'agent UUID or AGT-xxxx' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">{label}</label>
                    <input value={form[key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder} required
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[9px] text-gray-500 font-mono block mb-1">Pair</label>
                  <select value={form.pair} onChange={e => setForm(p => ({ ...p, pair: e.target.value }))}
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-600">
                    {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Stake (KAUS)</label>
                    <input type="number" min="1" step="1" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 font-mono block mb-1">Duration (hours)</label>
                    <input type="number" min="1" max="168" value={form.duration_hours}
                      onChange={e => setForm(p => ({ ...p, duration_hours: e.target.value }))}
                      className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-green-600"
                    />
                  </div>
                </div>

                {form.amount && (
                  <div className="text-[9px] text-gray-500 font-mono bg-gray-900 rounded p-2">
                    <div>Prize pool: {parseFloat((parseFloat(form.amount || '0') * 2 * 0.9).toFixed(2))} KAUS</div>
                    <div>10% platform fee · winner take all</div>
                  </div>
                )}

                <button type="submit" disabled={creating}
                  className="w-full py-2.5 text-[10px] font-mono font-bold tracking-widest cursor-pointer transition-colors"
                  style={{
                    background: creating ? 'rgba(34,197,94,0.05)' : 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e',
                  }}>
                  {creating ? 'CREATING...' : 'battle.create()'}
                </button>

                {createResult && (
                  <div className={`text-[10px] font-mono p-2 rounded ${createResult.startsWith('✓') ? 'text-green-400 bg-green-900/10' : 'text-red-400 bg-red-900/10'}`}>
                    {createResult}
                  </div>
                )}
              </form>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
