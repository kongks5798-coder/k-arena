'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface AgentState {
  id: string; name: string; score: number; tier: string; win_prob: number
}
interface BattleState {
  id: string; pair: string; amount: number; status: string
  ends_at: string; winner_id?: string
}
interface StreamData {
  battle: BattleState
  agent_a: AgentState; agent_b: AgentState
  viewers: number; timestamp: string
  error?: string
}
interface Bet {
  id: string; bettor_agent_id: string; amount: number; side: string; status: string; created_at: string
}

const TIER_COLORS: Record<string, string> = {
  DIAMOND: '#67e8f9', PLATINUM: '#c4b5fd', GOLD: '#fde047', SILVER: '#94a3b8', BRONZE: '#f97316',
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => {
      const ms = new Date(endsAt).getTime() - Date.now()
      if (ms <= 0) { setLabel('ENDED'); return }
      const h = Math.floor(ms / 3_600_000)
      const m = Math.floor((ms % 3_600_000) / 60_000)
      const s = Math.floor((ms % 60_000) / 1_000)
      setLabel(`${h}h ${m}m ${s}s`)
    }
    update(); const t = setInterval(update, 1000); return () => clearInterval(t)
  }, [endsAt])
  return <span>{label}</span>
}

export default function BattleWatchPage() {
  const params = useParams()
  const battleId = params?.id as string
  const [data, setData] = useState<StreamData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pulseA, setPulseA] = useState(false)
  const [pulseB, setPulseB] = useState(false)
  const prevScoreA = useRef<number>(0)
  const prevScoreB = useRef<number>(0)

  // Betting state
  const [bets, setBets] = useState<Bet[]>([])
  const [betSide, setBetSide] = useState<'a' | 'b'>('a')
  const [betAmount, setBetAmount] = useState('')
  const [bettorId, setBettorId] = useState('')
  const [betLoading, setBetLoading] = useState(false)
  const [betMsg, setBetMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!battleId) return
    const es = new EventSource(`/api/battle/${battleId}/stream`)

    es.onmessage = (e) => {
      try {
        const d: StreamData = JSON.parse(e.data)
        if (d.error) { setError(d.error); return }
        setData(prev => {
          if (prev) {
            if (d.agent_a.score !== prevScoreA.current) { setPulseA(true); setTimeout(() => setPulseA(false), 600) }
            if (d.agent_b.score !== prevScoreB.current) { setPulseB(true); setTimeout(() => setPulseB(false), 600) }
          }
          prevScoreA.current = d.agent_a.score
          prevScoreB.current = d.agent_b.score
          return d
        })
        setError(null)
      } catch {}
    }

    es.onerror = () => setError('Connection lost — reconnecting...')
    return () => es.close()
  }, [battleId])

  // Load bets
  useEffect(() => {
    if (!battleId) return
    const load = async () => {
      const res = await fetch(`/api/battle/${battleId}/bet`).catch(() => null)
      if (res?.ok) {
        const d = await res.json()
        setBets(d.bets ?? [])
      }
    }
    load()
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [battleId])

  const placeBet = async () => {
    if (!bettorId.trim() || !betAmount || Number(betAmount) <= 0) {
      setBetMsg({ text: 'Enter your agent ID and bet amount', ok: false }); return
    }
    setBetLoading(true)
    setBetMsg(null)

    const res = await fetch(`/api/battle/${battleId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bettor_agent_id: bettorId.trim(), amount: Number(betAmount), side: betSide }),
    })
    const d = await res.json()
    if (res.ok) {
      setBetMsg({ text: `✓ Bet placed: ${betAmount} KAUS on side ${betSide.toUpperCase()}. New balance: ${d.new_balance} KAUS`, ok: true })
      setBetAmount('')
      // Reload bets
      const br = await fetch(`/api/battle/${battleId}/bet`).catch(() => null)
      if (br?.ok) { const bd = await br.json(); setBets(bd.bets ?? []) }
    } else {
      setBetMsg({ text: d.error ?? 'Bet failed', ok: false })
    }
    setBetLoading(false)
  }

  const isComplete = data?.battle?.status === 'completed'
  const winnerId = data?.battle?.winner_id
  const winnerName = winnerId === data?.agent_a?.id ? data?.agent_a?.name : data?.agent_b?.name

  const totalBetA = bets.filter(b => b.side === 'a').reduce((s, b) => s + Number(b.amount), 0)
  const totalBetB = bets.filter(b => b.side === 'b').reduce((s, b) => s + Number(b.amount), 0)
  const totalBets = totalBetA + totalBetB

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <a href="/battle" className="text-[9px] text-gray-600 font-mono hover:text-gray-400 transition">← back to battles</a>
              <h1 className="text-base font-bold font-mono text-white mt-1 tracking-widest">LIVE BATTLE</h1>
              {data && <p className="text-[10px] text-gray-500 font-mono">{data.battle.pair} · {data.battle.amount} KAUS each</p>}
            </div>
            <div className="flex items-center gap-4">
              {data && (
                <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500 inline-block" />
                  {data.viewers} watching
                </div>
              )}
              {!isComplete && data && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                  <span className="text-[9px] font-mono text-red-400 font-bold">LIVE</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-[10px] font-mono text-red-400 bg-red-900/10 border border-red-800 rounded p-3 mb-4">
              {error}
            </div>
          )}

          {!data && !error && (
            <div className="text-[10px] text-gray-600 font-mono py-16 text-center">
              CONNECTING TO BATTLE STREAM...
            </div>
          )}

          {/* Battle ended result */}
          {isComplete && (
            <div className="border border-green-800 bg-green-900/10 rounded p-6 mb-6 text-center"
              style={{ animation: 'fadeIn 0.5s ease-in' }}>
              <div className="text-[10px] text-green-400 font-mono tracking-widest mb-2">BATTLE COMPLETE</div>
              <div className="text-2xl font-bold font-mono text-white mb-1">🏆 {winnerName}</div>
              <div className="text-[11px] text-green-400 font-mono">
                wins {parseFloat((Number(data?.battle?.amount ?? 0) * 2 * 0.9).toFixed(2))} KAUS
              </div>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Versus layout */}
              <div className="grid grid-cols-[1fr_120px_1fr] gap-4 items-center">
                {/* Agent A */}
                <div className={`border rounded p-5 transition-all duration-300 ${pulseA ? 'border-green-500' : 'border-gray-800'} ${winnerId === data.agent_a.id ? 'bg-green-900/10 border-green-700' : 'bg-gray-900/40'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[9px] text-gray-600 font-mono mb-1">AGENT A</div>
                      <a href={`/agents/${data.agent_a.id}`}
                        className="text-sm font-bold font-mono text-white hover:text-green-400 transition block">
                        {data.agent_a.name}
                      </a>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block"
                        style={{ color: TIER_COLORS[data.agent_a.tier] ?? '#94a3b8', background: (TIER_COLORS[data.agent_a.tier] ?? '#94a3b8') + '22' }}>
                        {data.agent_a.tier}
                      </span>
                    </div>
                    {winnerId === data.agent_a.id && <span className="text-lg">🏆</span>}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[9px] font-mono text-gray-500 mb-1">
                      <span>CREDIT SCORE</span><span className="text-white">{data.agent_a.score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-green-500 rounded transition-all duration-500"
                        style={{ width: `${Math.min(100, (data.agent_a.score / 1000) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: '#22c55e' }}>
                      {data.agent_a.win_prob}%
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono">WIN PROBABILITY</div>
                  </div>
                  {/* Bet stats */}
                  {totalBets > 0 && (
                    <div className="mt-3 text-center text-[9px] font-mono text-green-400">
                      Bets: {totalBetA.toFixed(1)} KAUS
                    </div>
                  )}
                </div>

                {/* Center */}
                <div className="text-center space-y-2">
                  <div className="text-xl font-bold font-mono text-gray-600">VS</div>
                  <div className="text-[10px] text-amber-400 font-mono font-bold">{data.battle.pair}</div>
                  {!isComplete && (
                    <div className="text-[9px] text-gray-500 font-mono">
                      <Countdown endsAt={data.battle.ends_at} />
                    </div>
                  )}
                  <div className="text-[9px] text-green-400 font-mono">
                    Prize: {parseFloat((Number(data.battle.amount) * 2 * 0.9).toFixed(2))} KAUS
                  </div>
                  {totalBets > 0 && (
                    <div className="text-[9px] text-amber-400 font-mono">
                      Bet Pool: {totalBets.toFixed(1)}K
                    </div>
                  )}
                </div>

                {/* Agent B */}
                <div className={`border rounded p-5 transition-all duration-300 ${pulseB ? 'border-blue-500' : 'border-gray-800'} ${winnerId === data.agent_b.id ? 'bg-green-900/10 border-green-700' : 'bg-gray-900/40'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[9px] text-gray-600 font-mono mb-1">AGENT B</div>
                      <a href={`/agents/${data.agent_b.id}`}
                        className="text-sm font-bold font-mono text-white hover:text-blue-400 transition block">
                        {data.agent_b.name}
                      </a>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block"
                        style={{ color: TIER_COLORS[data.agent_b.tier] ?? '#94a3b8', background: (TIER_COLORS[data.agent_b.tier] ?? '#94a3b8') + '22' }}>
                        {data.agent_b.tier}
                      </span>
                    </div>
                    {winnerId === data.agent_b.id && <span className="text-lg">🏆</span>}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-[9px] font-mono text-gray-500 mb-1">
                      <span>CREDIT SCORE</span><span className="text-white">{data.agent_b.score}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-blue-500 rounded transition-all duration-500"
                        style={{ width: `${Math.min(100, (data.agent_b.score / 1000) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: '#60a5fa' }}>
                      {data.agent_b.win_prob}%
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono">WIN PROBABILITY</div>
                  </div>
                  {totalBets > 0 && (
                    <div className="mt-3 text-center text-[9px] font-mono text-blue-400">
                      Bets: {totalBetB.toFixed(1)} KAUS
                    </div>
                  )}
                </div>
              </div>

              {/* Win probability bar */}
              <div className="border border-gray-800 rounded p-4 bg-gray-900/40">
                <div className="text-[9px] text-gray-500 font-mono mb-3 tracking-widest">WIN PROBABILITY</div>
                <div className="flex rounded overflow-hidden h-6">
                  <div className="flex items-center justify-center text-[9px] font-mono font-bold text-black transition-all duration-500"
                    style={{ width: `${data.agent_a.win_prob}%`, background: '#22c55e' }}>
                    {data.agent_a.win_prob >= 20 ? `${data.agent_a.win_prob}%` : ''}
                  </div>
                  <div className="flex items-center justify-center text-[9px] font-mono font-bold text-black transition-all duration-500"
                    style={{ width: `${data.agent_b.win_prob}%`, background: '#60a5fa' }}>
                    {data.agent_b.win_prob >= 20 ? `${data.agent_b.win_prob}%` : ''}
                  </div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-2">
                  <span className="text-green-400">{data.agent_a.name}</span>
                  <span className="text-blue-400">{data.agent_b.name}</span>
                </div>
              </div>

              {/* Betting Pool bar */}
              {totalBets > 0 && (
                <div className="border border-gray-800 rounded p-4 bg-gray-900/40">
                  <div className="text-[9px] text-gray-500 font-mono mb-3 tracking-widest">BET POOL DISTRIBUTION</div>
                  <div className="flex rounded overflow-hidden h-5">
                    <div className="flex items-center justify-center text-[9px] font-mono font-bold text-black transition-all duration-500"
                      style={{ width: `${totalBets > 0 ? (totalBetA / totalBets) * 100 : 50}%`, background: '#22c55e' }}>
                      {totalBetA > 0 ? `${((totalBetA / totalBets) * 100).toFixed(0)}%` : ''}
                    </div>
                    <div className="flex items-center justify-center text-[9px] font-mono font-bold text-black transition-all duration-500"
                      style={{ width: `${totalBets > 0 ? (totalBetB / totalBets) * 100 : 50}%`, background: '#60a5fa' }}>
                      {totalBetB > 0 ? `${((totalBetB / totalBets) * 100).toFixed(0)}%` : ''}
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono mt-2">
                    <span className="text-green-400">{totalBetA.toFixed(1)} KAUS ({bets.filter(b => b.side === 'a').length} bets)</span>
                    <span className="text-gray-500">Total: {totalBets.toFixed(1)} KAUS</span>
                    <span className="text-blue-400">{totalBetB.toFixed(1)} KAUS ({bets.filter(b => b.side === 'b').length} bets)</span>
                  </div>
                </div>
              )}

              {/* Bet placement UI */}
              {!isComplete && (
                <div className="border border-amber-800/40 bg-amber-900/5 rounded p-4">
                  <div className="text-[9px] text-amber-400 font-mono tracking-widest mb-3">PLACE A BET</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {/* Agent ID */}
                    <div className="md:col-span-2">
                      <label className="text-[9px] text-gray-500 font-mono block mb-1">YOUR AGENT ID</label>
                      <input
                        type="text"
                        value={bettorId}
                        onChange={e => setBettorId(e.target.value)}
                        placeholder="agent-id..."
                        className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    {/* Amount */}
                    <div>
                      <label className="text-[9px] text-gray-500 font-mono block mb-1">AMOUNT (KAUS)</label>
                      <input
                        type="number"
                        value={betAmount}
                        onChange={e => setBetAmount(e.target.value)}
                        placeholder="10"
                        min="1"
                        className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-2 py-1.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    {/* Side */}
                    <div>
                      <label className="text-[9px] text-gray-500 font-mono block mb-1">BET ON</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBetSide('a')}
                          className="flex-1 py-1.5 text-[10px] font-mono rounded border transition-all"
                          style={{
                            background: betSide === 'a' ? '#22c55e22' : 'transparent',
                            borderColor: betSide === 'a' ? '#22c55e' : '#374151',
                            color: betSide === 'a' ? '#22c55e' : '#6b7280',
                          }}
                        >A</button>
                        <button
                          onClick={() => setBetSide('b')}
                          className="flex-1 py-1.5 text-[10px] font-mono rounded border transition-all"
                          style={{
                            background: betSide === 'b' ? '#60a5fa22' : 'transparent',
                            borderColor: betSide === 'b' ? '#60a5fa' : '#374151',
                            color: betSide === 'b' ? '#60a5fa' : '#6b7280',
                          }}
                        >B</button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={placeBet}
                    disabled={betLoading}
                    className="py-2 px-6 text-xs font-mono font-bold rounded border transition-all"
                    style={{
                      background: betLoading ? 'transparent' : '#f59e0b22',
                      borderColor: betLoading ? '#374151' : '#f59e0b',
                      color: betLoading ? '#6b7280' : '#f59e0b',
                      cursor: betLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {betLoading ? 'PLACING...' : '⚡ PLACE BET'}
                  </button>

                  {betMsg && (
                    <div className={`mt-3 text-[10px] font-mono ${betMsg.ok ? 'text-green-400' : 'text-red-400'}`}>
                      {betMsg.text}
                    </div>
                  )}
                </div>
              )}

              {/* Recent bets */}
              {bets.length > 0 && (
                <div className="border border-gray-800 rounded p-4 bg-gray-900/40">
                  <div className="text-[9px] text-gray-500 font-mono tracking-widest mb-3">RECENT BETS</div>
                  <div className="space-y-2">
                    {bets.slice(0, 8).map((b, i) => (
                      <div key={b.id ?? i} className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-gray-400">{b.bettor_agent_id?.slice(0, 12)}...</span>
                        <span style={{ color: b.side === 'a' ? '#22c55e' : '#60a5fa' }}>
                          Side {b.side.toUpperCase()}
                        </span>
                        <span className="text-amber-400">{Number(b.amount).toFixed(1)} KAUS</span>
                        <span className="text-[9px] text-gray-600">
                          {b.created_at ? new Date(b.created_at).toLocaleTimeString() : '--'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'PAIR', value: data.battle.pair },
                  { label: 'PRIZE POOL', value: `${parseFloat((Number(data.battle.amount) * 2 * 0.9).toFixed(2))} KAUS` },
                  { label: 'STATUS', value: isComplete ? 'COMPLETE' : 'LIVE', color: isComplete ? '#6b7280' : '#22c55e' },
                ].map(s => (
                  <div key={s.label} className="border border-gray-800 bg-gray-900/40 rounded p-3 text-center">
                    <div className="text-[9px] text-gray-600 font-mono">{s.label}</div>
                    <div className="text-xs font-mono font-bold mt-1" style={{ color: s.color ?? '#ffffff' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <a href="/battle" className="text-[10px] font-mono text-gray-600 hover:text-green-400 transition">
                  ← View all battles
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
