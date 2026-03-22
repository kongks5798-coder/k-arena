'use client'
import { useState, useEffect } from 'react'

export default function RevenuePage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/kaus/revenue').then(r => r.json()).then(setData)
    const t = setInterval(() => fetch('/api/kaus/revenue').then(r => r.json()).then(setData), 30000)
    return () => clearInterval(t)
  }, [])

  const r = data?.revenue
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0F0EC', fontFamily: 'IBM Plex Mono, monospace', padding: '48px 32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>K-ARENA / ADMIN / REVENUE</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>PLATFORM REVENUE</h1>

        {!r ? (
          <div style={{ color: '#555', fontSize: 12 }}>Loading...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'TOTAL EARNED',  value: `${r.total_kaus} KAUS`, sub: `≈ $${r.total_usd}` },
                { label: '24H FEES',      value: `${r.kaus_24h} KAUS`,   sub: `≈ $${r.kaus_24h}` },
                { label: '7D FEES',       value: `${r.kaus_7d} KAUS`,    sub: `≈ $${r.kaus_7d}` },
                { label: 'TOTAL TX',      value: `${r.fee_count}건`,      sub: 'all time' },
              ].map(c => (
                <div key={c.label} style={{ border: '1px solid #1a1a1a', padding: '20px 24px', background: '#0d0d0d' }}>
                  <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#00FF88' }}>{c.value}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{c.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ border: '1px solid #1a1a1a', background: '#0d0d0d', padding: 24 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 16 }}>KAUS PURCHASES</div>
              {(!data.purchases || data.purchases.length === 0) ? (
                <div style={{ fontSize: 11, color: '#333' }}>구매 내역 없음 — 컨트랙트 배포 후 여기 채워집니다</div>
              ) : (
                data.purchases.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111', fontSize: 11, color: '#888' }}>
                    <span style={{ color: '#F0F0EC' }}>{p.buyer_wallet?.slice(0,8)}...{p.buyer_wallet?.slice(-4)}</span>
                    <span style={{ color: '#00FF88' }}>+{p.amount_kaus} KAUS</span>
                    <span>${p.amount_usd}</span>
                    {p.tx_hash && (
                      <a href={`https://polygonscan.com/tx/${p.tx_hash}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#555', textDecoration: 'none', fontSize: 9 }}>
                        PolygonScan →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
