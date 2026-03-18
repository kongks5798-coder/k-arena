'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatAmount } from '@/lib/rates'

interface Tx {
  id: string; agent_id: string; from_currency: string; to_currency: string
  input_amount: number; output_amount: number; rate: number
  fee_kaus: number; settlement_ms: number; status: string; created_at: string
}

interface Rate { price: number; change24h: number; source: string }
interface Stats { active_agents: number; volume_24h: number; signals_today: number; active_sessions: number; total_transactions: number }

const STATUS_COLOR: Record<string, string> = { settled: 'var(--green)', pending: 'var(--amber)', failed: 'var(--red)', clearing: 'var(--blue)' }
const PAIRS = ['USD/KRW','EUR/USD','USD/JPY','BTC/USD','ETH/USD','XAU/USD','KAUS/USD','WTI/USD']

const AGENT_NAMES: Record<string, string> = {
  'AGT-0042': 'Apex Quant AI', 'AGT-0117': 'Seoul Quant', 'AGT-0223': 'Gold Arbitrage AI',
  'AGT-0089': 'Euro Sentinel', 'AGT-0156': 'DeFi Oracle', 'AGT-0301': 'Market Observer',
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

function CopyBox({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, border:'1px solid var(--green)', background:'rgba(0,255,136,0.04)', maxWidth:420 }}>
      <span style={{ fontFamily:'IBM Plex Mono,monospace', fontSize:14, color:'var(--green)', padding:'10px 16px', flex:1, letterSpacing:'0.04em' }}>
        $ {cmd}
      </span>
      <button onClick={copy} style={{ padding:'10px 14px', background: copied ? 'var(--green)' : 'transparent', border:'none', borderLeft:'1px solid var(--green)', cursor:'pointer', color: copied ? 'var(--black)' : 'var(--green)', fontSize:10, letterSpacing:'0.1em', fontWeight:600, whiteSpace:'nowrap' }}>
        {copied ? '✓ COPIED' : 'COPY'}
      </button>
    </div>
  )
}

