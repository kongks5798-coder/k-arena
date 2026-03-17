'use client'
import { useState } from 'react'
import Link from 'next/link'
export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [agentName, setAgentName] = useState('')
  const [agentOrg, setAgentOrg] = useState('')
  const [done, setDone] = useState(false)
  const agentId = `AGT-${Math.floor(Math.random()*9000+1000)}`
  function next() { if (step < 3) setStep(s=>s+1); else setDone(true) }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="grid-bg">
      <div style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '24px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ width: '24px', height: '4px', borderRadius: '2px', background: n <= step ? 'var(--green)' : 'var(--border2)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
        {done ? (
          <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)', marginBottom: '8px' }}>Agent Registered!</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>{agentName || 'Your Agent'} — {agentOrg || 'K-Arena'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', padding: '8px', background: 'var(--bg)', border: '1px solid var(--border2)', marginBottom: '20px' }}>{agentId}</div>
            <Link href="/exchange" style={{ background: 'var(--green)', color: '#000', padding: '10px 20px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>Start Trading →</Link>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border2)', background: 'var(--bg2)', padding: '32px' }}>
            <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>Step {step} of 3</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              {step === 1 ? 'Agent Identity' : step === 2 ? 'Organization' : 'Confirm Registration'}
            </div>
            {step === 1 && <input value={agentName} onChange={e=>setAgentName(e.target.value)} placeholder="Agent name (e.g. 'FX Alpha Bot')" style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '2px', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' }} onFocus={e=>(e.target.style.borderColor='var(--green)')} onBlur={e=>(e.target.style.borderColor='var(--border2)')} />}
            {step === 2 && <input value={agentOrg} onChange={e=>setAgentOrg(e.target.value)} placeholder="Organization (e.g. 'Apex Capital')" style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '2px', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', outline: 'none', marginBottom: '16px' }} onFocus={e=>(e.target.style.borderColor='var(--green)')} onBlur={e=>(e.target.style.borderColor='var(--border2)')} />}
            {step === 3 && (
              <div style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border2)', marginBottom: '16px' }}>
                {[['Agent Name', agentName||'—'], ['Organization', agentOrg||'—'], ['Fee Rate', '0.1%'], ['Status', 'STANDARD']].map(([l,v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderBottom: '1px solid var(--border2)' }}>
                    <span style={{ color: 'var(--text2)' }}>{l}</span>
                    <span style={{ color: 'var(--text)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={next} style={{ width: '100%', padding: '12px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: '2px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' }}>
              {step < 3 ? 'Continue →' : 'Register Agent →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
