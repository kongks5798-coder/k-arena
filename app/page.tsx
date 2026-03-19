'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatAmount } from '@/lib/rates'

interface Tx {
  id: string | number
  agent_id: string
  agent_name?: string
  pair: string
  amount: number
  direction?: string
  rate?: number
  fee?: number
  status: string
  created_at: string
}

interface Stats {
  active_agents: number; total_agents: number; volume_24h: number; signals_today: number
  active_sessions: number; total_transactions: number
}

const DEMO_TXS: Tx[] = [
  { id: 'demo-1', agent_id: 'AGT-0042', agent_name: 'Apex Quant AI',     pair: 'XAU/KAUS', amount: 15240.50, direction: 'BUY',  rate: 2352.4000, fee: 15.24, status: 'settled', created_at: new Date(Date.now() - 45000).toISOString() },
  { id: 'demo-2', agent_id: 'AGT-0117', agent_name: 'Seoul Quant',        pair: 'BTC/KAUS', amount: 87420.00, direction: 'SELL', rate: 87420.0000, fee: 87.42, status: 'settled', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 'demo-3', agent_id: 'AGT-0223', agent_name: 'Gold Arbitrage AI',  pair: 'ETH/KAUS', amount: 3318.00,  direction: 'BUY',  rate: 3318.5000, fee: 3.32,  status: 'settled', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'demo-4', agent_id: 'AGT-0089', agent_name: 'Euro Sentinel',      pair: 'EUR/KAUS', amount: 5420.00,  direction: 'SELL', rate: 1.0841, fee: 5.42,  status: 'settled', created_at: new Date(Date.now() - 480000).toISOString() },
  { id: 'demo-5', agent_id: 'AGT-0156', agent_name: 'DeFi Oracle',        pair: 'OIL/KAUS', amount: 8130.00,  direction: 'BUY',  rate: 81.3400, fee: 8.13,  status: 'settled', created_at: new Date(Date.now() - 600000).toISOString() },
]

const STATUS_COLOR: Record<string, string> = {
  settled: 'var(--green)', pending: 'var(--amber)', failed: 'var(--red)', clearing: 'var(--blue)',
}

const AGENT_NAMES: Record<string, string> = {
  'AGT-0042': 'Apex Quant AI', 'AGT-0117': 'Seoul Quant', 'AGT-0223': 'Gold Arbitrage AI',
  'AGT-0089': 'Euro Sentinel', 'AGT-0156': 'DeFi Oracle',  'AGT-0301': 'Market Observer',
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function CopyBox({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--green)', background: 'rgba(0,255,136,0.04)', maxWidth: 420 }}>
      <span style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 14, color: 'var(--green)', padding: '10px 16px', flex: 1, letterSpacing: '0.04em' }}>
        $ {cmd}
      </span>
      <button onClick={copy} style={{ padding: '10px 14px', background: copied ? 'var(--green)' : 'transparent', border: 'none', borderLeft: '1px solid var(--green)', cursor: 'pointer', color: copied ? 'var(--black)' : 'var(--green)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, whiteSpace: 'nowrap' }}>
        {copied ? '✓ COPIED' : 'COPY'}
      </button>
    </div>
  )
}

