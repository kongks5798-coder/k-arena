'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { formatAmount } from '@/lib/rates'
import { useTranslation } from '@/hooks/useTranslation'

interface Tx {
  id: string; agent_id: string; from_currency: string; to_currency: string
  input_amount: number; output_amount: number; rate: number
  fee_kaus: number; settlement_ms: number; status: string; created_at: string
}

interface Stats { active_agents: number; volume_24h: number; signals_today: number; active_sessions: number; total_transactions: number }

const STATUS_COLOR: Record<string, string> = { settled: 'var(--green)', pending: 'var(--amber)', failed: 'var(--red)', clearing: 'var(--blue)' }

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
  const t = useTranslation()
  const [txs, setTxs] = useState<Tx[]>([])
  const [stats, setStats] = useState<Stats>({ active_agents: 0, volume_24h: 0, signals_today: 0, active_sessions: 0, total_transactions: 0 })
  const [activePeriod, setActivePeriod] = useState('24H')
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const fetchAll = useCallback(async () => {
    try {
      const [txRes, statRes] = await Promise.all([
        fetch('/api/exchange?limit=20'),
        fetch('/api/stats'),
      ])
      const [txData, statData] = await Promise.all([txRes.json(), statRes.json()])
      if (txData.ok) setTxs(txData.transactions ?? [])
      const p = statData.platform ?? statData
      setStats({
        active_agents:      p.active_agents     ?? 0,
        volume_24h:         p.total_volume_24h  ?? p.volume_24h  ?? 0,
        signals_today:      p.signals_today     ?? 0,
        active_sessions:    p.active_agents     ?? 0,
        total_transactions: p.total_trades_24h  ?? p.total_transactions ?? 0,
      })
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const timer = setInterval(fetchAll, 10000)
    return () => clearInterval(timer)
  }, [fetchAll])

  useEffect(() => {
    const timer = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  void tick

  const vol24h = stats.volume_24h ?? 0
  const recentTxs = txs.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
            <span style={{ fontSize: 9, color: 'var(--red)', letterSpacing: '0.1em', fontWeight: 700 }}>{t('live')}</span>
            <span style={{ fontSize: 9, color: 'var(--dim)', marginLeft: 4, letterSpacing: '0.06em' }}>
              {stats.active_agents} {t('agents_trading')}
            </span>
          </div>
          <span style={{ fontSize: 9, color: 'var(--dimmer)', borderLeft: '1px solid var(--border)', paddingLeft: 12, letterSpacing: '0.08em' }}>{t('fee_rate')}</span>
        </div>
      }/>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* ── HERO SECTION ── */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '40px 32px 36px', background: 'linear-gradient(180deg, rgba(0,255,136,0.03) 0%, transparent 100%)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', display: 'inline-block', animation: 'dot-pulse 1s infinite' }}/>
              <span style={{ fontSize: 10, color: 'var(--red)', letterSpacing: '0.2em', fontWeight: 700 }}>{t('live')}</span>
              <span style={{ fontSize: 10, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>
                {stats.active_agents} {t('agents_trading')} · {stats.total_transactions.toLocaleString()}+ {t('transactions_label')}
              </span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--white)', margin: 0, lineHeight: 1.1 }}>
                {t('hero_line1')}<br/>
                <span style={{ color: 'var(--green)' }}>{t('hero_line2')}</span>
              </h1>
            </div>
            <p style={{ fontSize: 13, color: 'var(--dim)', letterSpacing: '0.06em', marginBottom: 28, lineHeight: 1.6 }}>
              {t('hero_desc')}<br/>
              {t('hero_pairs')}
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>{t('connect_30s')}</div>
              <CopyBox cmd="npx k-arena-mcp" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>{t('works_with')}</span>
              {['Claude', 'GPT-4', 'LangChain', 'AutoGPT', 'CrewAI'].map(ai => (
                <span key={ai} style={{ fontSize: 9, padding: '3px 8px', border: '1px solid var(--border-mid)', color: 'var(--dim)', letterSpacing: '0.06em' }}>{ai}</span>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8 }}>{t('recent_activity')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {recentTxs.length > 0 ? recentTxs.map(tx => (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
                    <span style={{ color: 'var(--green)', fontFamily: 'IBM Plex Mono,monospace', fontSize: 9 }}>
                      {AGENT_NAMES[tx.agent_id] ?? tx.agent_id}
                    </span>
                    <span style={{ color: 'var(--dimmer)' }}>{tx.from_currency}/{tx.to_currency}</span>
                    <span style={{ color: 'var(--white)', fontWeight: 500 }}>{formatAmount(tx.input_amount)}</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>·</span>
                    <span style={{ color: 'var(--dimmer)', fontSize: 9 }}>{timeAgo(tx.created_at)}</span>
                  </div>
                )) : (
                  <div style={{ fontSize: 11, color: 'var(--dimmer)' }}>{t('awaiting_trade')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: t('vol_24h'),            value: formatAmount(vol24h, 0),               sub: `${stats.total_transactions} txs` },
              { label: t('label_active_agents'), value: stats.active_agents.toLocaleString(),  sub: t('ai_only_humans') },
              { label: t('signals_today'),       value: stats.signals_today.toString(),         sub: t('from_all_agents') },
              { label: t('fee_rate_label'),      value: '0.1%',                                sub: t('all_asset_classes') },
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

          {/* TX Feed */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.15em' }}>{t('live_transactions')}</span>
                <span style={{ fontSize: 9, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 6px' }}>STREAM</span>
                <span style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 4 }}>{t('human_trades_zero')} {stats.total_transactions.toLocaleString()}+</span>
              </div>
              <div style={{ display: 'flex', gap: 1 }}>
                {['1H', '24H', '7D', '30D'].map(p => (
                  <button key={p} onClick={() => setActivePeriod(p)} style={{ fontSize: 9, padding: '4px 10px', letterSpacing: '0.08em', background: activePeriod === p ? 'var(--surface-3)' : 'transparent', color: activePeriod === p ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${activePeriod === p ? 'var(--border-mid)' : 'var(--border)'}`, cursor: 'pointer' }}>{p}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {[t('col_pair'), t('col_amount'), t('col_rate'), t('col_fee'), t('col_status')].map(h => (
                <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11, letterSpacing: '0.1em' }}>{t('loading_tx')}</div>
            ) : txs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>{t('no_tx_yet')}</div>
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

          {/* ── HOW AI AGENTS CONNECT ── */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '40px 32px', background: 'var(--surface)' }}>
            <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginBottom: 24 }}>{t('how_connect')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
              {[
                { step: '01', titleKey: 'step1_title', cmd: 'npx k-arena-mcp',  descKey: 'step1_desc', timeKey: 'step1_time', color: 'var(--green)' },
                { step: '02', titleKey: 'step2_title', cmd: 'get_exchange_rates', descKey: 'step2_desc', timeKey: 'step2_time', color: 'var(--blue)' },
                { step: '03', titleKey: 'step3_title', cmd: 'execute_trade',      descKey: 'step3_desc', timeKey: 'step3_time', color: 'var(--amber)' },
              ].map((s, i) => (
                <div key={s.step} style={{ padding: '24px 28px', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, opacity: 0.3, marginBottom: 12, fontFamily: 'IBM Plex Mono,monospace' }}>{s.step}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 8, letterSpacing: '0.06em' }}>{t(s.titleKey)}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono,monospace', fontSize: 11, color: s.color, marginBottom: 10, padding: '4px 8px', background: 'rgba(0,0,0,0.3)', display: 'inline-block' }}>{s.cmd}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.6, marginBottom: 8 }}>{t(s.descKey)}</div>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>⏱ {t(s.timeKey)}</div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
