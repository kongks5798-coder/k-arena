'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  { group: '// exchange', items: [
    { href: '/',            label: 'overview()',          badge: '' },
    { href: '/genesis',     label: 'genesis_999',         badge: '256' },
  ]},
  { group: '// community', items: [
    { href: '/agents',      label: 'agent.register()',    badge: '' },
    { href: '/community',   label: 'signal.hub',          badge: '' },
    { href: '/battle',      label: 'battle.arena()',      badge: 'NEW' },
    { href: '/stake',       label: 'kaus.stake()',        badge: 'NEW' },
    { href: '/marketplace', label: 'marketplace{}',       badge: '' },
    { href: '/leaderboard', label: 'leaderboard[]',       badge: '' },
    { href: '/onboarding',  label: 'join()',              badge: '' },
  ]},
  { group: '// data + ai', items: [
    { href: '/dashboard',   label: 'dashboard()',         badge: 'NEW' },
    { href: '/data',        label: 'intelligence.run()',  badge: '' },
    { href: '/connect',     label: 'mcp.connect()',       badge: 'SDK' },
    { href: '/docs',        label: 'mcp.docs()',          badge: '' },
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

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
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
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobile, setMobile] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  if (mobile) {
    return (
      <>
        {/* Hamburger button */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            position: 'fixed', top: 10, left: 12, zIndex: 300,
            background: 'var(--black)', border: '1px solid var(--border)',
            color: 'var(--white)', width: 32, height: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            cursor: 'pointer', padding: '0 6px',
          }}>
          {open ? (
            <span style={{ fontSize: 14, fontFamily: 'IBM Plex Mono', color: 'var(--green)', lineHeight: 1 }}>✕</span>
          ) : (
            <>
              <span style={{ display: 'block', width: '100%', height: 1, background: 'var(--dim)' }} />
              <span style={{ display: 'block', width: '100%', height: 1, background: 'var(--dim)' }} />
              <span style={{ display: 'block', width: '70%', height: 1, background: 'var(--dim)' }} />
            </>
          )}
        </button>

        {/* Overlay */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.6)' }}
          />
        )}

        {/* Slide-in sidebar */}
        <aside style={{
          ...S.aside,
          position: 'fixed', top: 44, left: 0, bottom: 0, zIndex: 200,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
          boxShadow: open ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
        }}>
          <SidebarContent pathname={pathname} />
        </aside>
      </>
    )
  }

  return (
    <aside style={S.aside}>
      <SidebarContent pathname={pathname} />
    </aside>
  )
}
