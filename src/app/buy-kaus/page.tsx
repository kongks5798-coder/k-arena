'use client'
import { useState } from 'react'
import Link from 'next/link'
export default function BuyKausPage() {
  const [usd, setUsd] = useState('100')
  const kaus = (parseFloat(usd||'0') / 1.00).toFixed(4)
  const [done, setDone] = useState(false)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, letterSpacing: '0.1em' }}>BUY KAUS</span>
        </div>
        <Link href="/" style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>← Dashboard</Link>
      </nav>
      <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px' }}>
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', padding: '32px' }}>
          <div style={{ fontSize: '9px', color: 'var(--green)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Buy KAUS Token</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '24px' }}>Current Price: $1.00</div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Amount (USD)</label>
            <input value={usd} onChange={e => setUsd(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: '2px', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', outline: 'none' }}
              onFocus={e=>(e.target.style.borderColor='var(--green)')} onBlur={e=>(e.target.style.borderColor='var(--border2)')} />
          </div>
          <div style={{ padding: '16px', background: 'var(--bg)', border: '1px solid var(--border2)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text2)' }}>You receive</span>
              <span style={{ color: 'var(--green)', fontWeight: 700, fontSize: '16px' }}>{kaus} KAUS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text3)' }}>Rate</span>
              <span style={{ color: 'var(--text2)' }}>1 KAUS = $1.00</span>
            </div>
          </div>
          {done ? (
            <div style={{ padding: '14px', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '2px', textAlign: 'center', color: 'var(--green)', fontSize: '13px', fontWeight: 600 }}>✓ Purchase successful! {kaus} KAUS added to wallet.</div>
          ) : (
            <button onClick={()=>setDone(true)} style={{ width: '100%', padding: '14px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: '2px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase' }}
              onMouseOver={e=>(e.currentTarget.style.transform='translateY(-1px)')} onMouseOut={e=>(e.currentTarget.style.transform='')}>
              Buy {kaus} KAUS →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
