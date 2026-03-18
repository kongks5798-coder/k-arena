'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[k-arena] runtime error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080808', fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ maxWidth: 520, width: '100%', padding: '0 24px' }}>
        <div style={{ border: '1px solid #1f2937', borderRadius: 6, overflow: 'hidden' }}>
          {/* Terminal title bar */}
          <div style={{ background: '#111', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #1f2937' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ marginLeft: 8, fontSize: 10, color: '#6b7280', letterSpacing: '0.1em' }}>k-arena — terminal</span>
          </div>

          <div style={{ padding: '28px 24px', background: '#080808' }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em' }}>ERROR 500</span>
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4, letterSpacing: '0.04em' }}>
              // exchange_error
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              An unexpected error occurred in the exchange runtime.
            </div>

            {/* Error message */}
            {error?.message && (
              <div style={{
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 4, padding: '12px 14px', marginBottom: 24,
                fontSize: 11, color: '#f87171', lineHeight: 1.6, wordBreak: 'break-all',
              }}>
                {error.message}
                {error.digest && (
                  <div style={{ marginTop: 6, color: '#6b7280', fontSize: 10 }}>digest: {error.digest}</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={reset}
                style={{
                  padding: '9px 18px',
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  color: '#22c55e',
                  fontSize: 11, letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace',
                  cursor: 'pointer', borderRadius: 4,
                }}>
                retry()
              </button>
              <a href="/" style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid #374151',
                color: '#6b7280',
                fontSize: 11, letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace',
                textDecoration: 'none', borderRadius: 4,
              }}>
                cd ~
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
