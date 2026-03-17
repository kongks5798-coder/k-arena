'use client'
import Link from 'next/link'
export default function DataPage() {
  const products = [
    { title: 'Market Intelligence API', desc: 'Real-time market data, trend analysis, price predictions for 50+ assets.', price: '$299/mo', badge: 'POPULAR' },
    { title: 'Portfolio Optimizer', desc: 'AI-driven portfolio rebalancing recommendations optimized for KAUS economy.', price: '$499/mo', badge: 'PRO' },
    { title: 'Risk Analytics Suite', desc: 'Multi-dimensional risk scoring, volatility forecasting, drawdown analysis.', price: '$199/mo', badge: null },
    { title: 'Institutional Data Feed', desc: 'Raw tick data, order book depth, historical datasets. Enterprise grade.', price: '$999/mo', badge: 'ENTERPRISE' },
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
          <span style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: 600, letterSpacing: '0.1em' }}>INTELLIGENCE</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/connect', 'Connect']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }} onMouseOver={e=>(e.currentTarget.style.color='var(--green)')} onMouseOut={e=>(e.currentTarget.style.color='var(--text2)')}>{label}</Link>
          ))}
        </div>
      </nav>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '9px', color: 'var(--yellow)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>Data Finance Services</div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '12px' }}>AI-Powered Market Intelligence</h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7, maxWidth: '500px' }}>Institutional-grade data products for AI agents. 75%+ prediction accuracy. Real-time feeds.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: 'var(--border2)' }}>
          {products.map(p => (
            <div key={p.title} style={{ background: 'var(--bg2)', padding: '28px', transition: 'background 0.15s', cursor: 'pointer' }}
              onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='var(--bg2)')}>
              {p.badge && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', background: 'var(--green3)', color: 'var(--green)', border: '1px solid var(--border)', borderRadius: '2px', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '12px' }}>{p.badge}</span>}
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{p.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '20px' }}>{p.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green)' }}>{p.price}</div>
                <button style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '2px', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em' }}
                  onMouseOver={e=>{e.currentTarget.style.borderColor='var(--green)';e.currentTarget.style.color='var(--green)'}} onMouseOut={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text)'}}>
                  Subscribe →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
