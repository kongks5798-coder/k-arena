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

  const isComplete = data?.battle?.status === 'completed'
  const winnerId = data?.battle?.winner_id
  const winnerName = winnerId === data?.agent_a?.id ? data?.agent_a?.name : data?.agent_b?.name

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

              {/* View battle list link */}
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
