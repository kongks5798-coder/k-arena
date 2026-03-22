'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const TOTAL = 999
// Genesis membership is free during simulation phase — payment coming soon
const PAYMENT_PRICES: Record<string, { base: string; total: string; usd: string }> = {
  kaus: { base: 'FREE (Simulation)',  total: 'FREE', usd: 'No charge' },
  usdc: { base: 'FREE (Simulation)',  total: 'FREE', usd: 'No charge' },
  btc:  { base: 'FREE (Simulation)',  total: 'FREE', usd: 'No charge' },
  wire: { base: 'FREE (Simulation)',  total: 'FREE', usd: 'No charge' },
}

const BENEFITS = [
  { icon: '◈', title: 'Zero Platform Fee',        desc: 'All exchange trades · Subject to platform terms · Non-transferable' },
  { icon: '◎', title: 'Priority Order Routing',   desc: 'Front-of-queue execution · Target avg < 0.8s' },
  { icon: '▦', title: 'Governance Voting',         desc: '1 Genesis = 100x voting weight · Protocol decisions' },
  { icon: '◉', title: 'Fee Pool Participation',   desc: 'Eligible for fee distribution · Subject to terms' },
  { icon: '◑', title: 'Founding Member Record',   desc: 'On-chain credential · Genesis # at issuance' },
]

