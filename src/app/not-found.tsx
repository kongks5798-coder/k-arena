'use client'
import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }} className="grid-bg">
      <div>
        <div style={{ fontSize: '80px', fontWeight: 800, color: 'var(--green)', opacity: 0.2, letterSpacing: '-0.05em', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginTop: '16px', marginBottom: '8px' }}>Page Not Found</div>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '24px' }}>This route doesn&apos;t exist on K-Arena.</div>
        <Link href="/" style={{ background: 'var(--green)', color: '#000', padding: '10px 20px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </div>
    </div>
  )
}
