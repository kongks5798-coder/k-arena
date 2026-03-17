'use client'
import { useState, useEffect, useRef } from 'react'

interface Tx {
  id: number | string; agent_id: string; agent_name?: string
  pair: string; amount: number; direction: string; fee: number; created_at: string
}

interface TxFeedProps {
  maxItems?: number
  compact?: boolean
  pair?: string
}

function ago(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const s = Math.floor(d / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function fmt(n: number) {
  return n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M`
    : n >= 1000 ? `$${(n / 1000).toFixed(1)}K`
    : `$${n.toFixed(0)}`
}

export default function TxFeed({ maxItems = 20, compact = false, pair }: TxFeedProps) {
  const [txs, setTxs] = useState<Tx[]>([])
  const [newIds, setNewIds] = useState<Set<string | number>>(new Set())
  const prevIds = useRef<Set<string | number>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        const url = pair
          ? `/api/transactions?limit=${maxItems}&pair=${encodeURIComponent(pair)}`
          : `/api/transactions?limit=${maxItems}`
        const r = await fetch(url)
        const d = await r.json()
        const incoming: Tx[] = d.transactions || []

        // 새로 들어온 TX 감지 (플래시 효과)
        const newSet = new Set<string | number>()
        incoming.forEach(tx => {
          if (!prevIds.current.has(tx.id)) newSet.add(tx.id)
        })
        if (newSet.size > 0) {
          setNewIds(newSet)
          setTimeout(() => setNewIds(new Set()), 1000)
        }
        prevIds.current = new Set(incoming.map(t => t.id))
        setTxs(incoming)
      } catch {}
    }
    load()
    const i = setInterval(load, 3000)
    return () => clearInterval(i)
  }, [maxItems, pair])

  const G = 'var(--green)', R = 'var(--red)'

  if (compact) return (
    <div style={{ overflow: 'hidden' }}>
      {txs.slice(0, 8).map((tx, i) => (
        <div key={tx.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 16px', borderBottom: '1px solid var(--border2)',
          background: newIds.has(tx.id) ? 'rgba(0,255,136,0.05)' : '',
          transition: 'background 0.5s', animation: i === 0 && newIds.has(tx.id) ? 'slideIn 0.3s ease' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '2px',
              background: tx.direction === 'BUY' ? 'rgba(0,255,136,0.12)' : 'rgba(255,51,102,0.12)',
              color: tx.direction === 'BUY' ? G : R,
              border: `1px solid ${tx.direction === 'BUY' ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)'}`,
            }}>{tx.direction}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{tx.pair}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>{fmt(tx.amount)}</div>
            <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{ago(tx.created_at)}</div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ overflow: 'hidden' }}>
      <style>{`@keyframes slideIn { from { transform: translateY(-8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      {/* 헤더 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1.5fr 1fr',
        padding: '8px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)',
      }}>
        {['Pair', 'Side', 'Agent', 'Amount', 'Time'].map(h => (
          <span key={h} style={{ fontSize: '9px', color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</span>
        ))}
      </div>
      {txs.map((tx, i) => (
        <div key={tx.id} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 2fr 1.5fr 1fr',
          padding: '9px 16px', borderBottom: '1px solid var(--border2)',
          background: newIds.has(tx.id) ? 'rgba(0,255,136,0.04)' : '',
          transition: 'background 0.6s',
          animation: i === 0 && newIds.has(tx.id) ? 'slideIn 0.25s ease' : 'none',
        }}
          onMouseOver={e => (e.currentTarget.style.background = 'var(--bg3)')}
          onMouseOut={e => (e.currentTarget.style.background = newIds.has(tx.id) ? 'rgba(0,255,136,0.04)' : '')}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{tx.pair}</span>
          <span>
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '2px',
              background: tx.direction === 'BUY' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)',
              color: tx.direction === 'BUY' ? G : R,
              border: `1px solid ${tx.direction === 'BUY' ? 'rgba(0,255,136,0.25)' : 'rgba(255,51,102,0.25)'}`,
            }}>{tx.direction}</span>
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.agent_name || tx.agent_id}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>{fmt(tx.amount)}</span>
          <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{ago(tx.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
