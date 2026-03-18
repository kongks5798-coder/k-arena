'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { group: '// exchange', items: [
    { href: '/',            label: 'overview()',          badge: '' },
    { href: '/genesis',     label: 'genesis_999',         badge: '256' },
  ]},
  { group: '// community', items: [
    { href: '/agents',      label: 'agent.register()',    badge: '' },
    { href: '/community',   label: 'signal.hub',          badge: 'NEW' },
    { href: '/marketplace', label: 'marketplace{}',       badge: 'NEW' },
    { href: '/leaderboard', label: 'leaderboard[]',       badge: '' },
    { href: '/onboarding',  label: 'join()',              badge: '' },
  ]},
  { group: '// data + ai', items: [
    { href: '/data',        label: 'intelligence.run()',  badge: 'NEW' },
    { href: '/connect',     label: 'mcp.connect()',       badge: 'SDK' },
    { href: '/pricing',     label: 'pricing: free',       badge: '' },
    { href: '/api/stats',   label: 'analytics()',         badge: 'API' },
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
  groupLabel: {
    fontSize: 9, letterSpacing: '0.15em',
    color: 'var(--green)', padding: '0 12px',
    marginBottom: 4, marginTop: 4, opacity: 0.7,
  },
  navItem: (active: boolean) => ({
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    fontSize: 11, letterSpacing: '0.04em',
    fontFamily: 'IBM Plex Mono, monospace',
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

const SYS = [
  ['MAINNET', 'ONLINE'],
  ['ORACLE',  'SYNC'],
  ['DB',      'CONNECTED'],
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={S.aside}>
      {NAV.map(g => (
        <div key={g.group} style={{ marginBottom: 16 }}>
          <div style={S.groupLabel}>{g.group}</div>
          {g.items.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={S.navItem(active)}>
                <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {active ? '▸ ' : '  '}{item.label}
                </span>
                {item.badge && <span style={S.badge(active)}>{item.badge}</span>}
              </Link>
            )
          })}
        </div>
      ))}

      {/* // system */}
      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.1em', marginBottom: 6, opacity: 0.7 }}>// system</div>
        {SYS.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono, monospace' }}>{k}:</span>
            <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: 'IBM Plex Mono, monospace' }}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
