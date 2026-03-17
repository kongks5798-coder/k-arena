'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Rate {
  pair: string; price_usd: number; change_24h: number
}

export default function LiveTicker() {
  const [rates, setRates] = useState<Rate[]>([])
  const [kaus, setKaus] = useState<{ price: number; change: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/api/rates')
        const d = await r.json()
        const allRates: Rate[] = d.rates || []
        setRates(allRates.filter((r: Rate) => r.pair !== 'KAUS/USD').slice(0, 6))
        const kausRate = allRates.find((r: Rate) => r.pair === 'KAUS/USD')
        if (kausRate) setKaus({ price: kausRate.price_usd, change: kausRate.change_24h })
      } catch {}
    }
    load()
    const i = setInterval(load, 10000)
    return () => clearInterval(i)
  }, [])

  const G = 'var(--green)', R = 'var(--red)'

  return (
    <div style={{
      height: '28px', background: 'rgba(0,0,0,0.6)',
      borderBottom: '1px solid rgba(0,255,136,0.08)',
      display: 'flex', alignItems: 'center', overflow: 'hidden',
      fontSize: '10px', fontFamily: 'JetBrains Mono, monospace',
    }}>
      {/* KAUS 고정 표시 */}
      {kaus && (
        <Link href="/chart" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '0 16px', borderRight: '1px solid var(--border2)',
          textDecoration: 'none', flexShrink: 0, height: '100%',
        }}>
          <span style={{ color: G, fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em' }}>KAUS</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>${kaus.price.toFixed(4)}</span>
          <span style={{ color: kaus.change >= 0 ? G : R, fontSize: '9px' }}>
            {kaus.change >= 0 ? '▲' : '▼'}{Math.abs(kaus.change).toFixed(2)}%
          </span>
        </Link>
      )}
      {/* 스크롤 티커 */}
      <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
        <div style={{
          display: 'flex', gap: '0',
          animation: rates.length > 0 ? 'ticker 30s linear infinite' : 'none',
          whiteSpace: 'nowrap',
        }}>
          {[...rates, ...rates].map((r, i) => (
            <Link key={i} href="/exchange" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '0 20px', height: '28px', textDecoration: 'none',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{ color: 'var(--text3)', fontSize: '9px', letterSpacing: '0.05em' }}>{r.pair.split('/')[0]}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                {r.price_usd > 100 ? r.price_usd.toLocaleString() : r.price_usd.toFixed(4)}
              </span>
              <span style={{ color: r.change_24h >= 0 ? G : R, fontSize: '9px' }}>
                {r.change_24h >= 0 ? '+' : ''}{r.change_24h.toFixed(2)}%
              </span>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
