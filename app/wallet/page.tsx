'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const TX_HISTORY = [
  { dir: '⇄', desc: 'USD → KRW Exchange', time: '2 min ago · $14.2M notional', amt: '−14.20 KAUS', in: false, status: 'SETTLED' },
  { dir: '↓', desc: 'Genesis Revenue Share', time: '1 hour ago · Monthly distribution', amt: '+403.20 KAUS', in: true, status: 'RECEIVED' },
  { dir: '⇄', desc: 'XAU → USD Exchange', time: '3 hours ago · 500 oz gold', amt: '−8.75 KAUS', in: false, status: 'SETTLED' },
  { dir: '↑', desc: 'Staking Reward', time: '6 hours ago · 30D pool', amt: '+62.40 KAUS', in: true, status: 'RECEIVED' },
  { dir: '⇄', desc: 'kWh Energy Purchase', time: 'Yesterday · 84,320 kWh', amt: '−1,840.00 KAUS', in: false, status: 'SETTLED' },
  { dir: '⇄', desc: 'JPY → USD Exchange', time: 'Yesterday · ¥14B', amt: '−9.34 KAUS', in: false, status: 'CONFIRMING' },
]

const PORTFOLIO = [
  { name: 'KAUS', badge: 'NATIVE', balanceKey: true, usd: '$23,051.48', change: '▲ +3.24%', up: true },
  { name: 'USDC', badge: 'STABLE', balance: '48,200.00', usd: '$48,200.00', change: '▲ 0.00%', up: true },
  { name: 'kWh', badge: 'ENERGY', balance: '84,320', usd: '$20,827.04', change: '▲ +2.11%', up: true },
  { name: 'GENESIS', badge: 'NFT', balance: '#744', usd: '0% fees forever', change: 'Active ✓', up: true },
]

const STAKE_OPTIONS = [
  { name: 'Flexible', sub: 'Unlock anytime', apy: 20 },
  { name: '30 Days', sub: 'Best balance', apy: 35 },
  { name: '90 Days', sub: 'Maximum yield', apy: 50 },
]

export default function WalletPage() {
  const [balance, setBalance] = useState(12480.5)
  const [selectedStake, setSelectedStake] = useState(1)
  const [stakeAmt, setStakeAmt] = useState('')

  useEffect(() => {
    const t = setInterval(() => {
      setBalance(b => +(b + (Math.random() - 0.45) * 0.8).toFixed(2))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const stakeYield = stakeAmt
    ? ((parseFloat(stakeAmt) * STAKE_OPTIONS[selectedStake].apy) / 100 / 12).toFixed(2)
    : null

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block' }}/>
          0x3f4a...91bc
        </div>
      }/>
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Balance hero */}
          <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#999', marginBottom: 6 }}>AGENT WALLET · 0x3f4a8b2c91bc · POLYGON MAINNET</div>
                <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{balance.toFixed(2)}</div>
                <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono, monospace', color: '#999', marginTop: 6 }}>≈ ${(balance * 1.847).toFixed(2)} USD</div>
                <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace', color: '#1D9E75', marginTop: 4 }}>▲ +3.24% today</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Exchange →', 'Send', 'Receive', 'Buy KAUS'].map((btn, i) => (
                  <button key={btn} style={{ padding: '10px 22px', borderRadius: 8, fontSize: 12, fontWeight: 500, fontFamily: 'Syne, sans-serif', cursor: 'pointer', letterSpacing: '0.05em', background: i === 0 ? '#0A0A0A' : 'transparent', color: i === 0 ? '#F9F9F7' : '#555', border: i === 0 ? 'none' : '0.5px solid rgba(0,0,0,0.1)' }}>{btn}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Portfolio */}
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', color: '#999', marginBottom: 16 }}>PORTFOLIO</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 4 }}>
                  {PORTFOLIO.map(t => (
                    <div key={t.name} style={{ border: `0.5px solid ${t.name === 'KAUS' ? '#0A0A0A' : 'rgba(0,0,0,0.1)'}`, borderRadius: 10, padding: 14, background: '#F9F9F7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{t.name}</span>
                        <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, background: t.name === 'KAUS' ? '#0A0A0A' : '#F0F0EE', color: t.name === 'KAUS' ? '#fff' : '#555' }}>{t.badge}</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{t.balanceKey ? balance.toFixed(2) : t.balance}</div>
                      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#999' }}>{t.usd}</div>
                      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: t.up ? '#1D9E75' : '#E24B4A', marginTop: 2 }}>{t.change}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TX History */}
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', color: '#999', marginBottom: 16 }}>TRANSACTION HISTORY</div>
                {TX_HISTORY.map((tx, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < TX_HISTORY.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: '#F9F9F7' }}>{tx.dir}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.desc}</div>
                        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#bbb', marginTop: 2 }}>{tx.time}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: tx.in ? '#1D9E75' : '#0A0A0A' }}>{tx.amt}</div>
                      <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, background: tx.status === 'SETTLED' || tx.status === 'RECEIVED' ? '#E1F5EE' : '#FAEEDA', color: tx.status === 'SETTLED' || tx.status === 'RECEIVED' ? '#0F6E56' : '#854F0B' }}>{tx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: staking + revenue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#999' }}>KAUS STAKING</div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#1D9E75', background: '#E1F5EE', padding: '3px 10px', borderRadius: 20 }}>UP TO 50% APY</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {STAKE_OPTIONS.map((opt, i) => (
                    <div key={opt.name} onClick={() => setSelectedStake(i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: `0.5px solid ${selectedStake === i ? '#0A0A0A' : 'rgba(0,0,0,0.1)'}`, borderRadius: 8, background: '#F9F9F7', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{opt.name}</div>
                        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#bbb' }}>{opt.sub}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{opt.apy}% APY</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input type="number" placeholder="KAUS amount" value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} style={{ flex: 1, padding: '10px 14px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: '#F9F9F7', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}/>
                  <button onClick={() => setStakeAmt('12480')} style={{ padding: '10px 14px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: 'transparent', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#555', cursor: 'pointer' }}>MAX</button>
                </div>
                {stakeYield && (
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555', padding: 10, border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: '#F9F9F7', marginBottom: 12 }}>
                    Est. yield: <span style={{ color: '#1D9E75', fontWeight: 500 }}>+{stakeYield} KAUS / month</span>
                  </div>
                )}
                <button style={{ width: '100%', padding: 12, background: '#0A0A0A', color: '#F9F9F7', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' }}>
                  STAKE KAUS →
                </button>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#999', marginBottom: 14 }}>GENESIS REVENUE SHARE</div>
                {[
                  ['This month earned', '+403.20 KAUS', true],
                  ['Next distribution', 'Apr 1, 2026', false],
                  ['Your share', '1/999 (0.1%)', false],
                  ['Pool this month', '402,800 KAUS', false],
                  ['Annual projection', '~4,838 KAUS/yr', true],
                ].map(([k, v, green]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: 12, color: '#555' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', color: green ? '#1D9E75' : '#0A0A0A' }}>{v}</span>
                  </div>
                ))}
                <button style={{ width: '100%', padding: 11, marginTop: 14, background: 'transparent', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#555', cursor: 'pointer' }}>
                  Claim Rewards →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