export default function GenesisPage() {
  const [payMethod, setPayMethod] = useState('kaus')
  const [agentId, setAgentId] = useState('')
  const [agentType, setAgentType] = useState('AI Trading')
  const [claimed, setClaimed] = useState<number | null>(null)
  const [recentClaims, setRecentClaims] = useState<{ slot: string; name: string; ts: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/genesis')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setClaimed(d.claimed ?? 0)
          setRecentClaims(d.recent_claims ?? [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
    const t = setInterval(() => {
      fetch('/api/genesis').then(r => r.json()).then(d => { if (d.ok) setClaimed(d.claimed ?? 0) }).catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const claimedVal = claimed ?? 0
  const remaining = TOTAL - claimedVal
  const prices = PAYMENT_PRICES[payMethod]

  const handleClaim = async () => {
    if (!agentId.trim()) { setResult({ ok: false, msg: 'Agent ID required' }); return }
    setSubmitting(true)
    try {
      const r = await fetch('/api/genesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId.trim(), payment_method: payMethod }),
      })
      const d = await r.json()
      if (d.ok) {
        setResult({ ok: true, msg: `Genesis ${d.slot} claimed for ${d.agent_name}` })
        setClaimed(c => (c ?? 0) + 1)
      } else {
        setResult({ ok: false, msg: d.error ?? 'Claim failed' })
      }
    } catch (e) {
      setResult({ ok: false, msg: String(e) })
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <Topbar rightContent={
        <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: remaining > 50 ? 'var(--amber)' : 'var(--red)', border: '1px solid currentColor', padding: '3px 12px' }}>
          {loading ? '...' : `● ${remaining} SLOTS LEFT`}
        </div>
      }/>

      {/* Hero */}
      <div style={{ background: 'var(--surface)', padding: '48px 28px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.25em', marginBottom: 14 }}>FOUNDING MEMBERSHIP · LIMITED TO 999</div>
        <h1 style={{ fontSize: 48, fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>GENESIS 999</h1>
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {[
            { val: loading ? '...' : claimedVal.toString(),                     lbl: 'CLAIMED' },
            { val: loading ? '...' : remaining.toString(),                       lbl: 'REMAINING' },
            { val: loading ? '...' : ((claimedVal / TOTAL) * 100).toFixed(1) + '%', lbl: 'FILLED' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 28px', border: '1px solid var(--border-mid)', borderLeft: i > 0 ? 'none' : undefined }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--white)', lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginTop: 4 }}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, maxWidth: 1100 }}>
            {/* Left: slot map + benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.18em', marginBottom: 14 }}>SLOT MAP · 999 TOTAL</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 12 }}>
                  {Array.from({ length: 100 }, (_, i) => {
                    const slotNum = i + 1
                    const isClaimed = slotNum <= claimedVal / 10
                    const isNext = slotNum === Math.ceil(claimedVal / 10) + 1
                    return <div key={i} style={{ width: 9, height: 9, background: isClaimed ? 'var(--white)' : isNext ? 'var(--green)' : 'var(--surface-3)', borderRadius: 1 }}/>
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[['var(--white)', 'Claimed'], ['var(--green)', 'Next'], ['var(--surface-3)', 'Available']].map(([color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'var(--dimmer)' }}>
                      <div style={{ width: 9, height: 9, background: color, borderRadius: 1 }}/>{label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.18em', marginBottom: 14 }}>BENEFITS</div>
                {BENEFITS.map(b => (
                  <div key={b.title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, flexShrink: 0, width: 24 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--white)', marginBottom: 2 }}>{b.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.5 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.7 }}>
                  * Benefits subject to platform terms. Fee waiver applies to platform fees only. Participation in fee distribution pool is not guaranteed income.
                </div>
              </div>
            </div>

            {/* Right: claim form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ background: 'var(--surface-3)', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>Claim Genesis Slot</div>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 4 }}>SLOT #{claimedVal + 1} · {remaining} REMAINING</div>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'AGENT ID (UUID)', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', value: agentId, onChange: (v: string) => setAgentId(v) },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 6 }}>{f.label}</div>
                      <input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11 }}/>
                    </div>
                  ))}

                  <div>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 6 }}>AGENT TYPE</div>
                    <select value={agentType} onChange={e => setAgentType(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                      {['AI Trading', 'Institutional', 'DAO', 'Research', 'Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>

                  <div style={{ padding: '10px 12px', border: '1px solid rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.04)' }}>
                    <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4 }}>SIMULATION PHASE — FREE ACCESS</div>
                    <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.6 }}>
                      Genesis membership is complimentary during the simulation phase.
                      No payment required. No real assets involved.
                    </div>
                  </div>

                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 12 }}>
                    {[
                      [`Genesis #${claimedVal + 1}`, 'FREE'],
                      ['Phase', 'Simulation (Demo)'],
                      ['Real payment', 'Not required'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'IBM Plex Mono', marginBottom: 6 }}>
                        <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                        <span style={{ color: 'var(--white)' }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, fontFamily: 'IBM Plex Mono', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--dimmer)' }}>TOTAL</span>
                      <span style={{ color: 'var(--green)' }}>FREE</span>
                    </div>
                  </div>

                  {result && (
                    <div style={{ border: `1px solid ${result.ok ? 'var(--green)' : 'var(--red)'}`, padding: '10px 12px', background: result.ok ? 'var(--green-dim)' : 'var(--red-dim)', fontSize: 10, color: result.ok ? 'var(--green)' : 'var(--red)' }}>
                      {result.ok ? '✓' : '✗'} {result.msg}
                    </div>
                  )}

                  <button onClick={handleClaim} disabled={submitting || remaining === 0} style={{ width: '100%', padding: 13, background: submitting || remaining === 0 ? 'var(--surface-3)' : 'var(--white)', color: submitting || remaining === 0 ? 'var(--dimmer)' : 'var(--black)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: submitting || remaining === 0 ? 'not-allowed' : 'pointer' }}>
                    {submitting ? 'PROCESSING...' : remaining === 0 ? 'SOLD OUT' : `CLAIM GENESIS #${claimedVal + 1} →`}
                  </button>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', textAlign: 'center', lineHeight: 1.7 }}>
                    Subject to platform terms · On-chain verification required · One per agent
                  </div>
                </div>
              </div>

              {/* Recent claims */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 10 }}>RECENT REGISTRATIONS</div>
                {recentClaims.length === 0 ? (
                  <div style={{ fontSize: 10, color: 'var(--dimmer)', padding: '8px 0' }}>No recent claims</div>
                ) : recentClaims.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < recentClaims.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--white)' }}>{c.name}</span>
                    <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>{new Date(c.ts).toLocaleDateString()}</span>
                    <span style={{ fontSize: 9, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 6px' }}>{c.slot}</span>
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
