'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { getRate, ASSET_META, LIVE_RATES, formatAmount } from '@/lib/rates'

const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'CNY', 'KAUS', 'XAU', 'BTC', 'KRW', 'WTI']
const QUICK = [100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000]

export default function ExchangePage() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('KRW')
  const [amount, setAmount] = useState(1_000_000)

  const rate = getRate(from, to)
  const output = amount * rate
  const fee = amount * 0.001

  const swap = () => { setFrom(to); setTo(from) }

  const formatRate = () => {
    const r = getRate(from, to)
    if (r >= 1e6) return `${(r / 1e6).toFixed(2)}M`
    if (r >= 1e3) return r.toLocaleString()
    return r.toFixed(4)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7' }}>
      <Topbar />
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28, background: '#F9F9F7' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>FX Exchange</h1>
            <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#999', marginTop: 4 }}>
              AI AGENT ONLY · 0.1% FEE · INSTANT SETTLEMENT · ALL CURRENCIES
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* Main exchange */}
            <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#999', marginBottom: 20 }}>EXCHANGE INTERFACE</div>

              {/* Pair selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 16, background: '#F9F9F7' }}>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#999', letterSpacing: '0.1em', marginBottom: 8 }}>FROM</div>
                  <select value={from} onChange={e => setFrom(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#0A0A0A', outline: 'none' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ fontSize: 12, color: '#999', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                    {ASSET_META[from]?.label} · {ASSET_META[from]?.type}
                  </div>
                </div>

                <button onClick={swap} style={{ width: 48, height: 48, borderRadius: '50%', border: '0.5px solid rgba(0,0,0,0.1)', background: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⇄</button>

                <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 16, background: '#F9F9F7' }}>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#999', letterSpacing: '0.1em', marginBottom: 8 }}>TO</div>
                  <select value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 20, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: '#0A0A0A', outline: 'none' }}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div style={{ fontSize: 12, color: '#999', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>
                    {ASSET_META[to]?.label} · {ASSET_META[to]?.type}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#999', letterSpacing: '0.1em', marginBottom: 10 }}>AMOUNT TO EXCHANGE</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    style={{ width: '100%', padding: '16px 80px 16px 20px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, background: '#F9F9F7', fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 500, color: '#0A0A0A', outline: 'none' }}
                  />
                  <span style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>{from}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {QUICK.map(q => (
                    <button key={q} onClick={() => setAmount(q)} style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', padding: '5px 12px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.1)', background: amount === q ? '#F0F0EE' : 'transparent', color: '#555', cursor: 'pointer' }}>
                      {q >= 1e9 ? '1B' : q >= 1e6 ? (q/1e6)+'M' : '100K'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Output */}
              <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#999', letterSpacing: '0.1em', marginBottom: 8 }}>YOU RECEIVE</div>
                <div>
                  <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em' }}>{formatAmount(output)}</span>
                  <span style={{ fontSize: 16, color: '#555', marginLeft: 8 }}>{to}</span>
                </div>
              </div>

              {/* Rate info */}
              <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 16, marginBottom: 20, background: '#F9F9F7' }}>
                {[
                  ['EXCHANGE RATE', `1 ${from} = ${formatRate()} ${to}`, false],
                  ['PLATFORM FEE (0.1%)', `${from} ${formatAmount(fee)}`, true],
                  ['SETTLEMENT TIME', '≈ 1.2 seconds', true],
                  ['RATE SOURCE', 'KAUS Oracle · Multi-feed', false],
                ].map(([k, v, green]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#999' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: green ? '#1D9E75' : '#0A0A0A' }}>{v}</span>
                  </div>
                ))}
              </div>

              <button style={{ width: '100%', padding: 16, background: '#0A0A0A', color: '#F9F9F7', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', cursor: 'pointer' }}>
                EXECUTE EXCHANGE →
              </button>
            </div>

            {/* Right: rates + depth + recent */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#999', marginBottom: 14 }}>LIVE RATES</div>
                {LIVE_RATES.map(r => (
                  <div key={r.pair} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{r.pair}</div>
                      <div style={{ fontSize: 10, color: '#bbb' }}>{r.type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{r.price}</div>
                      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: r.up ? '#1D9E75' : '#E24B4A' }}>{r.change}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#999', marginBottom: 14 }}>RECENT SETTLEMENTS</div>
                {[
                  { pair: 'USD → KRW', amt: '$220M', agent: 'KR-GOV-001', time: '2s ago' },
                  { pair: 'JPY → USD', amt: '¥14B', agent: 'DeepSeek', time: '18s ago' },
                  { pair: 'EUR → KAUS', amt: '€8.2M', agent: 'ECB-Agent', time: '1m ago' },
                  { pair: 'XAU → BTC', amt: '500 oz', agent: 'GoldDAO', time: '3m ago' },
                ].map((tx, i) => (
                  <div key={i} style={{ padding: '9px 0', borderBottom: i < 3 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{tx.pair}</span>
                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{tx.amt}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#bbb' }}>{tx.agent} · {tx.time}</span>
                      <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, background: '#E1F5EE', color: '#0F6E56' }}>SETTLED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
