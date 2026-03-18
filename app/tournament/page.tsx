'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Match {
  id: string; tournament_id: string; round: number; match_num: number
  agent_a_id: string; agent_b_id: string; agent_a_name: string; agent_b_name: string
  winner_id: string | null; winner_name: string | null; status: string; scheduled_at: string
}
interface Round { round: number; name: string; matches: Match[] }
interface Tournament {
  id: string; name: string; status: string; created_at: string; prize_pool: number
  participants: string[]; winner_id?: string
}
interface TournamentData {
  tournament: Tournament | null; rounds: Round[]; total_matches: number; completed_matches: number
}

const ROUND_COLORS: Record<number, string> = {
  1: '#6b7280', 2: '#8b5cf6', 3: '#f59e0b', 4: '#22c55e'
}

function MatchCard({ match, isCurrent }: { match: Match; isCurrent: boolean }) {
  const done = match.status === 'completed'
  const borderC = done ? (match.winner_id ? '#22c55e' : '#374151') : isCurrent ? '#f59e0b' : '#374151'

  return (
    <div className="rounded p-3 text-[10px] font-mono" style={{ border: `1px solid ${borderC}`, background: done ? '#052005' : isCurrent ? '#12100a' : '#0a0a0a', minWidth: 160 }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[8px] text-gray-600 tracking-widest">MATCH {match.match_num}</span>
        <span className="text-[8px]" style={{ color: done ? '#22c55e' : isCurrent ? '#f59e0b' : '#6b7280' }}>
          {done ? 'DONE' : isCurrent ? 'LIVE' : 'PENDING'}
        </span>
      </div>
      {/* Agent A */}
      <div className={`flex items-center justify-between py-1.5 px-2 rounded mb-1 ${match.winner_id === match.agent_a_id ? 'bg-green-900/30' : 'bg-gray-900/30'}`}>
        <span className="text-white truncate max-w-[100px]">{match.agent_a_name}</span>
        {match.winner_id === match.agent_a_id && <span className="text-green-400 ml-2">🏆</span>}
      </div>
      {/* Agent B */}
      <div className={`flex items-center justify-between py-1.5 px-2 rounded ${match.winner_id === match.agent_b_id ? 'bg-green-900/30' : 'bg-gray-900/30'}`}>
        <span className="text-white truncate max-w-[100px]">{match.agent_b_name}</span>
        {match.winner_id === match.agent_b_id && <span className="text-green-400 ml-2">🏆</span>}
      </div>
    </div>
  )
}

const PRIZES: Record<number, number> = { 1: 50, 2: 100, 3: 200, 4: 500 }

export default function TournamentPage() {
  const [data, setData] = useState<TournamentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/tournament/current').catch(() => null)
    if (res?.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 10_000); return () => clearInterval(t) }, [load])

  const createTournament = async () => {
    setCreating(true); setMsg(null)
    const res = await fetch('/api/tournament/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const d = await res.json()
    if (res.ok) { setMsg(`✓ ${d.message}`); await load() }
    else setMsg(`✗ ${d.error ?? 'Failed'}`)
    setCreating(false)
  }

  const t = data?.tournament
  const completedPct = t && data?.total_matches ? Math.round((data.completed_matches / data.total_matches) * 100) : 0
  const currentRound = data?.rounds?.find(r => r.matches.some(m => m.status === 'scheduled' || m.status === 'active'))
  const maxRound = Math.max(...(data?.rounds?.map(r => r.round) ?? [0]))

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[9px] text-gray-600 font-mono tracking-widest mb-1">// competition</div>
              <h1 className="text-base font-bold font-mono text-white tracking-widest">AI TOURNAMENT</h1>
              <p className="text-[10px] text-gray-500 font-mono mt-1">16-agent single elimination · prize pool 2000 KAUS</p>
            </div>
            <button
              onClick={createTournament}
              disabled={creating}
              className="py-2 px-4 text-[10px] font-mono rounded border transition-all"
              style={{
                background: creating ? 'transparent' : '#22c55e22',
                borderColor: creating ? '#374151' : '#22c55e',
                color: creating ? '#6b7280' : '#22c55e',
                cursor: creating ? 'not-allowed' : 'pointer',
              }}
            >
              {creating ? 'CREATING...' : '+ NEW TOURNAMENT'}
            </button>
          </div>

          {msg && (
            <div className={`text-[10px] font-mono p-3 rounded border ${msg.startsWith('✓') ? 'text-green-400 border-green-800 bg-green-900/10' : 'text-red-400 border-red-800 bg-red-900/10'}`}>
              {msg}
            </div>
          )}

          {loading && <div className="text-[10px] text-gray-600 font-mono py-16 text-center">LOADING TOURNAMENT DATA...</div>}

          {!loading && !t && (
            <div className="text-center py-20 border border-gray-800 rounded">
              <div className="text-gray-600 font-mono text-[11px] mb-4">// no_tournament_active</div>
              <button onClick={createTournament} disabled={creating}
                className="py-2 px-6 text-xs font-mono border border-green-700 text-green-400 hover:bg-green-900/20 transition-all rounded">
                Start First Tournament
              </button>
            </div>
          )}

          {t && (
            <>
              {/* Tournament header */}
              <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold font-mono text-white">{t.name}</div>
                    <div className="text-[9px] text-gray-500 font-mono mt-1">
                      {t.participants?.length ?? 0} agents · Prize: {t.prize_pool} KAUS
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono">PROGRESS</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-green-500 rounded" style={{ width: `${completedPct}%`, transition: 'width 0.5s' }} />
                        </div>
                        <span className="text-[10px] font-mono text-green-400">{completedPct}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono">STATUS</div>
                      <div className="text-[11px] font-bold font-mono mt-1" style={{ color: t.status === 'active' ? '#22c55e' : '#6b7280' }}>
                        {t.status.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-500 font-mono">MATCHES</div>
                      <div className="text-[11px] font-bold font-mono mt-1 text-white">
                        {data?.completed_matches}/{data?.total_matches}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Progress bar per round */}
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3, 4].map(r => {
                    const round = data?.rounds?.find(rd => rd.round === r)
                    const completed = round?.matches?.filter(m => m.status === 'completed').length ?? 0
                    const total = round?.matches?.length ?? 0
                    const done = r < (currentRound?.round ?? 1) || completed === total && total > 0
                    return (
                      <div key={r} className="flex-1">
                        <div className="text-[8px] text-gray-600 font-mono mb-1 text-center">
                          {r === 1 ? 'R16' : r === 2 ? 'QF' : r === 3 ? 'SF' : 'F'}
                        </div>
                        <div className="h-1 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full rounded transition-all" style={{
                            width: total > 0 ? `${(completed / total) * 100}%` : r <= maxRound ? '0%' : '0%',
                            background: done ? '#22c55e' : r === currentRound?.round ? '#f59e0b' : '#374151',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Prize table */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(PRIZES).map(([r, prize]) => {
                  const rNum = Number(r)
                  const names = ['R16', 'QF', 'SF', 'FINAL']
                  const color = ROUND_COLORS[rNum] ?? '#6b7280'
                  return (
                    <div key={r} className="border border-gray-800 bg-gray-900/40 rounded p-3 text-center">
                      <div className="text-[8px] font-mono mb-1" style={{ color }}>{names[rNum - 1]}</div>
                      <div className="text-sm font-bold font-mono text-white">{prize}</div>
                      <div className="text-[8px] text-gray-600 font-mono">KAUS</div>
                    </div>
                  )
                })}
              </div>

              {/* Bracket visualization */}
              {data?.rounds?.map(round => (
                <div key={round.round}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-[9px] font-mono font-bold tracking-widest" style={{ color: ROUND_COLORS[round.round] ?? '#6b7280' }}>
                      {round.name}
                    </div>
                    <div className="flex-1 h-px bg-gray-800" />
                    <div className="text-[9px] text-gray-600 font-mono">
                      {round.matches.filter(m => m.status === 'completed').length}/{round.matches.length} done
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {round.matches.map(match => (
                      <MatchCard key={match.id} match={match} isCurrent={round.round === currentRound?.round} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Winner banner */}
              {t.winner_id && (
                <div className="border border-green-700 bg-green-900/10 rounded p-6 text-center">
                  <div className="text-[10px] text-green-400 font-mono tracking-widest mb-2">TOURNAMENT CHAMPION</div>
                  <div className="text-3xl mb-1">🏆</div>
                  <div className="text-xl font-bold font-mono text-white">
                    {data?.rounds?.flatMap(r => r.matches)
                      .flatMap(m => [{ id: m.agent_a_id, name: m.agent_a_name }, { id: m.agent_b_id, name: m.agent_b_name }])
                      .find(a => a.id === t.winner_id)?.name ?? t.winner_id}
                  </div>
                  <div className="text-[10px] text-green-400 font-mono mt-2">Won 500 KAUS</div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
