'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Pair { pair: string; price: number; change: number; vol: number }

function fmt(n: number) {
  if (n >= 1000000) return `$${(n/1000000).toFixed(2)}M`
  if (n >= 1000) return `$${(n/1000).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export default function ExchangePage() {
  const [pairs, setPairs] = useState<Pair[]>([])
  const [selected, setSelected] = useState<Pair | null>(null)
  const [amount, setAmount] = useState('1000')
  const [direction, setDirection] = useState<'BUY'|'SELL'>('BUY')
  const [executed, setExecuted] = useState(false)

  const fetchPairs = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      const json = await res.json()
      setPairs(json.pairs || [])
      if (!selected && json.pairs?.length) setSelected(json.pairs[0])
    } catch {}
  }, [selected])

  useEffect(() => {
    fetchPairs()
    const i = setInterval(fetchPairs, 5000)
    return () => clearInterval(i)
  }, [fetchPairs])

  function handleExecute() {
    setExecuted(true)
    setTimeout(() => setExecuted(false), 3000)
  }

  const kausAmount = selected ? (parseFloat(amount || '0') / selected.price).toFixed(4) : '0'
  const fee = (parseFloat(amount || '0') * 0.001).toFixed(2)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, letterSpacing: '0.1em' }}>EXCHANGE</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {[['/', 'Dashboard'], ['/agents', 'Agents'], ['/genesis', 'Genesis'], ['/connect', 'Connect']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}
            >{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* Left: market list */}
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Market Overview</h1>
            <p style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>Real-time prices. 0.1% fee. KAUS settlement.</p>
          </div>
          <div style={{ border: '1px solid var(--border2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr', padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)' }}>
              {['Pair', 'Price', 'Change', 'Volume'].map(h => (
                <span key={h} style={{ fontSize: '9px', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>
            {pairs.map((pair, i) => (
              <div key={i} onClick={() => setSelected(pair)} style={{
                display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr',
                padding: '16px', borderBottom: '1px solid var(--border2)', cursor: 'pointer',
                background: selected?.pair === pair.pair ? 'var(--bg3)' : '',
                borderLeft: selected?.pair === pair.pair ? '2px solid var(--green)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => { if (selected?.pair !== pair.pair) e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseOut={e => { if (selected?.pair !== pair.pair) e.currentTarget.style.background = '' }}
              >
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>{pair.pair}</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text)' }}>
                  {pair.price > 1000 ? pair.price.toLocaleString() : pair.price.toFixed(pair.price > 10 ? 2 : 4)}
                </span>
                <span style={{ fontSize: '12px', color: pair.change >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                  {pair.change >= 0 ? '▲ +' : '▼ '}{pair.change.toFixed(2)}%
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{pair.vol.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: trade panel */}
        <div style={{ border: '1px solid var(--border2)', background: 'var(--bg2)', position: 'sticky', top: '72px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>Trading Pair</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>{selected?.pair || 'Select a pair'}</div>
            {selected && (
              <div style={{ fontSize: '13px', color: selected.change >= 0 ? 'var(--green)' : 'var(--red)', marginTop: '2px' }}>
                {selected.price.toFixed(selected.price > 10 ? 2 : 4)} {selected.change >= 0 ? '▲' : '▼'} {Math.abs(selected.change).toFixed(2)}%
              </div>
            )}
          </div>

          {/* BUY/SELL tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <button onClick={() => setDirection('BUY')} style={{
              padding: '12px', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
              background: direction === 'BUY' ? 'rgba(0,255,136,0.1)' : 'transparent',
              color: direction === 'BUY' ? 'var(--green)' : 'var(--text2)',
              borderBottom: direction === 'BUY' ? '2px solid var(--green)' : '2px solid var(--border2)',
              transition: 'all 0.15s',
            }}>BUY</button>
            <button onClick={() => setDirection('SELL')} style={{
              padding: '12px', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
              background: direction === 'SELL' ? 'rgba(255,51,102,0.1)' : 'transparent',
              color: direction === 'SELL' ? 'var(--red)' : 'var(--text2)',
              borderBottom: direction === 'SELL' ? '2px solid var(--red)' : '2px solid var(--border2)',
              transition: 'all 0.15s',
            }}>SELL</button>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Amount (USD)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--bg)',
                  border: '1px solid var(--border2)', borderRadius: '2px',
                  color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px', fontWeight: 500, outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--green)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border2)')}
                placeholder="1000"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              {[
                ['You Receive', `${kausAmount} KAUS`],
                ['Fee (0.1%)', `$${fee}`],
                ['Settlement', 'Instant'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text3)' }}>{l}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            {executed ? (
              <div style={{ padding: '12px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '2px', textAlign: 'center', fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>
                ✓ Trade Executed Successfully
              </div>
            ) : (
              <button onClick={handleExecute} style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '2px', cursor: 'pointer',
                background: direction === 'BUY' ? 'var(--green)' : 'var(--red)',
                color: direction === 'BUY' ? '#000' : '#fff',
                fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.15s',
              }}
                onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={e => (e.currentTarget.style.transform = '')}
              >
                {direction} {selected?.pair?.split('/')[0] || 'Asset'}
              </button>
            )}

            <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
              KAUS Network · Instant Settlement · 0.1% fee
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
