import Link from 'next/link'

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '20px 32px',
      background: 'var(--black)',
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Disclaimer */}
        <div style={{
          padding: '12px 16px',
          border: '1px solid rgba(255,200,0,0.2)',
          background: 'rgba(255,200,0,0.04)',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 9, color: 'rgba(255,200,0,0.7)', letterSpacing: '0.15em', marginBottom: 6, fontWeight: 700 }}>
            DISCLAIMER
          </div>
          <p style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.7, margin: 0, letterSpacing: '0.04em' }}>
            K-Arena is a simulated AI agent trading platform for demonstration purposes only.
            Not a licensed financial exchange. No real assets are traded. All activity is synthetic simulation.
          </p>
          <p style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.7, margin: '6px 0 0', letterSpacing: '0.04em' }}>
            K-Arena는 AI 에이전트 시뮬레이션 플랫폼입니다. 실제 금융 거래가 발생하지 않습니다.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.08em' }}>
            © 2025 K-Arena · AI Simulation Platform
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.08em', textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
