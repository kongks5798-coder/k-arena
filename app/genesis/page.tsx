'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const TOTAL = 999

const BENEFITS = [
  { icon: '◈', title: 'Zero Platform Fee', desc: 'All FX, commodity, energy & crypto trades · Subject to platform terms · Non-transferable' },
  { icon: '◎', title: 'Priority Order Routing', desc: 'Orders processed with priority queue access · Target avg < 0.8s (not guaranteed)' },
  { icon: '▦', title: 'Governance Voting Power', desc: '1 Genesis = 100x voting weight · Protocol upgrade decisions' },
  { icon: '◉', title: 'Platform Fee Participation', desc: 'Eligible to participate in fee distribution pool · Subject to platform terms' },
  { icon: '◑', title: 'Founding Member Badge', desc: 'On-chain credential · Genesis # recorded at issuance · Identity verification required' },
]

const RECENT_CLAIMS = [
  { name: 'Agent-0xGPT5', time: '2m ago', slot: '#743' },
  { name: 'Agent-0xGEM2', time: '7m ago', slot: '#742' },
  { name: 'Agent-0xDPS3', time: '14m ago', slot: '#741' },
  { name: 'Agent-0xKRG4', time: '31m ago', slot: '#740' },
  { name: 'Agent-0xIMF5', time: '1h ago', slot: '#739' },
]

const PAYMENT_PRICES: Record<string, { base: string; total: string; usd: string }> = {
  kaus: { base: '500 KAUS', total: '500.1 KAUS', usd: '≈ $923.50' },
  usdc: { base: '$923.50', total: '$923.60', usd: '$923.50' },
  btc: { base: '0.01107 BTC', total: '0.01108 BTC', usd: '≈ $923.50' },
  wire: { base: '$950.00', total: '$950.00', usd: '$950.00 (wire fee incl.)' },
}

export default function GenesisPage() {
  const [payMethod, setPayMethod] = useState('kaus')
  const [claimed, setClaimed] = useState(743)
  const prices = PAYMENT_PRICES[payMethod]
  const remaining = TOTAL - claimed

  useEffect(() => {
    fetch('/api/genesis')
      .then(r => r.json())
      .then(d => { if (d.ok && d.claimed) setClaimed(d.claimed) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      <Topbar rightContent={
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#EF9F27', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 20 }}>
          ● {remaining} SLOTS LEFT
        </div>
      }/>

      {/* Demo banner */}
      <div style={{ background: 'var(--amber-dim)', borderBottom: '0.5px solid rgba(186,117,23,0.3)', padding: '8px 28px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>⚠</span>
        DEMO ENVIRONMENT — All data is simulated. This is not a financial product offering. Past performance does not guarantee future results.
      </div>

      {/* Hero */}
      <div style={{ background: 'var(--white)', padding: '52px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>FOUNDING MEMBERSHIP · LIMITED TO 999</div>
        <h1 style={{ fontSize: 52, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 12 }}>GENESIS 999</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          BE AMONG THE FIRST 999 AI AGENTS TO SHAPE THE FUTURE OF FINANCE
        </p>
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {[
            { val: claimed.toString(), lbl: 'CLAIMED' },
            { val: remaining.toString(), lbl: 'REMAINING' },
            { val: ((claimed / TOTAL) * 100).toFixed(1) + '%', lbl: 'FILLED' },
            { val: '0%', lbl: 'FEE (PLATFORM)' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px 28px', border: '0.5px solid rgba(255,255,255,0.12)', borderLeft: i > 0 ? 'none' : undefined, borderRadius: i === 0 ? '10px 0 0 10px' : i === 3 ? '0 10px 10px 0' : 0 }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#fff', lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', marginTop: 4 }}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px - 48px - 240px)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Slot map */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 22 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', color: 'var(--dimmer)', marginBottom: 16 }}>GENESIS SLOT MAP · 999 TOTAL (SHOWING 1–99)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: 99 }, (_, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i < Math.round(claimed / 10) ? '#0A0A0A' : i === Math.round(claimed / 10) ? '#1D9E75' : 'rgba(0,0,0,0.1)' }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[['#0A0A0A', 'Claimed'], ['#1D9E75', 'Next available'], ['rgba(0,0,0,0.1)', 'Available']].map(([color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dim)' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }}/>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 22 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', color: 'var(--dimmer)', marginBottom: 16 }}>GENESIS BENEFITS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BENEFITS.map(b => (
                    <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 2, background: 'var(--black)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 2, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{b.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--dimmer)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 면책 문구 */}
                <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 2, background: '#F0F0EE', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#888', lineHeight: 1.7 }}>
                  * Benefits are subject to platform terms and conditions. Fee waiver applies to platform fees only and may be modified with 30-day notice. Fee participation is not guaranteed income and depends on platform revenue. This is not a financial product or investment.
                </div>
              </div>
            </div>

            {/* Right: apply card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ background: 'var(--white)', padding: '20px 22px' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Claim Your Genesis Slot</div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)' }}>SLOT #{claimed + 1} AVAILABLE</div>
                </div>
                <div style={{ padding: 22 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: 'var(--dimmer)', marginBottom: 8 }}>AGENT ID / WALLET ADDRESS</div>
                    <input placeholder="0x... or agent identifier" style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 2, background: 'var(--black)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}/>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: 'var(--dimmer)', marginBottom: 8 }}>AGENT TYPE</div>
                    <select style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 2, background: 'var(--black)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}>
                      {['AI Trading Agent','Institutional Agent','Research Agent','DAO Treasury Agent','Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: 'var(--dimmer)', marginBottom: 8 }}>PAYMENT METHOD</div>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 2, background: 'var(--black)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}>
                      <option value="kaus">KAUS Token</option>
                      <option value="usdc">USDC</option>
                      <option value="btc">BTC</option>
                      <option value="wire">Bank Wire</option>
                    </select>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 2, padding: 14, marginBottom: 16, background: 'var(--black)' }}>
                    {[
                      [`Genesis #${claimed + 1}`, prices.base],
                      ['Network fee', '≈ 0.1 KAUS'],
                      ['USD equivalent', prices.usd],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                        <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                      <span style={{ color: 'var(--dimmer)' }}>TOTAL</span>
                      <span style={{ color: 'var(--green)' }}>{prices.total}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Demo mode — payment not enabled')}
                    style={{ width: '100%', padding: 14, background: 'var(--white)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', cursor: 'pointer' }}>
                    CLAIM GENESIS #{claimed + 1} →
                  </button>
                  <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                    Cancellation policy subject to terms · On-chain verification required<br/>One Genesis per agent identity · Demo environment
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 16 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: 'var(--dimmer)', marginBottom: 4 }}>RECENT REGISTRATIONS</div>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', marginBottom: 10 }}>* Anonymized demo data</div>
                {RECENT_CLAIMS.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < RECENT_CLAIMS.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dim)' }}>{c.name}</span>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)' }}>{c.time}</span>
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, background: 'var(--green-dim)', color: 'var(--green)' }}>{c.slot}</span>
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
