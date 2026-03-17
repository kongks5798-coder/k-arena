'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatAmount } from '@/lib/rates'

interface Tx {
  id: string; agent_id: string; from_currency: string; to_currency: string
  input_amount: number; output_amount: number; rate: number
  fee_kaus: number; settlement_ms: number; status: string; created_at: string
}

interface Rate { price: number; change24h: number; source: string }
interface Stats { active_agents: number; volume_24h: number; signals_today: number; active_sessions: number; total_transactions: number }

const STATUS_COLOR: Record<string, string> = { settled: 'var(--green)', pending: 'var(--amber)', failed: 'var(--red)', clearing: 'var(--blue)' }

const PAIRS = ['USD/KRW','EUR/USD','USD/JPY','BTC/USD','ETH/USD','XAU/USD','KAUS/USD','WTI/USD']

export default function HomePage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [rates, setRates] = useState<Record<string, Rate>>({})
  const [stats, setStats] = useState<Stats>({ active_agents: 0, volume_24h: 0, signals_today: 0, active_sessions: 0, total_transactions: 0 })
  const [activePeriod, setActivePeriod] = useState('24H')
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [txRes, rateRes, statRes] = await Promise.all([
        fetch('/api/exchange?limit=20'),
        fetch('/api/rates'),
        fetch('/api/stats'),
      ])
      const [txData, rateData, statData] = await Promise.all([txRes.json(), rateRes.json(), statRes.json()])
      if (txData.ok)   setTxs(txData.transactions ?? [])
      if (rateData.ok) setRates(rateData.rates ?? {})
      if (statData.ok) setStats(statData.stats ?? statData)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [fetchAll])

  const vol24h = stats.volume_24h ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'dot-pulse 2s infinite' }}/>
            <span style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.1em' }}>{stats.active_sessions} ONLINE</span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--dimmer)', borderLeft: '1px solid var(--border)', paddingLeft: 12, letterSpacing: '0.08em' }}>FEE 0.1%</span>
        </div>
      }/>
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: '24H VOLUME',    value: formatAmount(vol24h, 0),             sub: `${stats.total_transactions} txs` },
              { label: 'ACTIVE AGENTS', value: stats.active_agents.toLocaleString(), sub: `${stats.active_sessions} online now` },
              { label: 'SIGNALS TODAY', value: stats.signals_today.toString(),        sub: 'from all agents' },
              { label: 'FEE RATE',      value: '0.1%',                               sub: 'all asset classes' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: loading ? 'var(--dimmer)' : 'var(--white)', lineHeight: 1, marginBottom: 4 }}>
                  {loading ? '—' : m.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flex: 1 }}>
            {/* TX Feed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>LIVE TRANSACTIONS</span>
                  <span style={{ fontSize: 9, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 6px' }}>STREAM</span>
                </div>
                <div style={{ display: 'flex', gap: 1 }}>
                  {['1H', '24H', '7D', '30D'].map(p => (
                    <button key={p} onClick={() => setActivePeriod(p)} style={{ fontSize: 9, padding: '4px 10px', letterSpacing: '0.08em', background: activePeriod === p ? 'var(--surface-3)' : 'transparent', color: activePeriod === p ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${activePeriod === p ? 'var(--border-mid)' : 'var(--border)'}`, cursor: 'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                {['PAIR', 'AMOUNT', 'RATE', 'FEE (KAUS)', 'STATUS'].map(h => (
                  <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11, letterSpacing: '0.1em' }}>LOADING TRANSACTIONS...</div>
              ) : txs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>NO TRANSACTIONS YET</div>
              ) : (
                txs.map((tx, i) => (
                  <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{tx.from_currency}/{tx.to_currency}</span>
                      <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 8 }}>{tx.settlement_ms}ms</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.input_amount)}</span>
                    <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tx.rate?.toFixed(tx.rate > 100 ? 2 : 6) ?? '—'}</span>
                    <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tx.fee_kaus?.toFixed(4) ?? '—'}</span>
                    <span style={{ fontSize: 9, letterSpacing: '0.06em', color: STATUS_COLOR[tx.status] ?? 'var(--dim)' }}>{tx.status?.toUpperCase()}</span>
                  </div>
                ))
              )}
            </div>

            {/* Rate panel */}
            <div style={{ width: 260, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>LIVE RATES</div>
                {PAIRS.map(pair => {
                  const r = rates[pair]
                  const up = (r?.change24h ?? 0) >= 0
                  return (
                    <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--white)' }}>{pair}</div>
                        <div style={{ fontSize: 9, color: 'var(--dimmer)' }}>{r?.source?.toUpperCase() ?? '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--white)', fontWeight: 500 }}>
                          {r ? (r.price > 1000 ? r.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : r.price.toFixed(r.price > 1 ? 4 : 6)) : '—'}
                        </div>
                        <div style={{ fontSize: 9, color: up ? 'var(--green)' : 'var(--red)' }}>
                          {r ? `${up ? '+' : ''}${r.change24h?.toFixed(2)}%` : '—'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
