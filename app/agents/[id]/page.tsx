'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'

interface Agent { id: string; name: string; org: string; type: string; status: string; trades: number; vol_24h: number; accuracy: number; is_genesis?: boolean; created_at: string }
interface Tx { id: string; pair: string; from_currency: string; to_currency: string; amount: number; input_amount: number; fee: number; fee_kaus: number; status: string; created_at: string }
interface CreditScore { score: number; tier: string; total_trades: number; win_rate: number }

const TIER_COLORS: Record<string, string> = {
  DIAMOND: '#67e8f9', PLATINUM: '#c4b5fd', GOLD: '#fde047', SILVER: '#94a3b8', BRONZE: '#f97316',
}
const TIER_ICONS: Record<string, string> = {
  DIAMOND: '💎', PLATINUM: '🏅', GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉',
}

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function AgentPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [agent, setAgent] = useState<Agent | null>(null)
  const [txs, setTxs] = useState<Tx[]>([])
  const [credit, setCredit] = useState<CreditScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [agRes, txRes, crRes] = await Promise.all([
        fetch('/api/agents'),
        fetch(`/api/transactions?agent_id=${encodeURIComponent(id)}&limit=50`),
        fetch(`/api/credit-score?agent_id=${encodeURIComponent(id)}`),
      ])

      if (agRes.ok) {
        const d = await agRes.json()
        const found = (d.agents ?? []).find((a: Agent) => a.id === id)
        if (found) setAgent(found)
        else setNotFound(true)
      }
      if (txRes.ok) {
        const d = await txRes.json()
        setTxs((d.transactions ?? []).map((t: Record<string, unknown>) => ({
          ...t,
          pair: t.pair ?? `${t.from_currency}/${t.to_currency}`,
          amount: t.amount ?? t.input_amount ?? 0,
          fee: t.fee ?? t.fee_kaus ?? 0,
        })))
      }
      if (crRes.ok) {
        const d = await crRes.json()
        if (d.score) setCredit({ score: d.score, tier: d.tier ?? 'BRONZE', total_trades: d.total_trades ?? 0, win_rate: d.win_rate ?? 0 })
      }
    } catch {}
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const tier = credit?.tier ?? 'BRONZE'
  const tc = TIER_COLORS[tier] ?? '#f97316'

  if (!loading && notFound) {
    return (
      <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center font-mono">
              <div className="text-2xl text-red-400 mb-2">// agent_not_found</div>
              <div className="text-sm text-gray-500 mb-6">{id}</div>
              <Link href="/leaderboard" className="text-green-400 text-xs hover:underline">← back to leaderboard</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          {/* Back */}
          <Link href="/leaderboard" className="text-[10px] text-gray-500 font-mono hover:text-green-400 transition-colors flex items-center gap-1">
            ← leaderboard[]
          </Link>

          {/* Agent header */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-5"
            style={{ borderLeftColor: tc, borderLeftWidth: 3 }}>
            {loading ? (
              <div className="text-[10px] text-gray-600 font-mono">LOADING...</div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-xl font-bold font-mono text-white">{agent?.name ?? id}</h1>
                    {agent?.is_genesis && (
                      <span className="text-[9px] px-2 py-0.5 font-mono" style={{ border: '1px solid #22c55e', color: '#22c55e' }}>GENESIS</span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono flex items-center gap-1"
                      style={{ background: tc + '18', color: tc, border: `1px solid ${tc}44` }}>
                      {TIER_ICONS[tier]} {tier}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">{id}</div>
                  {agent?.org && <div className="text-[10px] text-gray-600 font-mono mt-0.5">{agent.org}</div>}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Credit Score', value: credit?.score ?? '--', color: tc },
                    { label: 'Total Trades', value: credit?.total_trades ?? agent?.trades ?? '--', color: '#22c55e' },
                    { label: 'Win Rate', value: credit?.win_rate ? `${credit.win_rate.toFixed(1)}%` : '--', color: '#f59e0b' },
                    { label: 'Vol 24H', value: agent?.vol_24h ? fmt(agent.vol_24h) : '--', color: '#8b5cf6' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="text-[9px] text-gray-500 font-mono">{s.label}</div>
                      <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Credit progress bar */}
          {!loading && credit && (
            <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
              <div className="text-[9px] text-gray-500 font-mono mb-3 uppercase tracking-widest">Credit Score Progress</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (credit.score / 600) * 100)}%`, background: tc }} />
                </div>
                <span className="text-[10px] font-mono font-bold" style={{ color: tc }}>{credit.score} pts</span>
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-gray-600 font-mono">
                {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].map(t => (
                  <span key={t} style={{ color: t === tier ? TIER_COLORS[t] : undefined }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Transaction History</div>
              <div className="text-[9px] text-gray-600 font-mono">{txs.length} trades shown</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-gray-600 border-b border-gray-800">
                    {['PAIR', 'AMOUNT', 'FEE (KAUS)', 'STATUS', 'TIME'].map(h => (
                      <th key={h} className="text-left pb-2 pr-4 font-normal tracking-widest text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-600 text-[10px]">LOADING...</td></tr>
                  ) : txs.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-600 text-[10px]">// no transactions yet</td></tr>
                  ) : txs.map((tx, i) => (
                    <tr key={tx.id ?? i} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                      <td className="py-2.5 pr-4 text-white font-bold">{tx.pair}</td>
                      <td className="py-2.5 pr-4 text-white">{fmt(tx.amount)}</td>
                      <td className="py-2.5 pr-4 text-amber-400">{Number(tx.fee).toFixed(4)}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                          {tx.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-500 text-[10px]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('en', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
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
