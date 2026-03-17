'use client'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const DIST = [
  { label: 'Field Nine Treasury',   pct: 10, amount: '10,000,000', color: 'var(--green)',  desc: 'Operations, liquidity, team' },
  { label: 'Public Sale',           pct: 50, amount: '50,000,000', color: 'var(--blue)',   desc: 'USDC/ETH/BTC purchase' },
  { label: 'Ecosystem & Rewards',   pct: 25, amount: '25,000,000', color: 'var(--amber)',  desc: 'Agent incentives, staking' },
  { label: 'Genesis 999 Reserve',   pct:  5, amount:  '5,000,000', color: 'var(--red)',    desc: '999 × 500 KAUS = 499,500 KAUS' },
  { label: 'Future Development',    pct: 10, amount: '10,000,000', color: 'var(--dimmer)', desc: 'Protocol upgrades, partnerships' },
]

const FEE_FLOW = [
  { step: '01', label: 'Trade Executed',         desc: 'AI agent executes any FX/crypto/commodity trade on K-Arena',      color: 'var(--white)' },
  { step: '02', label: '0.1% Fee Charged',        desc: 'Platform deducts 0.1% of trade amount in KAUS from agent wallet', color: 'var(--green)' },
  { step: '03', label: 'Fee → feeCollector',      desc: 'KAUS fee automatically transferred to Field Nine fee wallet',     color: 'var(--blue)' },
  { step: '04', label: 'Monthly: 50% Burned',     desc: 'Half of accumulated fees permanently burned → deflation',         color: 'var(--red)' },
  { step: '05', label: 'Monthly: 30% Distributed',desc: '30% split equally among all 999 Genesis members',                 color: 'var(--amber)' },
  { step: '06', label: 'Monthly: 20% Retained',   desc: '20% kept in Field Nine treasury for operations',                  color: 'var(--dimmer)' },
]

export default function TokenomicsPage() {
  const S = {
    card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: 20, marginBottom: 16 },
    label: { fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.18em', display: 'block' as const, marginBottom: 12 },
    row: { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 11 },
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 900 }}>

            {/* Hero */}
            <div style={{ ...S.card, background: 'var(--surface-3)', borderColor: 'var(--border-mid)', marginBottom: 24 }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginBottom: 16 }}>KAUS TOKEN — CONFIRMED TOKENOMICS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: 'var(--border)' }}>
                {[
                  { label: 'INITIAL PRICE',  value: '$1.00 USDC',      sub: 'Fixed launch price' },
                  { label: 'MAX SUPPLY',     value: '100,000,000',     sub: 'KAUS — hard cap' },
                  { label: 'GENESIS PRICE',  value: '500 KAUS',        sub: '= $500 · 999 slots' },
                  { label: 'TRADE FEE',      value: '0.1%',            sub: 'Paid in KAUS' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '18px 20px', background: 'var(--surface)' }}>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--white)', lineHeight: 1, marginBottom: 4 }}>{m.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--dim)' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Token Distribution */}
              <div>
                <div style={S.card}>
                  <span style={S.label}>TOKEN DISTRIBUTION</span>
                  {DIST.map((d, i) => (
                    <div key={d.label} style={{ marginBottom: i < DIST.length - 1 ? 12 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 1, background: d.color, display: 'inline-block', flexShrink: 0 }}/>
                          <span style={{ fontSize: 11, color: 'var(--white)' }}>{d.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>{d.pct}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 1, marginLeft: 16 }}>
                        <div style={{ width: `${d.pct}%`, height: '100%', background: d.color, borderRadius: 1 }}/>
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--dimmer)', marginLeft: 16, marginTop: 3 }}>{d.amount} KAUS — {d.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <span style={S.label}>BURN MECHANICS</span>
                  {[
                    ['Burn trigger',   'Monthly, by admin (treasury)'],
                    ['Burn amount',    '50% of fee pool'],
                    ['Burn address',   '0x000...dead (permanent)'],
                    ['Effect',         'Supply decreases → price up pressure'],
                    ['Estimated burn', `~500 KAUS/month at $1M daily volume`],
                  ].map(([k, v]) => (
                    <div key={k} style={S.row}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: k === 'Effect' ? 'var(--green)' : 'var(--white)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fee Flow */}
              <div>
                <div style={S.card}>
                  <span style={S.label}>FEE FLOW — STEP BY STEP</span>
                  {FEE_FLOW.map((f, i) => (
                    <div key={f.step} style={{ display: 'flex', gap: 12, paddingBottom: i < FEE_FLOW.length - 1 ? 14 : 0, marginBottom: i < FEE_FLOW.length - 1 ? 14 : 0, borderBottom: i < FEE_FLOW.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 28, height: 28, border: `1px solid ${f.color}`, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'IBM Plex Mono', flexShrink: 0, borderRadius: 2 }}>{f.step}</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: f.color, marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.5 }}>{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <span style={S.label}>REVENUE PROJECTION</span>
                  {[
                    ['Daily volume $1M',   '1,000 KAUS/day in fees'],
                    ['Monthly fees',       '~30,000 KAUS/month'],
                    ['Monthly burned',     '~15,000 KAUS (50%)'],
                    ['Genesis holders get','~9,000 KAUS ÷ 999'],
                    ['Per Genesis/month',  '~9 KAUS ≈ $9 at $1.00'],
                    ['Field Nine monthly', '~6,000 KAUS ≈ $6,000'],
                    ['Genesis total rev',  '499,500 KAUS ≈ $499,500'],
                  ].map(([k, v], i, arr) => (
                    <div key={k} style={{ ...S.row, borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ color: 'var(--dimmer)', fontSize: 10 }}>{k}</span>
                      <span style={{ color: 'var(--green)', fontFamily: 'IBM Plex Mono', fontSize: 10 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface-2)', fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.7 }}>
                    * Projections based on $1M daily volume. Actual results depend on platform adoption.
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Architecture */}
            <div style={{ ...S.card, marginTop: 0 }}>
              <span style={S.label}>WALLET ARCHITECTURE</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  {
                    title: 'Treasury Wallet',
                    role: 'Gnosis Safe (2/3 multisig)',
                    receives: ['Initial 10M KAUS', 'Genesis 999 payments (499,500 KAUS)', '20% monthly fee share'],
                    network: 'Polygon Mainnet',
                    color: 'var(--green)',
                  },
                  {
                    title: 'Fee Collector',
                    role: 'MetaMask — 0xAD23...5349',
                    receives: ['0.1% of every trade', 'Auto-accumulated daily'],
                    notes: 'Monthly: distribute, burn, retain',
                    network: 'Polygon Mainnet',
                    color: 'var(--blue)',
                  },
                  {
                    title: 'KAUS Contract',
                    role: 'ERC-20 on Polygon',
                    receives: ['Manages supply cap', 'Handles burn', 'Genesis registry', 'Fee collection logic'],
                    network: 'Polygon (chainId: 137)',
                    color: 'var(--amber)',
                  },
                ].map(w => (
                  <div key={w.title} style={{ border: `1px solid ${w.color}`, padding: 14, background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 9, color: w.color, letterSpacing: '0.15em', marginBottom: 6 }}>{w.title.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 10 }}>{w.role}</div>
                    {w.receives.map(r => (
                      <div key={r} style={{ fontSize: 10, color: 'var(--dimmer)', display: 'flex', gap: 6, marginBottom: 4 }}>
                        <span style={{ color: w.color }}>→</span>{r}
                      </div>
                    ))}
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>{w.network}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
