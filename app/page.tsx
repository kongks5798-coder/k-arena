'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { LIVE_RATES } from '@/lib/rates'

const METRICS = [
  { label: 'TOTAL VOLUME (24H)', value: '$847M', sub: '▲ 12.4%', up: true },
  { label: 'ACTIVE AGENTS', value: '2,847', sub: '▲ 247 new', up: true },
  { label: 'AVG FEE SAVED', value: '$2.1M', sub: 'vs legacy rails', neutral: true },
  { label: 'SETTLEMENT TIME', value: '1.2s', sub: '▼ −0.3s avg', up: false },
]

const RECENT_TX = [
  { agent: 'Agent-Alpha-001', id: '0x3f4a...91bc', pair: 'USD/KRW', type: 'FX', amount: '$14,200,000', fee: '$14,200', status: 'SETTLED' },
  { agent: 'Agent-Quant-004', id: '0x8b2c...44ef', pair: 'XAU/USD', type: 'GOLD', amount: '$8,750,000', fee: '$8,750', status: 'SETTLED' },
  { agent: 'Agent-KAUS-447', id: '0x1d7e...c3a2', pair: 'WTI/USD', type: 'OIL', amount: '$32,100,000', fee: '$32,100', status: 'ROUTING' },
  { agent: 'Agent-Inst-KR01', id: 'INST · AG-KR-001', pair: 'JPY/USD', type: 'FX', amount: '$220,000,000', fee: '$220,000', status: 'SETTLED' },
  { agent: 'Agent-DAO-012', id: '0x5f9d...77aa', pair: 'kWh/KAUS', type: 'ENERGY', amount: '$1,840,000', fee: '$1,840', status: 'CLEARING' },
]

const ACTIVITY = [
  { color: '#1D9E75', text: 'KR-GOV-001 settled $220M JPY/USD exchange', time: '2s ago' },
  { color: '#378ADD', text: 'New agent registered: Agent-Algo-006', time: '14s ago' },
  { color: '#EF9F27', text: 'Genesis #744 minted — 255 slots remaining', time: '1m ago' },
  { color: '#1D9E75', text: 'Agent-DAO-012 opened kWh/KAUS position', time: '3m ago' },
  { color: '#378ADD', text: 'Agent-Obs-005 joined community governance', time: '8m ago' },
]

export default function HomePage() {
  const [activePeriod, setActivePeriod] = useState('1H')
  const [agents, setAgents] = useState(2847)

  useEffect(() => {
    const t = setInterval(() => setAgents(a => a + Math.floor(Math.random() * 3)), 5000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }}/>
            MAINNET LIVE
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: 20 }}>
            {agents.toLocaleString()} agents
          </div>
          <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: 20 }}>
            FEE 0.1%
          </div>
        </div>
      }/>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        <Sidebar />

        {/* Center */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#F9F9F7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Overview</h1>
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#999', marginTop: 4 }}>
                REAL-TIME · ALL ASSETS · AI AGENTS ONLY
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['1H','24H','7D','30D'].map(t => (
                <button key={t} onClick={() => setActivePeriod(t)} style={{
                  fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                  padding: '6px 12px', borderRadius: 6,
                  border: '0.5px solid rgba(0,0,0,0.1)',
                  background: activePeriod === t ? '#0A0A0A' : '#fff',
                  color: activePeriod === t ? '#F9F9F7' : '#555',
                  cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {METRICS.map(m => (
              <div key={m.label} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: '#999', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: m.neutral ? '#999' : m.up ? '#1D9E75' : '#E24B4A' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* TX Table */}
          <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 90px', padding: '12px 20px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: '#999', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
              <span>AGENT</span><span>PAIR</span><span>AMOUNT</span><span>FEE (0.1%)</span><span>STATUS</span>
            </div>
            {RECENT_TX.map((tx, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 90px', padding: '14px 20px', alignItems: 'center', borderBottom: i < RECENT_TX.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#F0F0EE', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: '#555' }}>
                    {tx.agent.substring(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.agent}</div>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#999' }}>{tx.id}</div>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{tx.pair}</span>
                  <span style={{ fontSize: 11, color: '#999', marginLeft: 6 }}>{tx.type}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{tx.amount}</div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>{tx.fee}</div>
                <div>
                  <span style={{
                    fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                    padding: '3px 8px', borderRadius: 4,
                    background: tx.status === 'SETTLED' ? '#E1F5EE' : tx.status === 'ROUTING' ? '#FAEEDA' : '#E6F1FB',
                    color: tx.status === 'SETTLED' ? '#0F6E56' : tx.status === 'ROUTING' ? '#854F0B' : '#185FA5',
                  }}>{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right sidebar */}
        <aside style={{ width: 280, borderLeft: '0.5px solid rgba(0,0,0,0.1)', background: '#fff', overflowY: 'auto', padding: 20, flexShrink: 0 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#999', marginBottom: 12 }}>MARKET RATES</div>
            {LIVE_RATES.map(r => (
              <div key={r.pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{r.pair}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{r.type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{r.price}</div>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: r.up ? '#1D9E75' : '#E24B4A' }}>{r.change}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.2em', color: '#999', marginBottom: 12 }}>LIVE ACTIVITY</div>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: i < ACTIVITY.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#bbb', marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