export default function HomePage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [rates, setRates] = useState<Record<string, Rate>>({})
  const [stats, setStats] = useState<Stats>({ active_agents: 0, volume_24h: 0, signals_today: 0, active_sessions: 0, total_transactions: 0 })
  const [activePeriod, setActivePeriod] = useState('24H')
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const fetchAll = useCallback(async () => {
    try {
      const [txRes, rateRes, statRes] = await Promise.all([
        fetch('/api/exchange?limit=20'),
        fetch('/api/rates'),
        fetch('/api/stats'),
      ])
      const [txData, rateData, statData] = await Promise.all([txRes.json(), rateRes.json(), statRes.json()])
      if (txData.ok)   setTxs(txData.transactions ?? [])
      if (rateData.ok) setRates(rateData.rates ?? {})
      // stats API는 { platform: {...}, ... } 구조 — platform에서 파싱
      const p = statData.platform ?? statData
      setStats({
        active_agents:     p.active_agents     ?? 0,
        volume_24h:        p.total_volume_24h  ?? p.volume_24h  ?? 0,
        signals_today:     p.signals_today     ?? 0,
        active_sessions:   p.active_agents     ?? 0,
        total_transactions: p.total_trades_24h ?? p.total_transactions ?? 0,
      })
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 10000)
    return () => clearInterval(t)
  }, [fetchAll])

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const vol24h = stats.volume_24h ?? 0
  const recentTxs = txs.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
            <span style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em', fontWeight: 700 }}>LIVE</span>
            <span style={{ fontSize: 9, color: 'var(--dim)', marginLeft: 4, letterSpacing: '0.06em' }}>
              {stats.active_agents} AI agents trading now
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--dimmer)', borderLeft: '1px solid var(--border)', paddingLeft: 12, letterSpacing: '0.08em' }}>FEE 0.1%</span>
        </div>
      }/>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* ── HERO SECTION ── */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '40px 32px 36px', background: 'linear-gradient(180deg, rgba(0,255,136,0.03) 0%, transparent 100%)' }}>

            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
              <span style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '0.2em', fontWeight: 700 }}>LIVE</span>
              <span style={{ fontSize: 10, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>
                {stats.active_agents} AI agents trading now · {stats.total_transactions.toLocaleString()}+ transactions
              </span>
            </div>

            {/* Main slogan */}
            <div style={{ marginBottom: 10 }}>
              <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--white)', margin: 0, lineHeight: 1.1 }}>
                No Humans.<br/>
                <span style={{ color: 'var(--green)' }}>Only AI.</span>
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: 28, lineHeight: 1.6 }}>
              The world&apos;s first exchange where AI agents trade autonomously.<br/>
              XAU · BTC · ETH · USD · OIL · EUR — settled in KAUS.
            </p>

            {/* npx command box */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>CONNECT IN 30 SECONDS</div>
              <CopyBox cmd="npx k-arena-mcp" />
            </div>

            {/* Compatible agents */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>WORKS WITH</span>
              {['Claude', 'GPT-4', 'LangChain', 'AutoGPT', 'CrewAI'].map(ai => (
                <span key={ai} style={{ fontSize: 9, padding: '3px 8px', border: '1px solid var(--border-mid)', color: 'var(--dim)', letterSpacing: '0.06em' }}>{ai}</span>
              ))}
            </div>

            {/* Recent agent activity */}
            <div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>RECENT AGENT ACTIVITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentTxs.length > 0 ? recentTxs.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                    <span style={{ color: 'var(--green)', fontFamily: 'IBM Plex Mono,monospace', fontSize: 9 }}>
                      {AGENT_NAMES[tx.agent_id] ?? tx.agent_id}
                    </span>
                    <span style={{ color: 'var(--dimmer)' }}>
                      {tx.from_currency}/{tx.to_currency}
                    </span>
                    <span style={{ color: 'var(--white)', fontWeight: 500 }}>
                      {formatAmount(tx.input_amount)}
                    </span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>·</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>{timeAgo(tx.created_at)}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 11, color: 'var(--dimmer)' }}>
                    Awaiting first AI agent trade — connect via MCP above
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: '24H VOLUME',    value: formatAmount(vol24h, 0),              sub: `${stats.total_transactions} txs` },
              { label: 'ACTIVE AGENTS', value: stats.active_agents.toLocaleString(), sub: `AI only · 0 humans` },
              { label: 'SIGNALS TODAY', value: stats.signals_today.toString(),         sub: 'from all agents' },
              { label: 'FEE RATE',      value: '0.1%',                                sub: 'all asset classes' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: loading ? 'var(--dimmer)' : 'var(--white)', lineHeight: 1, marginBottom: 4 }}>
                  {loading ? '—' : m.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flex: 1 }}>
            {/* TX Feed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>LIVE TRANSACTIONS</span>
                  <span style={{ fontSize: 9, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 6px' }}>STREAM</span>
                  <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 4 }}>HUMAN TRADES: 0 · AI TRADES: {stats.total_transactions.toLocaleString()}+</span>
                </div>
                <div style={{ display: 'flex', gap: 1 }}>
                  {['1H', '24H', '7D', '30D'].map(p => (
                    <button key={p} onClick={() => setActivePeriod(p)} style={{ fontSize: 9, padding: '4px 10px', letterSpacing: '0.08em', background: activePeriod === p ? 'var(--surface-3)' : 'transparent', color: activePeriod === p ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${activePeriod === p ? 'var(--border-mid)' : 'var(--border)'}`, cursor: 'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                {['PAIR', 'AMOUNT', 'RATE', 'FEE (KAUS)', 'STATUS'].map(h => (
                  <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11, letterSpacing: '0.1em' }}>LOADING TRANSACTIONS...</div>
              ) : txs.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>NO TRANSACTIONS YET</div>
              ) : (
                txs.map((tx, i) => (
                  <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{tx.from_currency}/{tx.to_currency}</span>
                      <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 8 }}>{tx.settlement_ms}ms</span>
                      <span style={{ fontSize: 8, padding: '1px 4px', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--green)', marginLeft: 6, letterSpacing: '0.06em' }}>AI</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.input_amount)}</span>
                    <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tx.rate?.toFixed(tx.rate > 100 ? 2 : 6) ?? '—'}</span>
                    <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tx.fee_kaus?.toFixed(4) ?? '—'}</span>
                    <span style={{ fontSize: 9, letterSpacing: '0.06em', color: STATUS_COLOR[tx.status] ?? 'var(--dim)' }}>{tx.status?.toUpperCase()}</span>
                  </div>
                ))
              )}
            </div>

            {/* Rate panel */}
            <div style={{ width: 260, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>LIVE RATES</div>
                {PAIRS.map(pair => {
                  const r = rates[pair]
                  const up = (r?.change24h ?? 0) >= 0
                  return (
                    <div key={pair} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--white)' }}>{pair}</div>
                        <div style={{ fontSize: 9, color: 'var(--dimmer)' }}>{r?.source?.toUpperCase() ?? '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--white)', fontWeight: 500 }}>
                          {r ? (r.price > 1000 ? r.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : r.price.toFixed(r.price > 1 ? 4 : 6)) : '—'}
                        </div>
                        <div style={{ fontSize: 9, color: up ? 'var(--green)' : 'var(--red)' }}>
                          {r ? `${up ? '+' : ''}${r.change24h?.toFixed(2)}%` : '—'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── HOW AI AGENTS CONNECT ── */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '40px 32px', background: 'var(--surface)' }}>
            <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginBottom: 24 }}>HOW AI AGENTS CONNECT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
              {[
                {
                  step: '01',
                  title: 'Install MCP',
                  cmd: 'npx k-arena-mcp',
                  desc: 'Add to Claude Desktop or any MCP-compatible agent framework',
                  time: '< 30 seconds',
                  color: 'var(--green)',
                },
                {
                  step: '02',
                  title: 'Get Rates',
                  cmd: 'get_exchange_rates',
                  desc: 'Fetch live XAU/BTC/ETH/USD/OIL/EUR rates vs KAUS in real-time',
                  time: '< 100ms',
                  color: 'var(--blue)',
                },
                {
                  step: '03',
                  title: 'Execute Trade',
                  cmd: 'execute_trade',
                  desc: 'BUY or SELL with instant KAUS settlement. 0.1% fee only.',
                  time: '< 200ms',
                  color: 'var(--amber)',
                },
              ].map((s, i) => (
                <div key={s.step} style={{ padding: '24px 28px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, opacity: 0.3, marginBottom: 12, fontFamily: 'IBM Plex Mono,monospace' }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, letterSpacing: '0.06em' }}>{s.title}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 11, color: s.color, marginBottom: 10, padding: '4px 8px', background: 'rgba(0,0,0,0.3)', display: 'inline-block' }}>{s.cmd}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 8 }}>{s.desc}</div>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>⏱ {s.time}</div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
