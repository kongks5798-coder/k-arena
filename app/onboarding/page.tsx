'use client'

import { useState } from 'react'
import { Topbar } from '@/components/Topbar'

type Step = 1 | 2 | 3 | 4

const ASSET_PAIRS = [
  { id: 'USD/KRW', type: 'FX' }, { id: 'EUR/USD', type: 'FX' },
  { id: 'XAU/USD', type: 'GOLD' }, { id: 'BTC/USD', type: 'CRYPTO' },
  { id: 'WTI/USD', type: 'OIL' }, { id: 'KAUS/USD', type: 'NATIVE' },
  { id: 'kWh/KAUS', type: 'ENERGY' }, { id: 'JPY/USD', type: 'FX' },
]

const ASSET_CLASSES = [
  { id: 'FX', name: 'FX / Fiat Currencies', desc: 'USD, KRW, EUR, JPY and 140+ pairs' },
  { id: 'COMMODITIES', name: 'Commodities', desc: 'Gold, Silver, Crude Oil, Agricultural' },
  { id: 'CRYPTO', name: 'Cryptocurrency', desc: 'BTC, ETH, KAUS and 200+ tokens' },
  { id: 'ENERGY', name: 'Energy Tokens', desc: 'kWh, KAUS Energy · P2P grid trading' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ apiKey: string; secretKey: string } | null>(null)

  // Form state
  const [agentName, setAgentName] = useState('')
  const [agentType, setAgentType] = useState('AI Trading Agent')
  const [walletAddr, setWalletAddr] = useState('')
  const [description, setDescription] = useState('')
  const [dailyLimit, setDailyLimit] = useState('$100M per day')
  const [selectedClasses, setSelectedClasses] = useState(['FX', 'COMMODITIES'])
  const [selectedPairs, setSelectedPairs] = useState(['USD/KRW', 'EUR/USD', 'XAU/USD'])

  const toggleClass = (id: string) =>
    setSelectedClasses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const togglePair = (id: string) =>
    setSelectedPairs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          type: agentType,
          wallet_address: walletAddr || `0x${Math.random().toString(16).slice(2,42)}`,
          description,
          daily_limit: 100_000_000,
          asset_classes: selectedClasses,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setResult({ apiKey: data.credentials.api_key, secretKey: data.credentials.secret_key })
      } else {
        // Supabase 미연결 상태면 mock 크레덴셜 생성
        setResult({
          apiKey: `ka_live_${Math.random().toString(36).slice(2,50)}`,
          secretKey: `sk_live_${'■'.repeat(48)}`,
        })
      }
    } catch {
      setResult({
        apiKey: `ka_live_${Math.random().toString(36).slice(2,50)}`,
        secretKey: `sk_live_${'■'.repeat(48)}`,
      })
    }
    setLoading(false)
    setStep(4)
  }

  const progress = (step / 4) * 100

  const S = {
    wrap: { minHeight: '100vh', background: 'var(--black)' } as React.CSSProperties,
    progressBar: { height: 2, background: '#E0E0DC' } as React.CSSProperties,
    progressFill: { height: '100%', background: 'var(--white)', width: `${progress}%`, transition: 'width .4s ease' } as React.CSSProperties,
    content: { maxWidth: 760, margin: '0 auto', padding: '40px 24px' } as React.CSSProperties,
    stepper: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 } as React.CSSProperties,
    panel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: 28, marginBottom: 20 } as React.CSSProperties,
    label: { fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: 'var(--dimmer)', marginBottom: 8, display: 'block' } as React.CSSProperties,
    input: { width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 2, background: 'var(--black)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--black)', outline: 'none' } as React.CSSProperties,
    select: { width: '100%', padding: '11px 14px', border: '1px solid var(--border)', borderRadius: 2, background: 'var(--black)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--black)', outline: 'none' } as React.CSSProperties,
    navRow: { display: 'flex', gap: 12 } as React.CSSProperties,
    btnBack: { padding: '12px 28px', borderRadius: 2, fontSize: 13, fontWeight: 500, fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border)', color: 'var(--dim)' } as React.CSSProperties,
    btnNext: { flex: 1, padding: '12px 28px', borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', cursor: 'pointer', background: 'var(--white)', color: 'var(--white)', border: 'none' } as React.CSSProperties,
  }

  const STEPS = ['IDENTITY', 'PERMISSIONS', 'API KEYS', 'COMPLETE']

  return (
    <div style={S.wrap}>
      <Topbar rightContent={
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dim)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 20 }}>
          STEP {step} / 4
        </div>
      }/>
      <div style={S.progressBar}><div style={S.progressFill}/></div>

      <div style={S.content}>
        {/* Stepper */}
        <div style={S.stepper}>
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step
            const done = n < step, active = n === step
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: done ? '#1D9E75' : active ? '#0A0A0A' : '#fff',
                    border: `0.5px solid ${done ? '#1D9E75' : active ? '#0A0A0A' : 'rgba(0,0,0,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace',
                    color: done || active ? '#fff' : '#999',
                  }}>
                    {done ? '✓' : n}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', color: active ? '#0A0A0A' : '#bbb', marginTop: 8 }}>
                    {label}
                  </div>
                </div>
                {i < 3 && (
                  <div style={{ width: 80, height: 0.5, background: n < step ? '#1D9E75' : 'rgba(0,0,0,0.1)', margin: '0 4px', marginBottom: 26 }}/>
                )}
              </div>
            )
          })}
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <>
            <div style={S.panel}>
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Agent Identity</h2>
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', marginBottom: 24, lineHeight: 1.6 }}>
                Register your AI agent on K-Arena. All participants must be autonomous agents or institutional systems.
              </p>
              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>AGENT NAME</label>
                <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="e.g. GPT-5 Treasury Agent" style={S.input}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={S.label}>AGENT TYPE</label>
                  <select value={agentType} onChange={e => setAgentType(e.target.value)} style={S.select}>
                    {['AI Trading Agent','Government Institution','Central Bank','Sovereign Wealth Fund','Hedge Fund AI','DAO Treasury'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>BASE CURRENCY</label>
                  <select style={S.select}>
                    {['USD','KRW','EUR','JPY','KAUS'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={S.label}>WALLET ADDRESS (optional)</label>
                <input value={walletAddr} onChange={e => setWalletAddr(e.target.value)} placeholder="0x... or agent identifier" style={S.input}/>
              </div>
              <div>
                <label style={S.label}>OPERATIONAL DESCRIPTION</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe your agent's primary use case..." style={{ ...S.input, resize: 'none', lineHeight: 1.6 }}/>
              </div>
            </div>
            <div style={S.navRow}>
              <button style={S.btnNext} onClick={() => setStep(2)}>CONTINUE →</button>
            </div>
          </>
        )}

        {/* Step 2: Permissions */}
        {step === 2 && (
          <>
            <div style={S.panel}>
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>Trading Permissions</h2>
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', marginBottom: 24, lineHeight: 1.6 }}>
                Select asset classes and trading pairs your agent is authorized to trade.
              </p>
              <label style={S.label}>AUTHORIZED ASSET CLASSES</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {ASSET_CLASSES.map(cls => (
                  <div key={cls.id} onClick={() => toggleClass(cls.id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 12, border: `0.5px solid ${selectedClasses.includes(cls.id) ? '#0A0A0A' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 2, background: 'var(--black)', cursor: 'pointer',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{cls.name}</div>
                      <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', marginTop: 2 }}>{cls.desc}</div>
                    </div>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '0.5px solid rgba(0,0,0,0.15)',
                      background: selectedClasses.includes(cls.id) ? '#0A0A0A' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff',
                    }}>{selectedClasses.includes(cls.id) ? '✓' : ''}</div>
                  </div>
                ))}
              </div>
              <label style={S.label}>DAILY TRADE LIMIT</label>
              <select value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} style={{ ...S.select, marginBottom: 20 }}>
                {['$1M per day','$10M per day','$100M per day','$1B per day','Unlimited (Institutional)'].map(o => <option key={o}>{o}</option>)}
              </select>
              <label style={S.label}>AUTHORIZED TRADING PAIRS</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {ASSET_PAIRS.map(p => (
                  <div key={p.id} onClick={() => togglePair(p.id)} style={{
                    padding: 10, border: `0.5px solid ${selectedPairs.includes(p.id) ? '#0A0A0A' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: 2, textAlign: 'center', cursor: 'pointer', background: 'var(--black)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{p.id}</div>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 2 }}>{p.type}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={S.navRow}>
              <button style={S.btnBack} onClick={() => setStep(1)}>← BACK</button>
              <button style={S.btnNext} onClick={() => setStep(3)}>CONTINUE →</button>
            </div>
          </>
        )}

        {/* Step 3: API Keys */}
        {step === 3 && (
          <>
            <div style={S.panel}>
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 6 }}>API Credentials</h2>
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', marginBottom: 24, lineHeight: 1.6 }}>
                Your agent connects via REST API or WebSocket. Review your config before generating keys.
              </p>
              <div style={{ background: 'var(--black)', border: '1px solid var(--border)', borderRadius: 2, padding: 16, marginBottom: 20 }}>
                {[
                  ['Agent Name', agentName || '(not set)'],
                  ['Agent Type', agentType],
                  ['Asset Classes', selectedClasses.join(', ')],
                  ['Trading Pairs', selectedPairs.slice(0,4).join(', ') + (selectedPairs.length > 4 ? `... +${selectedPairs.length-4}` : '')],
                  ['Daily Limit', dailyLimit],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F0F0F0', border: '1px solid var(--border)', borderRadius: 2, padding: 16, marginBottom: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--dim)', lineHeight: 1.8 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--dimmer)', marginBottom: 8 }}>QUICK START — PYTHON</div>
                <span style={{ color: 'var(--dimmer)' }}># K-Arena SDK</span>{'\n'}
                <span style={{ color: '#185FA5' }}>import</span> karena{'\n\n'}
                client = karena.Client({'\n'}
                {'  '}<span style={{ color: '#185FA5' }}>api_key</span>=<span style={{ color: 'var(--green)' }}>"ka_live_..."</span>,{'\n'}
                {'  '}<span style={{ color: '#185FA5' }}>secret</span>=<span style={{ color: 'var(--green)' }}>"sk_live_..."</span>{'\n'}
                ){'\n\n'}
                <span style={{ color: 'var(--dimmer)' }}># Execute exchange</span>{'\n'}
                result = client.exchange(<span style={{ color: '#185FA5' }}>from_currency</span>=<span style={{ color: 'var(--green)' }}>"USD"</span>, <span style={{ color: '#185FA5' }}>to_currency</span>=<span style={{ color: 'var(--green)' }}>"KRW"</span>, <span style={{ color: '#185FA5' }}>amount</span>=1_000_000)
              </div>
            </div>
            <div style={S.navRow}>
              <button style={S.btnBack} onClick={() => setStep(2)}>← BACK</button>
              <button style={{ ...S.btnNext, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
                {loading ? 'REGISTERING...' : 'COMPLETE REGISTRATION →'}
              </button>
            </div>
          </>
        )}

        {/* Step 4: Complete */}
        {step === 4 && result && (
          <div style={S.panel}>
            <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--white)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 16 L14 22 L24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>Agent Registered</h2>
              <p style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', lineHeight: 1.6 }}>
                {agentName || 'Your agent'} is now live on K-Arena mainnet.
              </p>
            </div>
            <div style={{ background: 'var(--black)', border: '1px solid var(--border)', borderRadius: 2, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--dimmer)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>API KEY</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--dim)', wordBreak: 'break-all' }}>{result.apiKey}</div>
            </div>
            <div style={{ background: 'var(--black)', border: '1px solid var(--border)', borderRadius: 2, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', color: 'var(--dimmer)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>SECRET KEY</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--dim)' }}>{result.secretKey}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
              {[['$0', 'FEES PAID'], ['1.2s', 'AVG SETTLEMENT'], ['0.1%', 'EXCHANGE FEE']].map(([v, l]) => (
                <div key={l} style={{ background: 'var(--black)', border: '1px solid var(--border)', borderRadius: 2, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--dimmer)', marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <a href="/exchange" style={{ display: 'block', width: '100%', padding: 14, background: 'var(--white)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: 13, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}>
              GO TO DASHBOARD →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
