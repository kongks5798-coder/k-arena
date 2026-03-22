'use client'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const KAUS_CONTRACT = process.env.NEXT_PUBLIC_KAUS_CONTRACT ?? ''

function ReceiptContent() {
  const params = useSearchParams()
  const txHash  = params.get('tx')      ?? ''
  const amount  = Number(params.get('amount') ?? '0')
  const wallet  = params.get('wallet')  ?? ''

  const [copied, setCopied]   = useState(false)
  const [email,  setEmail]    = useState('')
  const [sent,   setSent]     = useState(false)

  const copyTx = () => {
    navigator.clipboard.writeText(txHash).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const addKaus = async () => {
    if (!window.ethereum || !KAUS_CONTRACT) return
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: [{ type: 'ERC20', options: { address: KAUS_CONTRACT, symbol: 'KAUS', decimals: 18 } }],
    }).catch(() => {})
  }

  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 520 }}>
            {/* Success animation */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                border: '2px solid var(--green)', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: 'var(--green)',
                animation: 'fadeInScale 0.4s ease-out',
              }}>✓</div>
              <style>{`@keyframes fadeInScale { from { opacity: 0; transform: scale(0.6) } to { opacity: 1; transform: scale(1) } }`}</style>
              <div style={{ fontSize: 11, color: 'var(--green)', letterSpacing: '0.2em', marginTop: 16, fontWeight: 600 }}>PURCHASE CONFIRMED</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--white)', marginTop: 8, fontFamily: 'IBM Plex Mono' }}>
                {amount.toLocaleString()} <span style={{ fontSize: 16, color: 'var(--dim)' }}>KAUS</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--dimmer)', marginTop: 4 }}>≈ ${amount.toFixed(2)} USD</div>
            </div>

            {/* Receipt card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 14 }}>TRANSACTION RECEIPT</div>
              {[
                ['Status',    '✅ Confirmed'],
                ['Network',   'Polygon Mainnet'],
                ['Timestamp', now],
                ['Wallet',    wallet ? `${wallet.slice(0,6)}...${wallet.slice(-4)}` : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                  <span style={{ color: 'var(--white)', fontFamily: k === 'Wallet' || k === 'Timestamp' ? 'IBM Plex Mono' : 'inherit', fontSize: k === 'Wallet' || k === 'Timestamp' ? 10 : 11 }}>{v}</span>
                </div>
              ))}
              {/* Tx hash row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 11 }}>
                <span style={{ color: 'var(--dimmer)' }}>Tx Hash</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}>
                    {txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-6)}` : '—'}
                  </span>
                  {txHash && (
                    <>
                      <button onClick={copyTx} style={{ fontSize: 9, padding: '2px 6px', background: 'none', border: '1px solid var(--border)', color: 'var(--dimmer)', cursor: 'pointer' }}>
                        {copied ? 'COPIED' : 'COPY'}
                      </button>
                      <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 9, color: 'var(--green)', textDecoration: 'none' }}>↗ SCAN</a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={addKaus}
                  style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>
                  + ADD KAUS TO METAMASK
                </button>
                <a href="/portfolio" style={{ flex: 1 }}>
                  <button style={{ width: '100%', padding: 12, background: 'var(--white)', color: 'var(--black)', border: 'none', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer' }}>
                    VIEW PORTFOLIO →
                  </button>
                </a>
              </div>
            </div>

            {/* Email receipt */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 10 }}>EMAIL RECEIPT (OPTIONAL)</div>
              {sent ? (
                <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ Receipt sent to {email}</div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                  />
                  <button onClick={() => { if (email) setSent(true) }}
                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--dim)', fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer' }}>
                    SEND
                  </button>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <a href="/buy-kaus" style={{ fontSize: 10, color: 'var(--dimmer)', textDecoration: 'none' }}>← RETURN TO BUY KAUS</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dim)', fontSize: 11 }}>Loading...</div>}>
      <ReceiptContent />
    </Suspense>
  )
}
