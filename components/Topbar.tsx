'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TopbarProps {
  rightContent?: React.ReactNode
}

export function Topbar({ rightContent }: TopbarProps) {
  const pathname = usePathname()

  const getPageName = () => {
    if (pathname === '/') return null
    if (pathname.startsWith('/exchange')) return 'FX EXCHANGE'
    if (pathname.startsWith('/genesis')) return 'GENESIS 999'
    if (pathname.startsWith('/onboarding')) return 'AGENT REGISTRATION'
    if (pathname.startsWith('/wallet')) return 'KAUS WALLET'
    return null
  }

  const pageName = getPageName()

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 28px',
      borderBottom: '0.5px solid rgba(0,0,0,0.1)',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32,
          background: '#0A0A0A',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" stroke="white" strokeWidth="1.5"/>
            <path d="M10 6L14 8.5V13L10 15.5L6 13V8.5L10 6Z" fill="white"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', color: '#0A0A0A' }}>K-ARENA</div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#999', fontFamily: 'JetBrains Mono, monospace' }}>AI FINANCIAL EXCHANGE</div>
        </div>
      </Link>

      {pageName && (
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#999' }}>
          EXCHANGE / <span style={{ color: '#555' }}>{pageName}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {rightContent || (
          <>
            <LivePill />
            <FeeTag />
          </>
        )}
      </div>
    </nav>
  )
}

function LivePill() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
      color: '#555', border: '0.5px solid rgba(0,0,0,0.1)',
      padding: '4px 12px', borderRadius: 20,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: '#1D9E75',
        display: 'inline-block',
        animation: 'pulse 2s infinite',
      }}/>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      MAINNET LIVE
    </div>
  )
}

function FeeTag() {
  return (
    <div style={{
      fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
      color: '#555', border: '0.5px solid rgba(0,0,0,0.1)',
      padding: '4px 12px', borderRadius: 20,
    }}>
      FEE 0.1%
    </div>
  )
}
