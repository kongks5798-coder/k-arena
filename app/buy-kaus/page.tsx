'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface PlatformStats {
  active_agents: number
  genesis_claimed: number
  genesis_remaining: number
  total_transactions: number
  volume_24h: number
}

const KAUS_PRICE_USD   = 1.00
const KAUS_CONTRACT    = process.env.NEXT_PUBLIC_KAUS_CONTRACT ?? ''
const DEPLOYED         = !!KAUS_CONTRACT
const MAINNET_CHAIN_ID = '0x89' // 137

const POLYGON_PARAMS = {
  chainId: MAINNET_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
}

type Tab = 'BUY_KAUS' | 'GENESIS' | 'REVENUE'
type Slippage = '0.1' | '0.5' | '1.0'

const SLIPPAGE_OPTIONS: Slippage[] = ['0.1', '0.5', '1.0']

export default function BuyKausPage() {
  const router = useRouter()

  const [tab,          setTab]          = useState<Tab>('BUY_KAUS')
  const [wallet,       setWallet]       = useState<string | null>(null)
  const [chainId,      setChainId]      = useState<string | null>(null)
  const [kausBalance,  setKausBalance]  = useState<string | null>(null)
  const [kausAmt,      setKausAmt]      = useState(500)
  const [stats,        setStats]        = useState<PlatformStats | null>(null)
  const [connecting,   setConnecting]   = useState(false)
  const [txStatus,     setTxStatus]     = useState<{ msg: string; ok: boolean } | null>(null)
  const [gasCost,      setGasCost]      = useState<{ matic: number; usd: number } | null>(null)
  const [slippage,     setSlippage]     = useState<Slippage>('0.5')
  const [showSlippage, setShowSlippage] = useState(false)
  const [showOnRamp,   setShowOnRamp]   = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  // Load stats
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      if (d.ok && d.platform) setStats({
        active_agents:      d.platform.active_agents,
        genesis_claimed:    d.platform.genesis_sold,
        genesis_remaining:  d.platform.genesis_total - d.platform.genesis_sold,
        total_transactions: d.platform.total_trades_24h,
        volume_24h:         d.platform.total_volume_24h,
      })
    }).catch(() => {}).finally(() => setStatsLoading(false))
  }, [])

  // Load gas estimate
  useEffect(() => {
    fetch('/api/kaus/gas-estimate').then(r => r.json()).then(d => {
      if (d.ok) setGasCost({ matic: d.gas_cost_matic, usd: d.gas_cost_usd })
    }).catch(() => {})
  }, [])

  // MetaMask init
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then((res) => {
      const accounts = res as string[]
      if (accounts?.[0]) setWallet(accounts[0])
    }).catch(() => {})
    window.ethereum.request({ method: 'eth_chainId' }).then((id) => {
      setChainId(id as string)
    }).catch(() => {})
    const handleChainChange    = (id: unknown)   => setChainId(id as string)
    const handleAccountsChange = (accs: unknown) => setWallet((accs as string[])?.[0] ?? null)
    window.ethereum.on('chainChanged',    handleChainChange)
    window.ethereum.on('accountsChanged', handleAccountsChange)
  }, [])

  const fetchKausBalance = useCallback(async (address: string) => {
    if (!DEPLOYED || !window.ethereum) return
    try {
      const paddedAddr = address.slice(2).padStart(64, '0')
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: KAUS_CONTRACT, data: '0x70a08231' + paddedAddr }, 'latest'],
      }) as string
      if (result && result !== '0x') {
        setKausBalance((Number(BigInt(result)) / 1e18).toFixed(2))
      }
    } catch {}
  }, [])

  useEffect(() => { if (wallet) fetchKausBalance(wallet) }, [wallet, fetchKausBalance])

  const switchToPolygon = async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: MAINNET_CHAIN_ID }] })
    } catch (e: unknown) {
      if ((e as { code?: number }).code === 4902) {
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [POLYGON_PARAMS] })
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask not detected. Install MetaMask: https://metamask.io')
      return
    }
    setConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      if (accounts[0]) { setWallet(accounts[0]); await switchToPolygon() }
    } catch {}
    setConnecting(false)
  }

  const addKausToMetaMask = async () => {
    if (!window.ethereum || !DEPLOYED) return
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: [{ type: 'ERC20', options: { address: KAUS_CONTRACT, symbol: 'KAUS', decimals: 18 } }],
    }).catch(() => {})
  }

  const handleBuyKaus = async () => {
    if (!wallet) { await connectWallet(); return }
    if (!DEPLOYED) {
      setTxStatus({ msg: '⚠ Contract not yet deployed.', ok: false })
      setTimeout(() => setTxStatus(null), 5000)
      return
    }
    if (!isOnPolygon) {
      await switchToPolygon()
      setTxStatus({ msg: 'Please switch to Polygon Mainnet and try again.', ok: false })
      setTimeout(() => setTxStatus(null), 4000)
      return
    }

    const POLYGON_USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
    const usdcAmount6  = Math.floor(kausAmt * 1_000_000)

    try {
      setTxStatus({ msg: 'Step 1/3: Approving USDC...', ok: true })

      const approveData = '0x095ea7b3' +
        KAUS_CONTRACT.slice(2).padStart(64, '0') +
        usdcAmount6.toString(16).padStart(64, '0')

      const approveTx = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ from: wallet, to: POLYGON_USDC, data: approveData }],
      }) as string

      setTxStatus({ msg: `Step 2/3: Buying KAUS... (${approveTx.slice(0, 10)}...)`, ok: true })

      const buyData = '0x6b1c2600' + usdcAmount6.toString(16).padStart(64, '0')
      const buyTx = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ from: wallet, to: KAUS_CONTRACT, data: buyData }],
      }) as string

      setTxStatus({ msg: 'Step 3/3: Recording purchase...', ok: true })

      await fetch('/api/kaus/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_wallet: wallet,
          amount_usd:   kausAmt,
          amount_kaus:  kausAmt * 0.999,
          tx_hash:      buyTx,
          status:       'confirmed',
        }),
      })

      setTxStatus({ msg: `✅ Purchased ${kausAmt.toLocaleString()} KAUS!`, ok: true })
      await fetchKausBalance(wallet)

      setTimeout(() => {
        router.push(`/buy-kaus/receipt?tx=${buyTx}&amount=${kausAmt}&wallet=${wallet}`)
      }, 1500)
    } catch (e: unknown) {
      const err = e as { code?: number; message?: string }
      setTxStatus({ msg: err.code === 4001 ? 'Transaction cancelled.' : `Error: ${err.message?.slice(0, 80) ?? 'Unknown'}`, ok: false })
      setTimeout(() => setTxStatus(null), 6000)
    }
  }

  const isOnPolygon  = chainId === MAINNET_CHAIN_ID
  const usdCost      = (kausAmt * KAUS_PRICE_USD).toFixed(2)
  const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000]

  const S = {
    card:  { background: 'var(--surface)', border: '1px solid var(--border)', padding: 20 },
    label: { fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 8, display: 'block' as const },
    row:   { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 11 },
  }

  const SkeletonRow = () => (
    <div style={{ height: 14, background: 'var(--surface-2)', borderRadius: 2, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @media (max-width: 768px) {
          .buy-grid { grid-template-columns: 1fr !important; }
          .buy-summary { order: -1; }
          .revenue-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .quick-btns { flex-wrap: wrap !important; }
          .tab-btn { padding: 8px 12px !important; font-size: 9px !important; }
        }
      `}</style>

      <Topbar rightContent={
        wallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isOnPolygon && <span style={{ fontSize: 9, padding: '2px 7px', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>POLYGON</span>}
            {!isOnPolygon && (
              <button onClick={switchToPolygon} style={{ fontSize: 9, padding: '2px 7px', border: '1px solid #f59e0b', color: '#f59e0b', background: 'none', cursor: 'pointer' }}>SWITCH TO POLYGON</button>
            )}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
            {kausBalance !== null && DEPLOYED && (
              <span style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'IBM Plex Mono' }}>{kausBalance} KAUS</span>
            )}
            <button onClick={() => setWallet(null)} style={{ fontSize: 9, color: 'var(--dimmer)', background: 'none', border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer' }}>DISCONNECT</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setShowOnRamp(true)} style={{ fontSize: 9, padding: '5px 14px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', cursor: 'pointer', letterSpacing: '0.08em' }}>
              BUY WITH CARD
            </button>
            <button onClick={connectWallet} disabled={connecting} style={{ fontSize: 9, padding: '5px 14px', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', cursor: 'pointer', letterSpacing: '0.1em' }}>
              {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          </div>
        )
      } />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {([['BUY_KAUS', 'BUY KAUS'], ['GENESIS', 'GENESIS 999'], ['REVENUE', 'REVENUE MODEL']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} className="tab-btn" onClick={() => setTab(t)}
                style={{ fontSize: 10, padding: '10px 20px', letterSpacing: '0.1em', background: tab === t ? 'var(--surface-3)' : 'transparent', color: tab === t ? 'var(--white)' : 'var(--dimmer)', border: 'none', borderBottom: tab === t ? '1px solid var(--green)' : '1px solid transparent', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── BUY KAUS TAB ── */}
          {tab === 'BUY_KAUS' && (
            <div className="buy-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, maxWidth: 900 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Amount input */}
                <div style={S.card}>
                  <span style={S.label}>KAUS AMOUNT</span>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={kausAmt} onChange={e => setKausAmt(Math.max(1, Number(e.target.value)))}
                      style={{ width: '100%', padding: '12px 60px 12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 600, boxSizing: 'border-box' }} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--dim)' }}>KAUS</span>
                  </div>
                  <div className="quick-btns" style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {QUICK_AMOUNTS.map(a => (
                      <button key={a} onClick={() => setKausAmt(a)}
                        style={{ fontSize: 9, padding: '4px 10px', background: kausAmt === a ? 'var(--surface-3)' : 'transparent', border: `1px solid ${kausAmt === a ? 'var(--border-mid)' : 'var(--border)'}`, color: kausAmt === a ? 'var(--white)' : 'var(--dimmer)', cursor: 'pointer' }}>
                        {a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fiat on-ramp CTA */}
                <div style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 4 }}>NO CRYPTO? NO PROBLEM</div>
                    <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.6 }}>Buy KAUS with credit card, bank transfer, or Apple Pay</div>
                  </div>
                  <button onClick={() => setShowOnRamp(true)}
                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', flexShrink: 0 }}>
                    BUY WITH CARD →
                  </button>
                </div>

                {/* Wallet connect CTA */}
                {!wallet && (
                  <div style={{ ...S.card, border: '1px solid rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.03)' }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12, lineHeight: 1.7 }}>
                      Connect MetaMask to view your KAUS balance and purchase with USDC on Polygon.
                    </div>
                    <button onClick={connectWallet} disabled={connecting}
                      style={{ width: '100%', padding: 10, background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>
                      {connecting ? 'CONNECTING...' : 'CONNECT METAMASK'}
                    </button>
                  </div>
                )}

                {/* KAUS balance */}
                {wallet && DEPLOYED && kausBalance !== null && (
                  <div style={{ ...S.card, border: '1px solid rgba(0,255,136,0.2)' }}>
                    <span style={S.label}>YOUR KAUS BALANCE</span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>
                      {kausBalance} <span style={{ fontSize: 14, color: 'var(--dim)' }}>KAUS</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--dimmer)', marginTop: 4 }}>
                      ≈ ${(Number(kausBalance) * KAUS_PRICE_USD).toFixed(2)} USD · {isOnPolygon ? 'Polygon Mainnet' : 'Unknown Network'}
                    </div>
                  </div>
                )}

                {txStatus && (
                  <div style={{ border: `1px solid ${txStatus.ok ? 'var(--green)' : 'var(--amber)'}`, padding: '10px 14px', background: txStatus.ok ? 'rgba(0,255,136,0.05)' : 'var(--amber-dim)', fontSize: 10, color: txStatus.ok ? 'var(--green)' : 'var(--amber)' }}>
                    {txStatus.msg}
                  </div>
                )}

                <button onClick={handleBuyKaus}
                  style={{ width: '100%', padding: 14, background: wallet ? 'var(--white)' : 'var(--surface-3)', color: wallet ? 'var(--black)' : 'var(--dim)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', cursor: 'pointer' }}>
                  {wallet ? `BUY ${kausAmt.toLocaleString()} KAUS →` : 'CONNECT WALLET TO BUY'}
                </button>

                {/* Not enough USDC? */}
                {wallet && (
                  <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.7, textAlign: 'center' }}>
                    Need USDC on Polygon?{' '}
                    <button onClick={() => setShowOnRamp(true)} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 10 }}>Buy with card →</button>
                    {' '}or{' '}
                    <a href="https://app.uniswap.org" target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontSize: 10 }}>bridge from Ethereum ↗</a>
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="buy-summary" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Order summary */}
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={S.label}>ORDER SUMMARY</span>
                    {/* Slippage gear */}
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setShowSlippage(v => !v)}
                        style={{ fontSize: 9, padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--dimmer)', cursor: 'pointer' }}>
                        ⚙ {slippage}% slippage
                      </button>
                      {showSlippage && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 8, zIndex: 10, minWidth: 140 }}>
                          <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 6 }}>MAX SLIPPAGE</div>
                          {SLIPPAGE_OPTIONS.map(s => (
                            <button key={s} onClick={() => { setSlippage(s); setShowSlippage(false) }}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', background: slippage === s ? 'var(--surface-3)' : 'transparent', border: 'none', color: slippage === s ? 'var(--green)' : 'var(--dim)', fontSize: 10, cursor: 'pointer' }}>
                              {s}% {s === '0.5' ? '(recommended)' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {[
                    ['Amount',        `${kausAmt.toLocaleString()} KAUS`],
                    ['Price / KAUS',  `$${KAUS_PRICE_USD.toFixed(2)} USD`],
                    ['Network fee',   gasCost ? `≈ ${gasCost.matic.toFixed(4)} MATIC ($${gasCost.usd.toFixed(3)})` : '≈ $0.005 MATIC'],
                    ['Platform fee',  '0.1%'],
                    ['Max slippage',  `${slippage}%`],
                  ].map(([k, v]) => (
                    <div key={k} style={S.row}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: 'var(--white)', fontFamily: k === 'Network fee' ? 'IBM Plex Mono' : 'inherit', fontSize: k === 'Network fee' ? 9 : 11 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: 'var(--dimmer)' }}>TOTAL</span>
                    <span style={{ color: 'var(--green)' }}>${usdCost} USD</span>
                  </div>
                </div>

                {/* Token info */}
                <div style={S.card}>
                  <span style={S.label}>TOKEN INFO</span>
                  {[
                    ['Contract',    DEPLOYED ? `${KAUS_CONTRACT.slice(0, 6)}...${KAUS_CONTRACT.slice(-4)}` : 'Not deployed'],
                    ['Standard',    'ERC-20 + Pausable'],
                    ['Max Supply',  '100,000,000 KAUS'],
                    ['Fee Rate',    '0.1% per trade'],
                    ['Chain',       DEPLOYED ? 'Polygon Mainnet' : '—'],
                    ['Status',      DEPLOYED ? '✅ Live' : '🔧 Pre-launch'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ ...S.row, fontSize: 10 }}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: DEPLOYED && k === 'Status' ? 'var(--green)' : !DEPLOYED && k === 'Status' ? '#f59e0b' : 'var(--white)' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Security badges */}
                <div style={{ ...S.card, border: '1px solid rgba(0,255,136,0.15)' }}>
                  <span style={S.label}>SECURITY</span>
                  {[
                    { icon: '✓', label: 'Contract verified on Sourcify',     color: 'var(--green)' },
                    { icon: '✓', label: 'Gnosis Safe 2/3 multisig treasury', color: 'var(--green)' },
                    { icon: '✓', label: 'OpenZeppelin Pausable (emergency)',  color: 'var(--green)' },
                    { icon: '✓', label: 'On-chain Telegram alert monitor',   color: 'var(--green)' },
                  ].map(b => (
                    <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                      <span style={{ color: b.color, fontSize: 10, flexShrink: 0 }}>{b.icon}</span>
                      <span style={{ fontSize: 10, color: 'var(--dim)' }}>{b.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    <a href={`https://sourcify.dev/#/lookup/${KAUS_CONTRACT}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 8, padding: '3px 8px', border: '1px solid var(--border)', color: 'var(--dimmer)', textDecoration: 'none' }}>SOURCIFY ↗</a>
                    <a href="https://polygonscan.com/address/0xe48f48c00adf4c572608F3e0CC3CCF850022c42c" target="_blank" rel="noreferrer"
                      style={{ fontSize: 8, padding: '3px 8px', border: '1px solid var(--border)', color: 'var(--dimmer)', textDecoration: 'none' }}>GNOSIS SAFE ↗</a>
                  </div>
                </div>

                {/* Network + MetaMask */}
                <div style={S.card}>
                  <span style={S.label}>NETWORK</span>
                  <button onClick={switchToPolygon}
                    style={{ width: '100%', padding: '8px', background: isOnPolygon ? 'rgba(0,255,136,0.07)' : 'transparent', border: `1px solid ${isOnPolygon ? 'var(--green)' : 'var(--border)'}`, color: isOnPolygon ? 'var(--green)' : 'var(--dim)', fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer', marginBottom: 8 }}>
                    {isOnPolygon ? '✓ ' : ''}POLYGON MAINNET
                  </button>
                  <button onClick={addKausToMetaMask} disabled={!DEPLOYED}
                    style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${DEPLOYED ? 'var(--border-mid)' : 'var(--border)'}`, color: DEPLOYED ? 'var(--dim)' : 'var(--dimmer)', fontSize: 9, letterSpacing: '0.1em', cursor: DEPLOYED ? 'pointer' : 'not-allowed' }}>
                    + ADD KAUS TO METAMASK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── GENESIS TAB ── */}
          {tab === 'GENESIS' && (
            <div style={{ maxWidth: 600 }}>
              <div style={S.card}>
                <span style={S.label}>GENESIS 999 — EARLY ACCESS</span>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.8, marginBottom: 16 }}>
                  Purchase Genesis membership with 500 KAUS. Receive monthly fee distributions from K-Arena platform revenue. 0% trading fees permanently.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { coin: 'KAUS', price: '500 KAUS',     usd: '= $500.00', best: true  },
                    { coin: 'USDC', price: '$500.00 USDC', usd: '$500.00',   best: false },
                    { coin: 'ETH',  price: '~0.154 ETH',   usd: '≈ $500',    best: false },
                    { coin: 'BTC',  price: '~0.0057 BTC',  usd: '≈ $500',    best: false },
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

                {/* Genesis slots */}
                <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 16, padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', lineHeight: 1.7 }}>
                  {statsLoading ? (
                    <SkeletonRow />
                  ) : stats ? (
                    <>Genesis slots: {stats.genesis_claimed}/999 claimed · <span style={{ color: 'var(--green)' }}>{stats.genesis_remaining} remaining</span></>
                  ) : (
                    'Genesis slots: —/999'
                  )}
                </div>

                <button onClick={handleBuyKaus}
                  style={{ width: '100%', padding: 14, background: wallet ? 'var(--white)' : 'var(--surface-3)', color: wallet ? 'var(--black)' : 'var(--dim)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: 'pointer' }}>
                  {wallet ? 'CLAIM GENESIS WITH CRYPTO →' : 'CONNECT WALLET FIRST'}
                </button>
              </div>
            </div>
          )}

          {/* ── REVENUE MODEL TAB ── */}
          {tab === 'REVENUE' && (
            <div style={{ maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={S.card}>
                <span style={S.label}>REVENUE STRUCTURE</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { source: 'Exchange Fee',    rate: '0.1% per trade',      flow: 'KAUS → feeCollector wallet',         estimated: 'Volume × 0.1%' },
                    { source: 'Genesis Sale',    rate: '500 KAUS/slot × 999', flow: '499,500 KAUS → Treasury',            estimated: '≈ $499,500' },
                    { source: 'KAUS Token Sale', rate: '$1.00 USD fixed',     flow: 'USDC → Treasury',                    estimated: 'On-chain' },
                    { source: 'API Access',      rate: 'TBD',                 flow: 'USDC → Treasury',                    estimated: 'Monthly SaaS' },
                  ].map((r, i) => (
                    <div key={r.source} className="revenue-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr', gap: 16, padding: '13px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'start' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--white)' }}>{r.source}</div>
                      <div style={{ fontSize: 10, color: 'var(--dim)' }}>{r.rate}</div>
                      <div style={{ fontSize: 10, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono' }}>{r.flow}</div>
                      <div style={{ fontSize: 10, color: 'var(--green)', textAlign: 'right' }}>{r.estimated}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <span style={S.label}>WALLET ARCHITECTURE</span>
                <pre style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 2, fontFamily: 'IBM Plex Mono', margin: 0, whiteSpace: 'pre-wrap' }}>{`Treasury (Gnosis Safe — 2/3 multisig)
├── 0xe48f48c00adf4c572608F3e0CC3CCF850022c42c
├── Initial KAUS: 10,000,000 KAUS
└── Monthly fee distribution source

Fee Collector (Hot Wallet → Gnosis Safe)
├── Receives: 0.1% of all platform trades
├── Monthly: 50% burned (deflationary)
├── Monthly: 30% → Genesis holders
└── Monthly: 20% retained (Field Nine ops)

KAUS Token Contract (Polygon ERC-20 + Pausable)
├── 0xab443d6a43Be601e20876C2CA0c512e051A6BA26
├── Max Supply: 100,000,000 KAUS
├── Initial Mint: 10,000,000 → Treasury
└── Verified: Sourcify`}</pre>
              </div>

              <div style={S.card}>
                <span style={S.label}>BLOCKCHAIN SETUP CHECKLIST</span>
                {[
                  { done: true,  item: 'KAUS Token Solidity contract written (ERC-20 + Pausable)',      link: null },
                  { done: true,  item: 'Hardhat config: Polygon mainnet + Amoy testnet',                link: null },
                  { done: true,  item: 'deploy-kaus.ts quick deploy script created',                   link: null },
                  { done: true,  item: 'Fund deployer wallet with MATIC',                              link: null },
                  { done: true,  item: 'Set DEPLOYER_PRIVATE_KEY in blockchain/.env',                  link: null },
                  { done: true,  item: 'Deploy to Polygon Mainnet + Sourcify verify',                  link: 'https://polygonscan.com/address/0xab443d6a43Be601e20876C2CA0c512e051A6BA26' },
                  { done: true,  item: 'Add NEXT_PUBLIC_KAUS_CONTRACT to Vercel env',                  link: null },
                  { done: true,  item: 'Set up Gnosis Safe treasury (2/3 multisig)',                   link: 'https://app.safe.global/home?safe=matic:0xe48f48c00adf4c572608F3e0CC3CCF850022c42c' },
                  { done: false, item: 'Create KAUS/USDC QuickSwap liquidity pool',                   link: 'https://quickswap.exchange' },
                  { done: false, item: 'Submit to CoinGecko / CoinMarketCap',                         link: null },
                ].map((c, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 10, color: c.done ? 'var(--green)' : 'var(--dimmer)', flexShrink: 0 }}>{c.done ? '✓' : '○'}</span>
                    <span style={{ fontSize: 11, color: c.done ? 'var(--dim)' : 'var(--white)' }}>{c.item}</span>
                    {c.link && <a href={c.link} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: 'var(--green)', marginLeft: 'auto', flexShrink: 0, textDecoration: 'none' }}>↗</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── FIAT ON-RAMP MODAL ── */}
      {showOnRamp && (
        <div onClick={() => setShowOnRamp(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--white)', fontWeight: 600, letterSpacing: '0.1em' }}>BUY KAUS WITH CARD</div>
              <button onClick={() => setShowOnRamp(false)} style={{ background: 'none', border: 'none', color: 'var(--dimmer)', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.8, marginBottom: 20 }}>
              KAUS is pegged to $1.00 USD on Polygon. Use any of these services to get USDC on Polygon, then swap for KAUS.
            </div>

            <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 12 }}>STEP 1: GET USDC ON POLYGON</div>
            {[
              { name: 'Transak',  desc: 'Card / bank transfer / Apple Pay → USDC on Polygon', link: 'https://global.transak.com/?defaultCryptoCurrency=USDC&network=polygon', badge: 'RECOMMENDED' },
              { name: 'MoonPay',  desc: 'Credit card → USDC on Polygon',                      link: 'https://buy.moonpay.com/?baseCurrencyCode=usd&defaultCurrencyCode=usdc_polygon', badge: null },
              { name: 'Simplex',  desc: 'Visa / Mastercard → MATIC then swap',                link: 'https://buy.simplex.com/?crypto_currency=MATIC', badge: null },
            ].map(p => (
              <a key={p.name} href={p.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--white)', fontWeight: 600, marginBottom: 3 }}>
                      {p.name}
                      {p.badge && <span style={{ fontSize: 8, color: 'var(--green)', border: '1px solid var(--green)', padding: '1px 5px', marginLeft: 8 }}>{p.badge}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--dimmer)' }}>{p.desc}</div>
                  </div>
                  <span style={{ color: 'var(--dimmer)', fontSize: 12 }}>↗</span>
                </div>
              </a>
            ))}

            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em', marginBottom: 8 }}>STEP 2: BUY KAUS</div>
              <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 1.7 }}>
                Once you have USDC on Polygon, connect MetaMask on this page and click <strong style={{ color: 'var(--white)' }}>BUY KAUS</strong>.
                1 USDC = 1 KAUS (fixed peg, $1.00).
              </div>
            </div>

            <button onClick={() => setShowOnRamp(false)}
              style={{ width: '100%', marginTop: 16, padding: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--dimmer)', fontSize: 10, cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
