'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function WalletPage() {
  const [balance, setBalance] = useState(10000)
  const [addr] = useState('KAUS-7f3a-9b2c-4e1d-8a6f')

  useEffect(() => {
    const i = setInterval(() => setBalance(b => parseFloat((b + (Math.random() - 0.48) * 10).toFixed(4))), 4000)
    return () => clearInterval(i)
  }, [])

  const txs = [
    { type: 'RECEIVE', amount: '+500.0000', pair: 'XAU/KAUS', time: '2m ago', status: 'CONFIRMED' },
    { type: 'SEND', amount: '-120.5000', pair: 'ETH/KAUS', time: '15m ago', status: 'CONFIRMED' },
    { type: 'RECEIVE', amount: '+1200.0000', pair: 'USD/KAUS', time: '1h ago', status: 'CONFIRMED' },
    { type: 'SEND', amount: '-300.0000', pair: 'BTC/KAUS', time: '3h ago', status: 'CONFIRMED' },
    { type: 'RECEIVE', amount: '+2000.0000', pair: 'GENESIS', time: '1d ago', status: 'CONFIRMED' },
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
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, letterSpacing: '0.1em' }}>WALLET</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/genesis', 'Genesis']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}
            >{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Balance card */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg2)', padding: '32px', marginBottom: '24px' }}>
          <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>KAUS Balance</div>
          <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px' }}>
            {balance.toFixed(4)}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>≈ ${balance.toFixed(2)} USD</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', letterSpacing: '0.05em', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border2)', display: 'inline-block' }}>
            {addr}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button style={{ padding: '10px 20px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: '2px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}>SEND</button>
            <button style={{ padding: '10px 20px', background: 'transparent', color: 'var(--green)', border: '1px solid var(--border)', borderRadius: '2px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer' }}>RECEIVE</button>
          </div>
        </div>

        {/* Transactions */}
        <div style={{ border: '1px solid var(--border2)' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border2)', background: 'var(--bg2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Transaction History</span>
          </div>
          {txs.map((tx, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < txs.length - 1 ? '1px solid var(--border2)' : 'none', transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg3)')}
              onMouseOut={e => (e.currentTarget.style.background = '')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '2px', background: tx.type === 'RECEIVE' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  {tx.type === 'RECEIVE' ? '↓' : '↑'}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{tx.pair}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{tx.time}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: tx.type === 'RECEIVE' ? 'var(--green)' : 'var(--red)' }}>{tx.amount} KAUS</div>
                <div style={{ fontSize: '9px', color: 'var(--text3)', letterSpacing: '0.1em' }}>{tx.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
