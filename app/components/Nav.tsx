'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/exchange', label: 'Exchange' },
  { href: '/orderbook', label: 'Orderbook' },
  { href: '/chart', label: 'Chart' },
  { href: '/agents', label: 'Agents' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/community', label: 'Signals' },
  { href: '/genesis', label: 'Genesis' },
]

const MORE_ITEMS = [
  { href: '/data', label: 'AI Intel' },
  { href: '/tokenomics', label: 'Tokenomics' },
  { href: '/buy-kaus', label: 'Buy KAUS' },
  { href: '/onboarding', label: 'Onboard' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/search', label: 'Search' },
  { href: '/docs', label: 'API Docs' },
  { href: '/connect', label: 'Connect' },
]

interface LiveStats { kaus_price: number; active_agents: number; kaus_change_24h: number }

export default function Nav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [stats, setStats] = useState<LiveStats | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/stats')
        const d = await r.json()
        setStats({
          kaus_price: d.platform?.kaus_price || 1.0,
          active_agents: d.platform?.active_agents || 0,
          kaus_change_24h: d.platform?.kaus_change_24h || 0,
        })
      } catch {}
    }
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const G = 'var(--green)'
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <>
      <nav style={{
        height: '52px', borderBottom: '1px solid var(--border2)',
        background: 'rgba(3,5,8,0.97)', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px', gap: '12px',
      }}>
        {/* 로고 */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '30px', height: '30px', background: G, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
          <span style={{ fontWeight: 700, fontSize: '13px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, overflowX: 'auto' }} className="hide-mobile">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} style={{
              padding: '5px 10px', borderRadius: '2px', fontSize: '11px', fontWeight: isActive(item.href) ? 600 : 400,
              color: isActive(item.href) ? G : 'var(--text2)', textDecoration: 'none', whiteSpace: 'nowrap',
              background: isActive(item.href) ? 'rgba(0,255,136,0.08)' : 'transparent',
              border: isActive(item.href) ? '1px solid rgba(0,255,136,0.15)' : '1px solid transparent',
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { if (!isActive(item.href)) e.currentTarget.style.color = 'var(--text)' }}
              onMouseOut={e => { if (!isActive(item.href)) e.currentTarget.style.color = 'var(--text2)' }}>
              {item.label}
            </Link>
          ))}

          {/* More 드롭다운 */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMoreOpen(!moreOpen)} style={{
              padding: '5px 10px', borderRadius: '2px', fontSize: '11px', fontWeight: 400,
              color: 'var(--text2)', background: 'transparent', border: '1px solid transparent',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.15s',
            }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseOut={e => { if (!moreOpen) e.currentTarget.style.color = 'var(--text2)' }}>
              More ▾
            </button>
            {moreOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setMoreOpen(false)} />
                <div style={{
                  position: 'absolute', top: '100%', left: 0, zIndex: 99, marginTop: '4px',
                  background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: '2px',
                  minWidth: '140px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                  {MORE_ITEMS.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} style={{
                      display: 'block', padding: '9px 14px', fontSize: '11px',
                      color: isActive(item.href) ? G : 'var(--text2)', textDecoration: 'none',
                      borderBottom: '1px solid var(--border2)', transition: 'background 0.1s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--text)' }}
                      onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = isActive(item.href) ? G : 'var(--text2)' }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 라이브 스탯 (데스크탑) */}
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }} className="hide-mobile">
            <div style={{ fontSize: '10px', textAlign: 'right' }}>
              <span style={{ color: 'var(--text3)', marginRight: '4px' }}>KAUS</span>
              <span style={{ color: G, fontWeight: 700 }}>${stats.kaus_price.toFixed(4)}</span>
              <span style={{ color: stats.kaus_change_24h >= 0 ? G : 'var(--red)', marginLeft: '4px', fontSize: '9px' }}>
                {stats.kaus_change_24h >= 0 ? '+' : ''}{stats.kaus_change_24h.toFixed(2)}%
              </span>
            </div>
            <Link href="/onboarding" style={{
              padding: '6px 12px', background: G, color: '#000', borderRadius: '2px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
            }}>
              Connect →
            </Link>
          </div>
        )}

        {/* 모바일 햄버거 */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="show-mobile" style={{
          background: 'none', border: '1px solid var(--border2)', borderRadius: '2px',
          padding: '6px 10px', cursor: 'pointer', color: 'var(--text)', fontSize: '14px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="show-mobile" style={{
          position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0, zIndex: 90,
          background: 'rgba(3,5,8,0.98)', borderTop: '1px solid var(--border2)',
          overflowY: 'auto',
        }}>
          {[...NAV_ITEMS, ...MORE_ITEMS].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '14px 24px', fontSize: '13px',
              color: isActive(item.href) ? G : 'var(--text)', textDecoration: 'none',
              borderBottom: '1px solid var(--border2)', fontWeight: isActive(item.href) ? 600 : 400,
            }}>
              {item.label}
            </Link>
          ))}
          {stats && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border2)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>
                KAUS: <span style={{ color: G, fontWeight: 700 }}>${stats.kaus_price.toFixed(4)}</span>
                <span style={{ color: stats.kaus_change_24h >= 0 ? G : 'var(--red)', marginLeft: '8px' }}>
                  {stats.kaus_change_24h >= 0 ? '+' : ''}{stats.kaus_change_24h.toFixed(2)}%
                </span>
              </div>
              <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{
                display: 'block', padding: '12px', background: G, color: '#000', borderRadius: '2px',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', textAlign: 'center',
              }}>
                Connect Agent →
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .hide-mobile { display: flex !important; } .show-mobile { display: none !important; } }
        @media (max-width: 767px) { .hide-mobile { display: none !important; } .show-mobile { display: flex !important; } }
      `}</style>
    </>
  )
}
