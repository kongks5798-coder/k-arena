'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface PlatformStats {
  active_agents: number
  genesis_claimed: number
  genesis_remaining: number
  total_transactions: number
  volume_24h: number
}

const KAUS_PRICE_USDC = 1.00 // $1.00 초기 가격
const TREASURY_ADDRESS    = '0xAD23ce8631a88a0E404a65717ae2DBFEfC035349'
const FEE_COLLECTOR       = '0xAD23ce8631a88a0E404a65717ae2DBFEfC035349' // USD/KAUS (updated by oracle)
const CHAIN_ID = 137 // Polygon Mainnet
const CHAIN_ID_HEX = '0x89'

const POLYGON_PARAMS = {
  chainId: CHAIN_ID_HEX,
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
}

type Tab = 'BUY_KAUS' | 'GENESIS' | 'REVENUE'

export default function BuyKausPage() {
  const [tab, setTab] = useState<Tab>('BUY_KAUS')
  const [wallet, setWallet] = useState<string | null>(null)
  const [kausAmt, setKausAmt] = useState(500)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [txStatus, setTxStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.stats) }).catch(() => {})
    // Check if already connected
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((res) => { const accounts = res as string[];
        if (accounts && accounts[0]) setWallet(accounts[0])
      }).catch(() => {})
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask not detected. Install MetaMask or use a Web3 browser.')
      return
    }
    setConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      if (accounts[0]) setWallet(accounts[0])
      // Switch to Polygon
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] })
      } catch (e: unknown) {
        const err = e as { code?: number }
        if (err.code === 4902) {
          await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [POLYGON_PARAMS] })
        }
      }
    } catch (e) {
      console.error(e)
    }
    setConnecting(false)
  }

  const disconnectWallet = () => setWallet(null)

  const usdcCost  = (kausAmt * KAUS_PRICE_USDC).toFixed(2)
  const feeAmt    = (kausAmt * KAUS_PRICE_USDC * 0.001).toFixed(4)

  const handleBuyKaus = async () => {
    if (!wallet) { await connectWallet(); return }
    setTxStatus('Preparing transaction...')
    // In production: call KAUS contract mintGenesis() or transfer
    // For now: show instructions
    await new Promise(r => setTimeout(r, 1500))
    setTxStatus('⚠ Contract not yet deployed to mainnet. Coming soon.')
    setTimeout(() => setTxStatus(null), 4000)
  }

  const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000]

  const S = {
    card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: 20 },
    label: { fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8, display: 'block' as const },
    row: { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 11 },
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar rightContent={
        wallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}/>
            <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
            <button onClick={disconnectWallet} style={{ fontSize: 9, color: 'var(--dimmer)', background: 'none', border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer' }}>DISCONNECT</button>
          </div>
        ) : (
          <button onClick={connectWallet} disabled={connecting} style={{ fontSize: 9, padding: '5px 14px', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', cursor: 'pointer', letterSpacing: '0.1em' }}>
            {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
          </button>
        )
      }/>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {([['BUY_KAUS','BUY KAUS'],['GENESIS','GENESIS 999'],['REVENUE','REVENUE MODEL']] as [Tab,string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{ fontSize: 10, padding: '10px 20px', letterSpacing: '0.1em', background: tab === t ? 'var(--surface-3)' : 'transparent', color: tab === t ? 'var(--white)' : 'var(--dimmer)', border: 'none', borderBottom: tab === t ? '1px solid var(--green)' : '1px solid transparent', cursor: 'pointer' }}>{label}</button>
            ))}
          </div>

          {/* BUY KAUS TAB */}
          {tab === 'BUY_KAUS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, maxWidth: 900 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={S.card}>
                  <span style={S.label}>KAUS AMOUNT</span>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={kausAmt} onChange={e => setKausAmt(Math.max(1, Number(e.target.value)))}
                      style={{ width: '100%', padding: '12px 60px 12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 600 }}/>
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--dim)' }}>KAUS</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {QUICK_AMOUNTS.map(a => (
                      <button key={a} onClick={() => setKausAmt(a)} style={{ fontSize: 9, padding: '4px 10px', background: kausAmt === a ? 'var(--surface-3)' : 'transparent', border: `1px solid ${kausAmt === a ? 'var(--border-mid)' : 'var(--border)'}`, color: kausAmt === a ? 'var(--white)' : 'var(--dimmer)', cursor: 'pointer' }}>{a.toLocaleString()}</button>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <span style={S.label}>PAYMENT OPTIONS</span>
                  {[
                    { method: 'USDC (Polygon)', cost: `${usdcCost} USDC`, note: 'Instant · $0.01 gas fee', recommended: true },
                    { method: 'ETH (Polygon)',  cost: `${(Number(usdcCost)/3240).toFixed(5)} ETH`, note: 'Fast settlement', recommended: false },
                    { method: 'BTC (via bridge)', cost: `${(Number(usdcCost)/83420).toFixed(8)} BTC`, note: '~30min confirmation', recommended: false },
                  ].map(p => (
                    <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p.method}
                          {p.recommended && <span style={{ fontSize: 8, padding: '1px 5px', border: '1px solid var(--green)', color: 'var(--green)' }}>RECOMMENDED</span>}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 2 }}>{p.note}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>{p.cost}</div>
                    </div>
                  ))}
                </div>

                {txStatus && (
                  <div style={{ border: '1px solid var(--amber)', padding: '10px 14px', background: 'var(--amber-dim)', fontSize: 10, color: 'var(--amber)' }}>{txStatus}</div>
                )}

                <button onClick={handleBuyKaus} style={{ width: '100%', padding: 14, background: wallet ? 'var(--white)' : 'var(--surface-3)', color: wallet ? 'var(--black)' : 'var(--dim)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', cursor: 'pointer' }}>
                  {wallet ? `BUY ${kausAmt.toLocaleString()} KAUS →` : 'CONNECT WALLET TO BUY'}
                </button>
              </div>

              {/* Order summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={S.card}>
                  <span style={S.label}>ORDER SUMMARY</span>
                  {[
                    ['Amount',      `${kausAmt.toLocaleString()} KAUS`],
                    ['Price/KAUS',  `$${KAUS_PRICE_USDC} USDC`],
                    ['Network fee', '≈ $0.01 MATIC'],
                    ['Platform fee','0%'],
                  ].map(([k, v]) => (
                    <div key={k} style={S.row}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: 'var(--white)' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: 'var(--dimmer)' }}>TOTAL</span>
                    <span style={{ color: 'var(--green)' }}>{usdcCost} USDC</span>
                  </div>
                </div>

                <div style={S.card}>
                  <span style={S.label}>TOKEN INFO</span>
                  {[
                    ['Contract',  'Polygon Mainnet'],
                    ['Standard',  'ERC-20'],
                    ['Max Supply','100,000,000 KAUS'],
                    ['Fee Rate',  '0.1% per trade'],
                    ['Chain',     'Polygon (MATIC)'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ ...S.row, fontSize: 10 }}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: 'var(--white)' }}>{v}</span>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <span style={S.label}>ADD TO METAMASK</span>
                  <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 10 }}>
                    After contract deployment, click to add KAUS to your MetaMask wallet automatically.
                  </div>
                  <button style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border-mid)', color: 'var(--dim)', fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--amber)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}>
                    + ADD KAUS TO WALLET
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GENESIS TAB */}
          {tab === 'GENESIS' && (
            <div style={{ maxWidth: 600 }}>
              <div style={S.card}>
                <span style={S.label}>GENESIS 999 — CRYPTO PAYMENT</span>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.8, marginBottom: 16 }}>
                  Purchase Genesis membership directly with crypto. No intermediary. Instant on-chain verification.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { coin: 'KAUS',  price: '500 KAUS',       usd: '≈ $923',   best: true },
                    { coin: 'USDC',  price: '$923.50 USDC',   usd: '$923.50',  best: false },
                    { coin: 'ETH',   price: '0.285 ETH',      usd: '≈ $923',   best: false },
                    { coin: 'BTC',   price: '0.01107 BTC',    usd: '≈ $923',   best: false },
                  ].map(p => (
                    <div key={p.coin} style={{ border: `1px solid ${p.best ? 'var(--green)' : 'var(--border)'}`, padding: 14, background: p.best ? 'rgba(0,255,136,0.04)' : 'var(--surface-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{p.coin}</span>
                        {p.best && <span style={{ fontSize: 8, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 5px' }}>BEST</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--white)', fontFamily: 'IBM Plex Mono', marginBottom: 2 }}>{p.price}</div>
                      <div style={{ fontSize: 10, color: 'var(--dimmer)' }}>{p.usd}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 16, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', lineHeight: 1.7 }}>
                  Genesis slots: {stats ? `${stats.genesis_claimed}/999 claimed · ${stats.genesis_remaining} remaining` : 'Loading...'}
                </div>
                <button onClick={handleBuyKaus} style={{ width: '100%', padding: 14, background: wallet ? 'var(--white)' : 'var(--surface-3)', color: wallet ? 'var(--black)' : 'var(--dim)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: 'pointer' }}>
                  {wallet ? 'CLAIM GENESIS WITH CRYPTO →' : 'CONNECT WALLET FIRST'}
                </button>
              </div>
            </div>
          )}

          {/* REVENUE MODEL TAB */}
          {tab === 'REVENUE' && (
            <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={S.card}>
                <span style={S.label}>FIELD NINE REVENUE STRUCTURE</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { source: 'Exchange Fee',     rate: '0.1% per trade',      flow: 'KAUS → feeCollector wallet',         estimated: 'Volume × 0.1%' },
                    { source: 'Genesis Sale',     rate: '500 KAUS/slot × 999', flow: '499,500 KAUS → Treasury',             estimated: '≈ $922,556' },
                    { source: 'KAUS Token Sale',  rate: 'Market price',        flow: 'USDC/BTC/ETH → Treasury',             estimated: 'Variable' },
                    { source: 'API Access',       rate: 'TBD',                 flow: 'USDC → Treasury',                     estimated: 'Monthly SaaS' },
                  ].map((r, i) => (
                    <div key={r.source} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr', gap: 16, padding: '13px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--white)' }}>{r.source}</div>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--dim)' }}>{r.rate}</div>
                      <div style={{ fontSize: 10, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono' }}>{r.flow}</div>
                      <div style={{ fontSize: 10, color: 'var(--green)', textAlign: 'right' }}>{r.estimated}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <span style={S.label}>WALLET ARCHITECTURE</span>
                <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 2, fontFamily: 'IBM Plex Mono' }}>
                  {`
Treasury Wallet (Gnosis Safe — 2/3 multisig)
├── Initial KAUS: 10,000,000 KAUS
├── Genesis revenue: 499,500 KAUS (when sold out)
└── Monthly fee distribution source

Fee Collector Wallet (Hot Wallet)
├── Receives: 0.1% of all platform trades (KAUS)
├── Monthly: distribute 70% → Genesis holders
└── Monthly: burn 10%, retain 20% for ops

KAUS Token Contract (Polygon)
├── Max Supply: 100,000,000 KAUS
├── Platform minted: As needed for rewards
└── Burn: Deflationary via fee burns
                  `.trim()}
                </div>
              </div>

              <div style={S.card}>
                <span style={S.label}>WITHDRAWAL FLOW</span>
                <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 2 }}>
                  {[
                    '1. KAUS accumulates in feeCollector wallet (auto, on-chain)',
                    '2. Monthly: distributeFees() sends 70% to Genesis holders',
                    '3. Remaining KAUS → sell on DEX (Uniswap/QuickSwap Polygon)',
                    '4. KAUS → USDC (swap on DEX)',
                    '5. USDC → KRW via Bithumb/Upbit/Binance',
                    '6. KRW → Field Nine bank account',
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '5px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>{s}</div>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <span style={S.label}>BLOCKCHAIN SETUP CHECKLIST</span>
                {[
                  { done: false, item: 'Set up Gnosis Safe (Treasury) at app.safe.global',          link: 'https://app.safe.global' },
                  { done: false, item: 'Fund deployer wallet with 10 MATIC for gas',                link: 'https://polygon.technology' },
                  { done: true,  item: 'KAUS Token Solidity contract written',                      link: null },
                  { done: false, item: 'Deploy to Polygon Amoy testnet + verify',                   link: 'https://amoy.polygonscan.com' },
                  { done: false, item: 'Deploy to Polygon Mainnet + verify',                        link: 'https://polygonscan.com' },
                  { done: false, item: 'Add NEXT_PUBLIC_KAUS_CONTRACT to Vercel env',               link: null },
                  { done: false, item: 'Set up QuickSwap KAUS/USDC liquidity pool',                 link: 'https://quickswap.exchange' },
                  { done: false, item: 'List on CoinGecko / CoinMarketCap',                         link: null },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 10, color: c.done ? 'var(--green)' : 'var(--dimmer)', flexShrink: 0 }}>{c.done ? '✓' : '○'}</span>
                    <span style={{ fontSize: 11, color: c.done ? 'var(--dim)' : 'var(--white)' }}>{c.item}</span>
                    {c.link && <a href={c.link} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: 'var(--blue)', marginLeft: 'auto', flexShrink: 0 }}>↗</a>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
