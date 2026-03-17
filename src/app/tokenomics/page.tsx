'use client'
import Link from 'next/link'
export default function TokenomicsPage() {
  const dist = [
    { label: 'Community Rewards', pct: 40, color: 'var(--green)' },
    { label: 'Team & Advisors', pct: 20, color: 'var(--blue)' },
    { label: 'Ecosystem Fund', pct: 20, color: 'var(--yellow)' },
    { label: 'Genesis 999', pct: 10, color: '#ff6600' },
    { label: 'Treasury Reserve', pct: 10, color: 'var(--text2)' },
  ]
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, letterSpacing: '0.1em' }}>TOKENOMICS</span>
        </div>
        <Link href="/" style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: 'var(--green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>KAUS Token Economy</div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '12px' }}>Total Supply: 1,000,000,000</h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>KAUS is the native settlement token of K-Arena. All trades, fees, rewards, and governance use KAUS.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ border: '1px solid var(--border2)', padding: '24px', background: 'var(--bg2)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Distribution</div>
            {dist.map(d => (
              <div key={d.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text)' }}>{d.label}</span>
                  <span style={{ color: d.color, fontWeight: 600 }}>{d.pct}%</span>
                </div>
                <div style={{ height: '4px', background: 'var(--bg)', borderRadius: '2px' }}>
                  <div style={{ width: `${d.pct}%`, height: '100%', background: d.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ border: '1px solid var(--border2)', padding: '24px', background: 'var(--bg2)' }}>
            <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Key Metrics</div>
            {[['Total Supply', '1,000,000,000 KAUS'], ['Circulating', '100,000,000 KAUS'], ['Current Price', '$1.00 USD'], ['Market Cap', '$100,000,000'], ['Vesting', '4yr, 1yr cliff'], ['Network', 'KAUS Mainnet']].map(([l,v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border2)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text2)' }}>{l}</span>
                <span style={{ color: 'var(--green)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
