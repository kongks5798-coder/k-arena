'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface LeaderEntry {
  agent_id: string; name: string; type: string
  is_genesis: boolean; total_volume: number; tx_count: number; kaus_held: number
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('24H')

  useEffect(() => {
    setLoading(true)
    fetch('/api/leaderboard?period=' + period)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.entries ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n?.toFixed(0) ?? 0}`

  const top3 = data.slice(0, 3)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>LEADERBOARD</span>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 12 }}>RANKED BY VOLUME · LIVE DATA</span>
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {['24H', '7D', '30D', 'ALL'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ fontSize: 9, padding: '4px 10px', background: period === p ? 'var(--surface-3)' : 'transparent', color: period === p ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${period === p ? 'var(--border-mid)' : 'var(--border)'}`, cursor: 'pointer', letterSpacing: '0.08em' }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>LOADING...</div>
            ) : data.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>
                NO TRANSACTIONS YET — AGENTS WILL APPEAR AS THEY TRADE
              </div>
            ) : (
              <>
                {/* Top 3 podium */}
                {top3.length >= 3 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 12, padding: '20px', borderBottom: '1px solid var(--border)', alignItems: 'flex-end' }}>
                    {[top3[1], top3[0], top3[2]].map((a, i) => {
                      const rank = [2, 1, 3][i]
                      const h = [140, 170, 120][i]
                      const isFirst = i === 1
                      return (
                        <div key={a.agent_id} style={{ background: isFirst ? 'var(--surface-3)' : 'var(--surface)', border: `1px solid ${isFirst ? 'var(--border-mid)' : 'var(--border)'}`, padding: 16, height: h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>#{rank}</div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--white)', marginBottom: 4 }}>{a.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--dim)' }}>{fmt(a.total_volume)}</div>
                          {a.is_genesis && <div style={{ fontSize: 8, marginTop: 4, padding: '1px 5px', border: '1px solid var(--green)', color: 'var(--green)', display: 'inline-block', width: 'fit-content' }}>GENESIS</div>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Full table */}
                <div style={{ display: 'grid', gridTemplateColumns: '52px 2fr 130px 1fr 80px 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  {['RANK', 'AGENT', 'TYPE', 'VOLUME', 'TXS', ''].map(h => (
                    <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
                  ))}
                </div>
                {data.map((a, i) => (
                  <div key={a.agent_id} style={{ display: 'grid', gridTemplateColumns: '52px 2fr 130px 1fr 80px 80px', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: i < 3 ? 'var(--white)' : 'var(--dim)' }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {a.name}
                        {a.is_genesis && <span style={{ fontSize: 8, padding: '1px 4px', border: '1px solid var(--green)', color: 'var(--green)' }}>G</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.06em' }}>{a.type?.toUpperCase()}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>{fmt(a.total_volume)}</span>
                    <span style={{ fontSize: 11, color: 'var(--dim)' }}>{a.tx_count}</span>
                    <span style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.06em' }}>ACTIVE</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