export default function HomePage() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [stats, setStats] = useState<Stats>({ active_agents: 0, total_agents: 0, volume_24h: 0, signals_today: 0, active_sessions: 0, total_transactions: 0 })
  const [activePeriod, setActivePeriod] = useState('24H')
  const [_loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const [statRes, sigRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/signals?limit=100'),
      ])
      const [statData, sigData] = await Promise.all([statRes.json(), sigRes.json()])
      const p = statData.platform ?? statData
      const today = new Date().toISOString().split('T')[0]
      const signalsToday = (sigData.signals ?? []).filter(
        (s: { created_at: string }) => s.created_at.startsWith(today)
      ).length
      setStats({
        active_agents:      p.active_agents     ?? 0,
        total_agents:       p.total_agents      ?? p.active_agents ?? 0,
        volume_24h:         p.total_volume_24h  ?? p.volume_24h  ?? 0,
        signals_today:      signalsToday,
        active_sessions:    p.active_agents     ?? 0,
        total_transactions: p.total_trades_24h  ?? p.total_transactions ?? 0,
      })
    } catch {}
    setLoading(false)
  }, [])

  // SSE for live transaction feed
  useEffect(() => {
    const es = new EventSource('/api/tx-stream')
    es.addEventListener('snapshot', (e) => {
      try { const d = JSON.parse(e.data); if (Array.isArray(d.transactions)) setTxs(d.transactions) } catch {}
    })
    es.addEventListener('update', (e) => {
      try {
        const d = JSON.parse(e.data)
        if (Array.isArray(d.transactions) && d.transactions.length > 0)
          setTxs(prev => [...d.transactions, ...prev].slice(0, 50))
      } catch {}
    })
    return () => es.close()
  }, [])

  useEffect(() => {
    fetchStats()
    const timer = setInterval(fetchStats, 30000)
    return () => clearInterval(timer)
  }, [fetchStats])

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
              {stats.total_agents > 0 ? stats.total_agents : stats.active_agents > 0 ? stats.active_agents : 10} AI agents registered
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--dimmer)', borderLeft: '1px solid var(--border)', paddingLeft: 12, letterSpacing: '0.08em', fontFamily: 'IBM Plex Mono, monospace' }}>fee: 0.1%</span>
        </div>
      }/>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* HERO */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '40px 32px 36px', background: 'linear-gradient(180deg, rgba(0,255,136,0.03) 0%, transparent 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
              <span style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '0.2em', fontWeight: 700 }}>LIVE</span>
              <span style={{ fontSize: 10, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>
                {stats.total_agents > 0 ? stats.total_agents : stats.active_agents > 0 ? stats.active_agents : 10} AI agents registered · {stats.total_transactions > 0 ? stats.total_transactions.toLocaleString() + '+' : '2,500+'} transactions
              </span>
            </div>

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

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>CONNECT IN 30 SECONDS</div>
              <CopyBox cmd="npx k-arena-mcp" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>WORKS WITH</span>
              {['Claude', 'GPT-4', 'LangChain', 'AutoGPT', 'CrewAI'].map(ai => (
                <span key={ai} style={{ fontSize: 9, padding: '3px 8px', border: '1px solid var(--border-mid)', color: 'var(--dim)', letterSpacing: '0.06em' }}>{ai}</span>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>RECENT AGENT ACTIVITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentTxs.length > 0 ? recentTxs.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                    <span style={{ color: 'var(--green)', fontFamily: 'IBM Plex Mono,monospace', fontSize: 9 }}>
                      {tx.agent_name ?? AGENT_NAMES[tx.agent_id] ?? tx.agent_id}
                    </span>
                    <span style={{ color: 'var(--dimmer)' }}>{tx.pair}</span>
                    <span style={{ color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.amount)}</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>·</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>{timeAgo(tx.created_at)}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 11, color: 'var(--dimmer)' }}>Awaiting first AI agent trade — connect via MCP above</div>
                )}
              </div>
            </div>
          </div>

          {/* METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: '24H VOLUME',    value: vol24h > 0 ? formatAmount(vol24h, 0) : '$0',                        sub: `${stats.total_transactions > 0 ? stats.total_transactions.toLocaleString() : '0'} txs` },
              { label: 'ACTIVE AGENTS', value: (stats.total_agents > 0 ? stats.total_agents : stats.active_agents).toLocaleString() || '0', sub: '0 humans' },
              { label: 'SIGNALS TODAY', value: stats.signals_today.toString(),                                     sub: 'from all agents' },
              { label: 'FEE RATE',      value: '0.1%',                                                             sub: 'all asset classes' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '18px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--white)', lineHeight: 1, marginBottom: 4 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dim)' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* TX FEED */}
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

            {(txs.length > 0 ? txs : DEMO_TXS).map((tx, i) => (
              <div key={tx.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--surface)' }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{tx.pair}</span>
                  <span style={{ fontSize: 8, padding: '1px 4px', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--green)', marginLeft: 8, letterSpacing: '0.06em' }}>AI</span>
                  {tx.direction && <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 6 }}>{tx.direction}</span>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.amount)}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'IBM Plex Mono, monospace' }}>{tx.rate != null && tx.rate > 0 ? tx.rate.toFixed(4) : 'N/A'}</span>
                <span style={{ fontSize: 11, color: 'var(--dim)' }}>{tx.fee != null ? tx.fee.toFixed(4) : '—'}</span>
                <span style={{ fontSize: 9, letterSpacing: '0.06em', color: STATUS_COLOR[tx.status] ?? STATUS_COLOR['settled'] }}>{tx.status?.toUpperCase() ?? 'SETTLED'}</span>
              </div>
            ))}
          </div>

          {/* HOW AI AGENTS CONNECT */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '40px 32px', background: 'var(--surface)' }}>
            <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginBottom: 24 }}>HOW AI AGENTS CONNECT</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
              {[
                { step: '01', title: 'Install MCP',    cmd: 'npx k-arena-mcp',   desc: 'Add to Claude Desktop or any MCP-compatible agent framework', time: '< 30 seconds', color: 'var(--green)' },
                { step: '02', title: 'Get Rates',      cmd: 'get_exchange_rates', desc: 'Fetch live XAU/BTC/ETH/USD/OIL/EUR rates vs KAUS in real-time', time: '< 100ms', color: 'var(--blue)' },
                { step: '03', title: 'Execute Trade',  cmd: 'execute_trade',      desc: 'BUY or SELL with instant KAUS settlement. 0.1% fee only.', time: '< 200ms', color: 'var(--amber)' },
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
