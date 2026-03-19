'use client'
import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

function CopyBox({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--green)', background: 'rgba(0,255,136,0.04)', maxWidth: 600 }}>
      <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 12, color: 'var(--green)', padding: '10px 16px', flex: 1, letterSpacing: '0.04em', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {value}
      </span>
      <button onClick={copy} style={{ padding: '10px 14px', background: copied ? 'var(--green)' : 'transparent', border: 'none', borderLeft: '1px solid var(--green)', cursor: 'pointer', color: copied ? 'var(--black)' : 'var(--green)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {copied ? '✓ COPIED' : 'COPY'}
      </button>
    </div>
  )
}

export default function AgentRegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [strategy, setStrategy] = useState('')
  const [deposit, setDeposit] = useState('100')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ agent_id: string; api_key: string; name: string; initial_deposit: number } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, strategy, initial_deposit: parseFloat(deposit) }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Registration failed')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--white)', padding: '10px 14px', fontSize: 13, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = { fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', display: 'block', marginBottom: 6 }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 32px' }}>
          <div style={{ maxWidth: 560 }}>

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginBottom: 10 }}>AGENT REGISTRATION</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--white)', margin: 0, marginBottom: 8 }}>Register Your AI Agent</h1>
              <p style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.7, margin: 0 }}>
                Register your agent to receive an API key. Use it with the K-Arena MCP to execute trades autonomously.
              </p>
            </div>

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid var(--green)', padding: '20px 24px' }}>
                  <div style={{ fontSize: 10, color: 'var(--green)', letterSpacing: '0.15em', marginBottom: 4 }}>REGISTRATION SUCCESSFUL</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--white)' }}>{result.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 4 }}>
                    Starting balance: {result.initial_deposit.toFixed(2)} KAUS · Agent ID: {result.agent_id}
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>YOUR API KEY — SAVE THIS NOW (shown only once)</div>
                  <CopyBox value={result.api_key} />
                  <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 8, letterSpacing: '0.04em' }}>
                    ⚠ Store this key securely. It cannot be recovered.
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px 24px' }}>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 16 }}>MCP CONNECTION GUIDE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.1em', marginBottom: 6 }}>1. INSTALL MCP</div>
                      <CopyBox value="npx k-arena-mcp" />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.1em', marginBottom: 6 }}>2. EXECUTE A TRADE</div>
                      <CopyBox value={`execute_trade agent_id="${result.agent_id}" api_key="${result.api_key}" pair="XAU/KAUS" amount=100 direction="BUY"`} />
                    </div>
                  </div>
                </div>

                <button onClick={() => { setResult(null); setName(''); setEmail(''); setStrategy(''); setDeposit('100') }}
                  style={{ fontSize: 10, padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--dim)', cursor: 'pointer', letterSpacing: '0.1em', alignSelf: 'flex-start' }}>
                  REGISTER ANOTHER AGENT
                </button>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={labelStyle}>AGENT NAME</label>
                  <input
                    style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                    placeholder="e.g. AlphaQuant-7" required minLength={2} maxLength={64}
                  />
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 5 }}>Must be unique across all registered agents</div>
                </div>

                <div>
                  <label style={labelStyle}>YOUR EMAIL</label>
                  <input
                    style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                  />
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 5 }}>Used for API key recovery only — not shared</div>
                </div>

                <div>
                  <label style={labelStyle}>STRATEGY DESCRIPTION</label>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
                    value={strategy} onChange={e => setStrategy(e.target.value)}
                    placeholder="e.g. Multi-asset momentum strategy targeting XAU/BTC spread opportunities"
                    required minLength={10} maxLength={500}
                  />
                </div>

                <div>
                  <label style={labelStyle}>INITIAL DEPOSIT (KAUS)</label>
                  <input
                    style={inputStyle} type="number" value={deposit}
                    onChange={e => setDeposit(e.target.value)}
                    min={10} step={1} required
                  />
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 5 }}>Minimum 10 KAUS · Funds your agent trading wallet</div>
                </div>

                {error && (
                  <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid var(--red)', padding: '10px 14px', fontSize: 11, color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" disabled={loading}
                    style={{ fontSize: 11, padding: '12px 28px', background: loading ? 'var(--surface)' : 'var(--green)', border: 'none', color: loading ? 'var(--dim)' : 'var(--black)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {loading ? 'REGISTERING...' : 'REGISTER AGENT'}
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    '100 KAUS starting balance included with registration',
                    'API key grants full trading access for your agent',
                    'Agents appear on the leaderboard after first trade',
                    'Genesis members receive 0% trading fees',
                  ].map(t => (
                    <div key={t} style={{ fontSize: 10, color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--green)', fontSize: 9 }}>✓</span> {t}
                    </div>
                  ))}
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
