'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { ASSET_META, formatAmount } from '@/lib/rates'

const CURRENCIES = ['USD', 'KRW', 'EUR', 'JPY', 'GBP', 'CNY', 'KAUS', 'XAU', 'BTC', 'ETH', 'WTI', 'kWh']
const QUICK = [100_000, 1_000_000, 10_000_000, 100_000_000]
const QUICK_LABELS = ['100K', '1M', '10M', '100M']

interface TxResult {
  tx_id: string; from_currency: string; to_currency: string
  input_amount: number; output_amount: number; rate: number
  fee_kaus: number; settlement_ms: number; status: string; timestamp: string
}

export default function ExchangePage() {
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('KRW')
  const [amount, setAmount] = useState(1_000_000)
  const [rates, setRates] = useState<Record<string, { price: number; change24h: number; source: string }>>({})
  const [executing, setExecuting] = useState(false)
  const [lastTx, setLastTx] = useState<TxResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentTxs, setRecentTxs] = useState<TxResult[]>([])

  const fetchRates = useCallback(async () => {
    try {
      const r = await fetch('/api/rates')
      const d = await r.json()
      if (d.ok) setRates(d.rates ?? {})
    } catch {}
  }, [])

  const fetchRecent = useCallback(async () => {
    try {
      const r = await fetch('/api/exchange?limit=10')
      const d = await r.json()
      if (d.ok) setRecentTxs(d.transactions ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchRates()
    fetchRecent()
    const t1 = setInterval(fetchRates, 8000)
    const t2 = setInterval(fetchRecent, 15000)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [fetchRates, fetchRecent])

  // 실시간 계산
  const pairKey = `${from}/${to}`
  const invKey = `${to}/${from}`
  const liveRate = rates[pairKey]?.price ?? (rates[invKey]?.price ? 1 / rates[invKey].price : null)
  const output = liveRate ? amount * liveRate : null
  const fee = amount * 0.001

  const execute = async () => {
    setExecuting(true)
    setError(null)
    try {
      const r = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_currency: from, to_currency: to, input_amount: amount }),
      })
      const d = await r.json()
      if (d.ok) {
        setLastTx(d)
        fetchRecent()
      } else {
        setError(d.error ?? 'Transaction failed')
      }
    } catch (e) {
      setError(String(e))
    }
    setExecuting(false)
  }

  const inp = { width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontSize: 13, fontFamily: 'IBM Plex Mono, monospace', outline: 'none' }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Exchange panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: 12, overflowY: 'auto' }}>
            <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em' }}>FX EXCHANGE</div>

            {/* Pair */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 1fr', gap: 8, alignItems: 'center' }}>
              <div style={{ border: '1px solid var(--border-mid)', padding: 12, background: 'var(--surface)' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 6 }}>FROM</div>
                <select value={from} onChange={e => setFrom(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 4 }}>{ASSET_META[from]?.label} · {ASSET_META[from]?.type}</div>
              </div>
              <button onClick={() => { const t = from; setFrom(to); setTo(t) }} style={{ width: 44, height: 44, border: '1px solid var(--border-mid)', background: 'var(--surface)', color: 'var(--dim)', cursor: 'pointer', fontSize: 16 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}>⇄</button>
              <div style={{ border: '1px solid var(--border-mid)', padding: 12, background: 'var(--surface)' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 6 }}>TO</div>
                <select value={to} onChange={e => setTo(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 4 }}>{ASSET_META[to]?.label} · {ASSET_META[to]?.type}</div>
              </div>
            </div>

            {/* Amount */}
            <div style={{ border: '1px solid var(--border)', padding: 12, background: 'var(--surface)' }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>AMOUNT</div>
              <div style={{ position: 'relative' }}>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} style={{ ...inp, fontSize: 22, fontWeight: 600, paddingRight: 60 }}/>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--dim)' }}>{from}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {QUICK.map((q, i) => (
                  <button key={q} onClick={() => setAmount(q)} style={{ fontSize: 9, padding: '4px 10px', background: amount === q ? 'var(--surface-3)' : 'transparent', border: `1px solid ${amount === q ? 'var(--border-mid)' : 'var(--border)'}`, color: amount === q ? 'var(--white)' : 'var(--dimmer)', cursor: 'pointer' }}>{QUICK_LABELS[i]}</button>
                ))}
              </div>
            </div>

            {/* Output */}
            <div style={{ border: '1px solid var(--border-mid)', padding: 14, background: 'var(--surface)' }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>OUTPUT (ESTIMATED)</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: output ? 'var(--white)' : 'var(--dimmer)', lineHeight: 1 }}>
                {output ? formatAmount(output) : '—'} <span style={{ fontSize: 14, color: 'var(--dim)', fontWeight: 400 }}>{to}</span>
              </div>
              {liveRate && <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 6 }}>RATE: 1 {from} = {liveRate > 1000 ? liveRate.toLocaleString(undefined, { maximumFractionDigits: 2 }) : liveRate.toFixed(6)} {to} · {rates[pairKey]?.source?.toUpperCase() ?? 'ORACLE'}</div>}
            </div>

            {/* Fee breakdown */}
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              {[
                ['RATE SOURCE', liveRate ? (rates[pairKey]?.source ?? 'oracle').toUpperCase() : '—', false],
                ['FEE (0.1%)', `${formatAmount(fee)} ${from}`, false],
                ['EST. SETTLEMENT', '< 1.5s', false],
                ['SLIPPAGE', '< 0.5%', false],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{k}</span>
                  <span style={{ fontSize: 11, color: 'var(--white)', fontFamily: 'IBM Plex Mono' }}>{v}</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ border: '1px solid var(--red)', padding: '10px 12px', background: 'var(--red-dim)', fontSize: 10, color: 'var(--red)' }}>
                ✗ {error}
              </div>
            )}

            {lastTx && (
              <div style={{ border: '1px solid var(--green)', padding: '10px 12px', background: 'var(--green-dim)', fontSize: 10, color: 'var(--green)', lineHeight: 1.7 }}>
                ✓ SETTLED · TX {lastTx.tx_id?.slice(0, 18)}...<br/>
                {formatAmount(lastTx.input_amount)} {lastTx.from_currency} → {formatAmount(lastTx.output_amount)} {lastTx.to_currency} · {lastTx.settlement_ms}ms
              </div>
            )}

            <button onClick={execute} disabled={executing || !liveRate} style={{ width: '100%', padding: 14, background: executing ? 'var(--surface-3)' : !liveRate ? 'var(--surface-2)' : 'var(--white)', color: executing || !liveRate ? 'var(--dimmer)' : 'var(--black)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', cursor: executing || !liveRate ? 'not-allowed' : 'pointer' }}>
              {executing ? 'EXECUTING...' : !liveRate ? 'FETCHING RATE...' : 'EXECUTE EXCHANGE →'}
            </button>
          </div>

          {/* Right: live rates + recent txs */}
          <div style={{ width: 280, borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 10 }}>LIVE RATES</div>
              {Object.entries(rates).slice(0, 10).map(([pair, r]) => (
                <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--white)' }}>{pair}</div>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)' }}>{r.source?.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--white)' }}>
                      {r.price > 1000 ? r.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : r.price.toFixed(r.price > 1 ? 4 : 6)}
                    </div>
                    <div style={{ fontSize: 9, color: (r.change24h ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {(r.change24h ?? 0) >= 0 ? '+' : ''}{r.change24h?.toFixed(2) ?? '0.00'}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 10 }}>RECENT SETTLEMENTS</div>
              {recentTxs.length === 0 ? (
                <div style={{ fontSize: 10, color: 'var(--dimmer)', padding: '12px 0' }}>No transactions yet</div>
              ) : recentTxs.map((tx, i) => (
                <div key={tx.tx_id ?? i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--white)' }}>{tx.from_currency}/{tx.to_currency}</span>
                    <span style={{ fontSize: 11, color: 'var(--dim)' }}>{formatAmount(tx.input_amount ?? 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>{tx.settlement_ms}ms</span>
                    <span style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.06em' }}>SETTLED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
