'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { group: 'EXCHANGE', items: [
    { href: '/',           label: 'OVERVIEW' },
    { href: '/exchange',   label: 'FX EXCHANGE',   badge: 'LIVE' },
    { href: '/genesis',    label: 'GENESIS 999',   badge: '256' },
    { href: '/wallet',     label: 'KAUS WALLET' },
  ]},
  { group: 'COMMUNITY', items: [
    { href: '/agents',     label: 'AGENT REGISTRY' },
    { href: '/community',  label: 'SIGNAL HUB',    badge: 'NEW' },
    { href: '/leaderboard',label: 'RANKINGS' },
    { href: '/onboarding', label: 'REGISTER' },
  ]},
  { group: 'DATA & AI', items: [
    { href: '/data',       label: 'INTELLIGENCE',  badge: 'NEW' },
    { href: '/connect',    label: 'CONNECT AGENT', badge: 'SDK' },
    { href: '/tokenomics', label: 'TOKENOMICS' },
    { href: '/buy-kaus',   label: 'BUY KAUS',      badge: '\$' },
    { href: '/api/rates',  label: 'PRICE ORACLE',  badge: 'API' },
    { href: '/api/stats',  label: 'PLATFORM STATS',badge: 'API' },
  ]},
]

const S = {
  aside: {
    width: 220, flexShrink: 0,
    borderRight: '1px solid var(--border)',
    background: 'var(--black)',
    overflowY: 'auto' as const,
    padding: '16px 0',
    display: 'flex', flexDirection: 'column' as const,
  },
  kausBox: {
    margin: '0 12px 20px',
    border: '1px solid var(--border-mid)',
    borderRadius: 2,
    padding: '12px',
    background: 'var(--surface)',
  },
  groupLabel: {
    fontSize: 9, letterSpacing: '0.2em',
    color: 'var(--dimmer)', padding: '0 12px',
    marginBottom: 4, marginTop: 4,
  },
  navItem: (active: boolean) => ({
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    fontSize: 11, letterSpacing: '0.06em',
    color: active ? 'var(--white)' : 'var(--dim)',
    background: active ? 'var(--surface-3)' : 'transparent',
    borderLeft: active ? '2px solid var(--green)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.1s',
    textDecoration: 'none',
  }),
  badge: (active: boolean) => ({
    fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
    color: active ? 'var(--green)' : 'var(--dimmer)',
    letterSpacing: '0.05em',
  }),
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={S.aside}>
      {/* KAUS price */}
      <div style={S.kausBox}>
        <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 6 }}>KAUS/USD</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--white)', lineHeight: 1, marginBottom: 4 }}>1.00</div>
        <div style={{ fontSize: 10, color: 'var(--green)' }}>+3.24% ↑</div>
        <svg width="100%" height="28" viewBox="0 0 180 28" style={{ marginTop: 10, display: 'block' }}>
          <polyline points="0,22 20,18 40,20 60,14 80,12 100,10 120,13 140,7 160,5 180,3" fill="none" stroke="var(--green)" strokeWidth="1" opacity="0.6"/>
        </svg>
      </div>

      {NAV.map(g => (
        <div key={g.group} style={{ marginBottom: 16 }}>
          <div style={S.groupLabel}>{g.group}</div>
          {g.items.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={S.navItem(active)}>
                <span style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                  {active ? '▸ ' : '  '}{item.label}
                </span>
                {item.badge && <span style={S.badge(active)}>{item.badge}</span>}
              </Link>
            )
          })}
        </div>
      ))}

      {/* Bottom status */}
      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em', marginBottom: 6 }}>SYS STATUS</div>
        {[['MAINNET','ONLINE'],['ORACLE','SYNC'],['DB','CONNECTED']].map(([k,v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>{k}</span>
            <span style={{ fontSize: 9, color: 'var(--green)' }}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
