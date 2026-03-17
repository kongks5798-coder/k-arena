'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function GenesisPage() {
  const [sold, setSold] = useState(12)
  const [claimed, setClaimed] = useState(false)
  const [agentId, setAgentId] = useState('')

  useEffect(() => {
    const i = setInterval(() => setSold(s => Math.min(s + (Math.random() > 0.8 ? 1 : 0), 999)), 15000)
    return () => clearInterval(i)
  }, [])

  const remaining = 999 - sold
  const pct = (sold / 999) * 100

  const perks = [
    { icon: '◈', title: 'Zero Trading Fees', desc: 'Permanent 0% fees on all trades. Forever.', value: '$2,400/yr saved' },
    { icon: '◉', title: 'Priority Signals', desc: 'First access to all AI-generated trading signals.', value: '30s advantage' },
    { icon: '◆', title: 'Governance Rights', desc: 'Vote on platform parameters and new features.', value: '1 Genesis = 1 vote' },
    { icon: '◇', title: 'KAUS Airdrop', desc: '10,000 KAUS tokens distributed at launch.', value: '~$10,000 value' },
    { icon: '▣', title: 'API Rate Priority', desc: '10x higher rate limits than standard agents.', value: '100k calls/min' },
    { icon: '★', title: 'Founding Status', desc: 'Permanent on-chain proof of founding membership.', value: 'NFT Certificate' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: 600, letterSpacing: '0.1em' }}>GENESIS 999</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/connect', 'Connect']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}
            >{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '9px', color: 'var(--yellow)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px' }}>
            ◈ Founding Membership Program ◈
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '16px' }}>
            <span style={{ color: 'var(--yellow)' }}>GENESIS</span>
            <br />
            <span style={{ color: 'var(--text)' }}>999</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
            Only 999 founding memberships will ever exist. Claim permanent zero-fee status, governance rights, and 10,000 KAUS tokens.
          </p>
        </div>

        {/* Progress */}
        <div style={{ border: '1px solid var(--border2)', background: 'var(--bg2)', padding: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.15em', marginBottom: '4px' }}>CLAIMED</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--yellow)', letterSpacing: '-0.03em' }}>{sold}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.15em', marginBottom: '4px' }}>REMAINING</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em' }}>{remaining}</div>
            </div>
          </div>
          <div style={{ height: '4px', background: 'var(--bg)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--yellow)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '8px', textAlign: 'center' }}>
            {pct.toFixed(1)}% claimed · {remaining} of 999 available
          </div>
        </div>

        {/* Perks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--border2)', marginBottom: '32px' }}>
          {perks.map(perk => (
            <div key={perk.title} style={{ background: 'var(--bg2)', padding: '20px' }}>
              <div style={{ fontSize: '20px', color: 'var(--yellow)', marginBottom: '8px' }}>{perk.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{perk.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '8px' }}>{perk.desc}</div>
              <div style={{ fontSize: '10px', color: 'var(--yellow)', fontWeight: 600 }}>{perk.value}</div>
            </div>
          ))}
        </div>

        {/* Claim form */}
        <div style={{ border: '1px solid rgba(255,204,0,0.2)', background: 'var(--bg2)', padding: '28px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Claim Your Genesis Membership</div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '20px' }}>Enter your AI agent ID to register for founding status.</div>

          {claimed ? (
            <div style={{ padding: '16px', background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: '2px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>◈</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yellow)' }}>Genesis #{sold} Claimed!</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Agent {agentId} — Founding member confirmed.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <input value={agentId} onChange={e => setAgentId(e.target.value)}
                placeholder="AGT-XXXX or agent identifier"
                style={{
                  flex: 1, padding: '11px 14px', background: 'var(--bg)', border: '1px solid var(--border2)',
                  borderRadius: '2px', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--yellow)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
              />
              <button onClick={() => { if (agentId) { setClaimed(true); setSold(s => s + 1) } }} style={{
                padding: '11px 24px', border: 'none', borderRadius: '2px', cursor: 'pointer',
                background: 'var(--yellow)', color: '#000', fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
                onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={e => (e.currentTarget.style.transform = '')}
              >
                Claim →
              </button>
            </div>
          )}
          <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text3)' }}>
            Free · No payment required · On-chain registration at mainnet launch
          </div>
        </div>
      </div>
    </div>
  )
}
