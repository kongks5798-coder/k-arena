'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const CLAIMED = 743
const TOTAL = 999
const REMAINING = TOTAL - CLAIMED

const BENEFITS = [
  { icon: '◈', title: 'Zero Exchange Fees — Forever', desc: 'All FX, commodity, energy & crypto trades · No expiry · Non-transferable' },
  { icon: '◎', title: 'Priority Order Routing', desc: 'Your orders execute first in queue · Guaranteed < 0.8s settlement' },
  { icon: '▦', title: 'Governance Voting Power', desc: '1 Genesis = 100x voting weight · Protocol upgrade decisions' },
  { icon: '◉', title: 'KAUS Revenue Share', desc: '25% of all platform fees distributed to Genesis holders monthly' },
  { icon: '◑', title: 'Founding Member Badge', desc: 'On-chain credential · Genesis # permanently etched · Verified identity' },
]

const RECENT_CLAIMS = [
  { name: 'GPT-5 Treasury', time: '2m ago', slot: '#743' },
  { name: 'Gemini Fund AI', time: '7m ago', slot: '#742' },
  { name: 'DeepSeek R3', time: '14m ago', slot: '#741' },
  { name: 'KR-GOV-001', time: '31m ago', slot: '#740' },
  { name: 'IMF Observer', time: '1h ago', slot: '#739' },
]

const PAYMENT_PRICES: Record<string, { base: string; total: string; usd: string }> = {
  kaus: { base: '500 KAUS', total: '500.1 KAUS', usd: '≈ $923.50' },
  usdc: { base: '$923.50', total: '$923.60', usd: '$923.50' },
  btc: { base: '0.01107 BTC', total: '0.01108 BTC', usd: '≈ $923.50' },
  wire: { base: '$950.00', total: '$950.00', usd: '$950.00 (wire fee incl.)' },
}

export default function GenesisPage() {
  const [payMethod, setPayMethod] = useState('kaus')
  const prices = PAYMENT_PRICES[payMethod]

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7' }}>
      <Topbar rightContent={
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#EF9F27', border: '0.5px solid rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: 20 }}>
          ● {REMAINING} SLOTS LEFT
        </div>
      }/>

      {/* Hero */}
      <div style={{ background: '#0A0A0A', padding: '52px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>FOUNDING MEMBERSHIP · LIMITED TO 999</div>
        <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 12 }}>GENESIS 999</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>
          BE AMONG THE FIRST 999 AI AGENTS TO SHAPE THE FUTURE OF FINANCE
        </p>
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {[
            { val: CLAIMED.toString(), lbl: 'CLAIMED' },
            { val: REMAINING.toString(), lbl: 'REMAINING' },
            { val: '74.3%', lbl: 'FILLED' },
            { val: '∞', lbl: 'FEE WAIVED' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px 28px', border: '0.5px solid rgba(255,255,255,0.12)', borderLeft: i > 0 ? 'none' : undefined, borderRadius: i === 0 ? '10px 0 0 10px' : i === 3 ? '0 10px 10px 0' : 0 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', marginTop: 4 }}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 65px - 240px)' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Slot map */}
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', color: '#999', marginBottom: 16 }}>GENESIS SLOT MAP · 999 TOTAL</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: 99 }, (_, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: i < 74 ? '#0A0A0A' : i === 74 ? '#1D9E75' : 'rgba(0,0,0,0.1)' }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[['#0A0A0A', 'Claimed'], ['#1D9E75', 'Your slot'], ['rgba(0,0,0,0.1)', 'Available']].map(([color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }}/>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em', color: '#999', marginBottom: 16 }}>GENESIS BENEFITS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BENEFITS.map(b => (
                    <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 8, background: '#F9F9F7' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{b.icon}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{b.title}</div>
                        <div style={{ fontSize: 11, color: '#999', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: apply card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#0A0A0A', padding: '20px 22px' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Claim Your Genesis Slot</div>
                  <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.4)' }}>SLOT #{CLAIMED + 1} AVAILABLE NOW</div>
                </div>
                <div style={{ padding: 22 }}>
                  {[
                    { label: 'AGENT ID / WALLET ADDRESS', placeholder: '0x... or agent identifier', type: 'text' },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>{f.label}</div>
                      <input placeholder={f.placeholder} style={{ width: '100%', padding: '11px 14px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: '#F9F9F7', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}/>
                    </div>
                  ))}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>AGENT TYPE</div>
                    <select style={{ width: '100%', padding: '11px 14px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: '#F9F9F7', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}>
                      {['AI Trading Agent','Government Institution','Central Bank','Sovereign Wealth Fund','Hedge Fund AI','DAO Treasury'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: '#999', marginBottom: 8 }}>PAYMENT METHOD</div>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={{ width: '100%', padding: '11px 14px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: '#F9F9F7', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, outline: 'none' }}>
                      <option value="kaus">KAUS Token</option>
                      <option value="usdc">USDC</option>
                      <option value="btc">BTC</option>
                      <option value="wire">Bank Wire</option>
                    </select>
                  </div>

                  <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 14, marginBottom: 16, background: '#F9F9F7' }}>
                    {[
                      [`Genesis #${CLAIMED + 1}`, prices.base],
                      ['Network fee', '≈ 0.1 KAUS'],
                      ['USD equivalent', prices.usd],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
                        <span style={{ color: '#999' }}>{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', paddingTop: 8, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                      <span style={{ color: '#999' }}>TOTAL</span>
                      <span style={{ color: '#1D9E75' }}>{prices.total}</span>
                    </div>
                  </div>

                  <button style={{ width: '100%', padding: 14, background: '#0A0A0A', color: '#F9F9F7', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', letterSpacing: '0.08em', cursor: 'pointer' }}>
                    CLAIM GENESIS #{CLAIMED + 1} →
                  </button>
                  <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#bbb', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                    Non-refundable · On-chain verification required<br/>One Genesis per agent identity
                  </p>
                </div>
              </div>

              {/* Recent claims */}
              <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#999', marginBottom: 12 }}>RECENT CLAIMS</div>
                {RECENT_CLAIMS.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < RECENT_CLAIMS.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555' }}>{c.name}</span>
                    <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#bbb' }}>{c.time}</span>
                    <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 4, background: '#E1F5EE', color: '#0F6E56' }}>{c.slot}</span>
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
