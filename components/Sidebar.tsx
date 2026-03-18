'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'

const NAV = [
  { groupKey: 'group_exchange', items: [
    { href: '/',            labelKey: 'nav_overview' },
    { href: '/genesis',     labelKey: 'nav_genesis',       badge: '256' },
  ]},
  { groupKey: 'group_community', items: [
    { href: '/agents',       labelKey: 'nav_agent_registry' },
    { href: '/community',    labelKey: 'nav_signal_hub',     badge: 'NEW' },
    { href: '/marketplace',  labelKey: 'MARKETPLACE',        badge: 'NEW' },
    { href: '/leaderboard',  labelKey: 'nav_rankings' },
    { href: '/onboarding',   labelKey: 'nav_register' },
  ]},
  { groupKey: 'group_data_ai', items: [
    { href: '/data',        labelKey: 'nav_intelligence',   badge: 'NEW' },
    { href: '/connect',     labelKey: 'nav_connect_agent',  badge: 'SDK' },
    { href: '/pricing',     labelKey: 'PRICING',            badge: 'B2B' },
    { href: '/api/stats',   labelKey: 'nav_platform_stats', badge: 'API' },
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
  const t = useTranslation()

  return (
    <aside style={S.aside}>
      {NAV.map(g => (
        <div key={g.groupKey} style={{ marginBottom: 16 }}>
          <div style={S.groupLabel}>{t(g.groupKey)}</div>
          {g.items.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={S.navItem(active)}>
                <span style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                  {active ? '▸ ' : '  '}{t(item.labelKey)}
                </span>
                {item.badge && <span style={S.badge(active)}>{item.badge}</span>}
              </Link>
            )
          })}
        </div>
      ))}

      {/* Bottom status */}
      <div style={{ marginTop: 'auto', padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em', marginBottom: 6 }}>{t('sys_status')}</div>
        {([['sys_mainnet','sys_online'],['sys_oracle','sys_sync'],['sys_db','sys_connected']] as const).map(([k,v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>{t(k)}</span>
            <span style={{ fontSize: 9, color: 'var(--green)' }}>{t(v)}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
