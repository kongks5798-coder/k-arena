'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface PlatformStats {
  active_agents: number
  genesis_claimed: number
  genesis_remaining: number
  total_transactions: number
  volume_24h: number
}

// KAUS = $1.00 USD 고정 페그 (CLAUDE.md 규칙 준수)
const KAUS_PRICE_USD = 1.00
const KAUS_CONTRACT  = process.env.NEXT_PUBLIC_KAUS_CONTRACT ?? ''
const DEPLOYED = !!KAUS_CONTRACT

// Polygon Amoy testnet (현재 공식 테스트넷)
const AMOY_CHAIN_ID     = '0x13882' // 80002
const MAINNET_CHAIN_ID  = '0x89'    // 137

const AMOY_PARAMS = {
  chainId: AMOY_CHAIN_ID,
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://rpc-amoy.polygon.technology'],
  blockExplorerUrls: ['https://amoy.polygonscan.com'],
}

const POLYGON_PARAMS = {
  chainId: MAINNET_CHAIN_ID,
  chainName: 'Polygon Mainnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
}

// Minimal ERC-20 ABI for balance query
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

type Tab = 'BUY_KAUS' | 'GENESIS' | 'REVENUE'

export default function BuyKausPage() {
  const [tab, setTab] = useState<Tab>('BUY_KAUS')
  const [wallet, setWallet] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [kausBalance, setKausBalance] = useState<string | null>(null)
  const [kausAmt, setKausAmt] = useState(500)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [txStatus, setTxStatus] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => { if (d.ok) setStats(d.stats) }).catch(() => {})

    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((res) => {
        const accounts = res as string[]
        if (accounts?.[0]) setWallet(accounts[0])
      }).catch(() => {})

      window.ethereum.request({ method: 'eth_chainId' }).then((id) => {
        setChainId(id as string)
      }).catch(() => {})

      const handleChainChange = (id: unknown) => setChainId(id as string)
      const handleAccountsChange = (accs: unknown) => {
        const accounts = accs as string[]
        setWallet(accounts?.[0] ?? null)
      }
      window.ethereum.on('chainChanged', handleChainChange)
      window.ethereum.on('accountsChanged', handleAccountsChange)
    }
  }, [])

  // Fetch KAUS balance from contract
  const fetchKausBalance = useCallback(async (address: string) => {
    if (!DEPLOYED || !window.ethereum) return
    try {
      // Use eth_call with ERC-20 balanceOf selector: 0x70a08231
      const paddedAddr = address.slice(2).padStart(64, '0')
      const data = '0x70a08231' + paddedAddr
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: KAUS_CONTRACT, data }, 'latest'],
      }) as string
      if (result && result !== '0x') {
        const balance = BigInt(result)
        const formatted = (Number(balance) / 1e18).toFixed(2)
        setKausBalance(formatted)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (wallet) fetchKausBalance(wallet)
  }, [wallet, fetchKausBalance])

  const switchToAmoy = async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: AMOY_CHAIN_ID }] })
    } catch (e: unknown) {
      if ((e as { code?: number }).code === 4902) {
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [AMOY_PARAMS] })
      }
    }
  }

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
      if (accounts[0]) {
        setWallet(accounts[0])
        await switchToAmoy()  // Default to Amoy testnet
      }
    } catch {}
    setConnecting(false)
  }

  const addKausToMetaMask = async () => {
    if (!window.ethereum || !DEPLOYED) return
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: KAUS_CONTRACT,
            symbol: 'KAUS',
            decimals: 18,
            image: 'https://karena.fieldnine.io/kaus-logo.png',
          },
        }],
      })
    } catch {}
  }

  const handleBuyKaus = async () => {
    if (!wallet) { await connectWallet(); return }
    if (!DEPLOYED) {
      setTxStatus({ msg: '⚠ Contract not yet deployed. Deploy to Polygon first.', ok: false })
      setTimeout(() => setTxStatus(null), 5000)
      return
    }
    if (!isOnPolygon) {
      await switchToPolygon()
      setTxStatus({ msg: 'Please switch to Polygon Mainnet and try again.', ok: false })
      setTimeout(() => setTxStatus(null), 4000)
      return
    }

    // USDC on Polygon mainnet (native USDC, 6 decimals)
    const POLYGON_USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
    const usdcAmount6  = Math.floor(kausAmt * 1_000_000) // 6 decimals

    try {
      setTxStatus({ msg: 'Step 1/3: Approving USDC...', ok: true })

      // approve(KAUS_CONTRACT, usdcAmount) — selector 0x095ea7b3
      const approveData = '0x095ea7b3' +
        KAUS_CONTRACT.slice(2).padStart(64, '0') +
        usdcAmount6.toString(16).padStart(64, '0')

      const approveTx = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ from: wallet, to: POLYGON_USDC, data: approveData }],
      }) as string

      setTxStatus({ msg: `Step 2/3: Approval sent (${approveTx.slice(0, 10)}...). Buying KAUS...`, ok: true })

      // buyWithUSDC(usdcAmount) — selector 0x6b1c2600
      const buyData = '0x6b1c2600' + usdcAmount6.toString(16).padStart(64, '0')
      const buyTx = await window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ from: wallet, to: KAUS_CONTRACT, data: buyData }],
      }) as string

      setTxStatus({ msg: `Step 3/3: Recording purchase...`, ok: true })

      // Record purchase in DB
      await fetch('/api/kaus/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_wallet: wallet,
          amount_usd: kausAmt,
          amount_kaus: kausAmt * 0.999, // net of 0.1% fee
          tx_hash: buyTx,
          status: 'confirmed',
        }),
      })

      setTxStatus({ msg: `✅ Purchased ${kausAmt.toLocaleString()} KAUS! Tx: ${buyTx.slice(0, 10)}...`, ok: true })
      await fetchKausBalance(wallet)
      setTimeout(() => setTxStatus(null), 8000)
    } catch (e: unknown) {
      const err = e as { code?: number; message?: string }
      if (err.code === 4001) {
        setTxStatus({ msg: 'Transaction cancelled.', ok: false })
      } else {
        setTxStatus({ msg: `Error: ${err.message?.slice(0, 80) ?? 'Unknown error'}`, ok: false })
      }
      setTimeout(() => setTxStatus(null), 6000)
    }
  }

  const isOnAmoy = chainId === AMOY_CHAIN_ID
  const isOnPolygon = chainId === MAINNET_CHAIN_ID
  const usdCost = (kausAmt * KAUS_PRICE_USD).toFixed(2)
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
            {/* Network indicator */}
            {isOnAmoy && <span style={{ fontSize: 9, padding: '2px 7px', border: '1px solid #8b5cf6', color: '#8b5cf6', fontFamily: 'IBM Plex Mono' }}>AMOY</span>}
            {isOnPolygon && <span style={{ fontSize: 9, padding: '2px 7px', border: '1px solid var(--green)', color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>POLYGON</span>}
            {!isOnAmoy && !isOnPolygon && (
              <button onClick={switchToAmoy} style={{ fontSize: 9, padding: '2px 7px', border: '1px solid #f59e0b', color: '#f59e0b', background: 'none', cursor: 'pointer' }}>SWITCH NETWORK</button>
            )}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
            {kausBalance !== null && DEPLOYED && (
              <span style={{ fontSize: 9, color: 'var(--dim)', fontFamily: 'IBM Plex Mono' }}>{kausBalance} KAUS</span>
            )}
            <button onClick={() => setWallet(null)} style={{ fontSize: 9, color: 'var(--dimmer)', background: 'none', border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer' }}>DISCONNECT</button>
          </div>
        ) : (
          <button onClick={connectWallet} disabled={connecting} style={{ fontSize: 9, padding: '5px 14px', background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', cursor: 'pointer', letterSpacing: '0.1em' }}>
            {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
          </button>
        )
      } />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Testnet / Pre-launch banner */}
          {!DEPLOYED && (
            <div style={{ border: '1px solid #8b5cf6', background: 'rgba(139,92,246,0.07)', padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: 9, color: '#8b5cf6', fontFamily: 'IBM Plex Mono', fontWeight: 600, letterSpacing: '0.1em' }}>TESTNET MODE</span>
                <span style={{ fontSize: 10, color: 'var(--dim)', marginLeft: 12 }}>Contract not yet deployed. Deploy to Polygon Amoy with: <code style={{ color: '#8b5cf6' }}>npx hardhat run scripts/deploy-kaus.ts --network amoy</code></span>
              </div>
              <button onClick={switchToAmoy} style={{ fontSize: 9, padding: '4px 12px', border: '1px solid #8b5cf6', color: '#8b5cf6', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                ADD AMOY NETWORK
              </button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {([['BUY_KAUS', 'BUY KAUS'], ['GENESIS', 'GENESIS 999'], ['REVENUE', 'REVENUE MODEL']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{ fontSize: 10, padding: '10px 20px', letterSpacing: '0.1em', background: tab === t ? 'var(--surface-3)' : 'transparent', color: tab === t ? 'var(--white)' : 'var(--dimmer)', border: 'none', borderBottom: tab === t ? '1px solid var(--green)' : '1px solid transparent', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── BUY KAUS TAB ── */}
          {tab === 'BUY_KAUS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, maxWidth: 900 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={S.card}>
                  <span style={S.label}>KAUS AMOUNT</span>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={kausAmt} onChange={e => setKausAmt(Math.max(1, Number(e.target.value)))}
                      style={{ width: '100%', padding: '12px 60px 12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 600 }} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--dim)' }}>KAUS</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {QUICK_AMOUNTS.map(a => (
                      <button key={a} onClick={() => setKausAmt(a)} style={{ fontSize: 9, padding: '4px 10px', background: kausAmt === a ? 'var(--surface-3)' : 'transparent', border: `1px solid ${kausAmt === a ? 'var(--border-mid)' : 'var(--border)'}`, color: kausAmt === a ? 'var(--white)' : 'var(--dimmer)', cursor: 'pointer' }}>
                        {a.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet connect CTA */}
                {!wallet && (
                  <div style={{ ...S.card, border: '1px solid rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.03)' }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12, lineHeight: 1.7 }}>
                      Connect MetaMask to view your KAUS balance and purchase tokens on Polygon.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={connectWallet} disabled={connecting}
                        style={{ flex: 1, padding: 10, background: 'transparent', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>
                        {connecting ? 'CONNECTING...' : 'CONNECT METAMASK'}
                      </button>
                      <button onClick={switchToAmoy}
                        style={{ padding: 10, background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', fontSize: 10, letterSpacing: '0.08em', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + AMOY TESTNET
                      </button>
                    </div>
                  </div>
                )}

                {/* KAUS balance display (when connected + deployed) */}
                {wallet && DEPLOYED && kausBalance !== null && (
                  <div style={{ ...S.card, border: '1px solid rgba(0,255,136,0.2)' }}>
                    <span style={S.label}>YOUR KAUS BALANCE</span>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>
                      {kausBalance} <span style={{ fontSize: 14, color: 'var(--dim)' }}>KAUS</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--dimmer)', marginTop: 4 }}>
                      ≈ ${(Number(kausBalance) * KAUS_PRICE_USD).toFixed(2)} USD · {isOnAmoy ? 'Amoy Testnet' : isOnPolygon ? 'Polygon Mainnet' : 'Unknown Network'}
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
              </div>

              {/* Order summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={S.card}>
                  <span style={S.label}>ORDER SUMMARY</span>
                  {[
                    ['Amount',       `${kausAmt.toLocaleString()} KAUS`],
                    ['Price / KAUS', `$${KAUS_PRICE_USD.toFixed(2)} USD`],
                    ['Network fee',  '≈ $0.01 MATIC'],
                    ['Platform fee', '0%'],
                  ].map(([k, v]) => (
                    <div key={k} style={S.row}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: 'var(--white)' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: 'var(--dimmer)' }}>TOTAL</span>
                    <span style={{ color: 'var(--green)' }}>${usdCost} USD</span>
                  </div>
                </div>

                <div style={S.card}>
                  <span style={S.label}>TOKEN INFO</span>
                  {[
                    ['Contract',   DEPLOYED ? `${KAUS_CONTRACT.slice(0, 6)}...${KAUS_CONTRACT.slice(-4)}` : 'Not deployed'],
                    ['Standard',   'ERC-20'],
                    ['Max Supply', '100,000,000 KAUS'],
                    ['Fee Rate',   '0.1% per trade'],
                    ['Chain',      DEPLOYED ? 'Polygon' : 'Amoy Testnet (soon)'],
                    ['Status',     DEPLOYED ? '✅ Live' : '🔧 Pre-launch'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ ...S.row, fontSize: 10 }}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: DEPLOYED && k === 'Status' ? 'var(--green)' : !DEPLOYED && k === 'Status' ? '#f59e0b' : 'var(--white)' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Network switch buttons */}
                <div style={S.card}>
                  <span style={S.label}>NETWORKS</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={switchToAmoy}
                      style={{ width: '100%', padding: '8px', background: isOnAmoy ? 'rgba(139,92,246,0.1)' : 'transparent', border: `1px solid ${isOnAmoy ? '#8b5cf6' : 'var(--border)'}`, color: isOnAmoy ? '#8b5cf6' : 'var(--dim)', fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer' }}>
                      {isOnAmoy ? '✓ ' : ''}POLYGON AMOY TESTNET
                    </button>
                    <button onClick={switchToPolygon}
                      style={{ width: '100%', padding: '8px', background: isOnPolygon ? 'rgba(0,255,136,0.07)' : 'transparent', border: `1px solid ${isOnPolygon ? 'var(--green)' : 'var(--border)'}`, color: isOnPolygon ? 'var(--green)' : 'var(--dim)', fontSize: 9, letterSpacing: '0.1em', cursor: 'pointer' }}>
                      {isOnPolygon ? '✓ ' : ''}POLYGON MAINNET
                    </button>
                    <button onClick={addKausToMetaMask} disabled={!DEPLOYED}
                      style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${DEPLOYED ? 'var(--border-mid)' : 'var(--border)'}`, color: DEPLOYED ? 'var(--dim)' : 'var(--dimmer)', fontSize: 9, letterSpacing: '0.1em', cursor: DEPLOYED ? 'pointer' : 'not-allowed' }}
                      onMouseEnter={e => { if (DEPLOYED) e.currentTarget.style.borderColor = 'var(--amber)' }}
                      onMouseLeave={e => { if (DEPLOYED) e.currentTarget.style.borderColor = 'var(--border-mid)' }}>
                      + ADD KAUS TO METAMASK {!DEPLOYED ? '(after deploy)' : ''}
                    </button>
                  </div>
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
                  Purchase Genesis membership with 500 KAUS. Receive monthly fee distributions from K-Arena platform revenue.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { coin: 'KAUS',  price: '500 KAUS',       usd: '= $500.00', best: true },
                    { coin: 'USDC',  price: '$500.00 USDC',   usd: '$500.00',   best: false },
                    { coin: 'ETH',   price: '~0.154 ETH',     usd: '≈ $500',    best: false },
                    { coin: 'BTC',   price: '~0.0057 BTC',    usd: '≈ $500',    best: false },
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
                    { source: 'Exchange Fee',    rate: '0.1% per trade',      flow: 'KAUS → feeCollector wallet',       estimated: 'Volume × 0.1%' },
                    { source: 'Genesis Sale',    rate: '500 KAUS/slot × 999', flow: '499,500 KAUS → Treasury',           estimated: '≈ $499,500' },
                    { source: 'KAUS Token Sale', rate: '$1.00 USD fixed',      flow: 'USDC → Treasury',                   estimated: 'On-chain' },
                    { source: 'API Access',      rate: 'TBD',                 flow: 'USDC → Treasury',                   estimated: 'Monthly SaaS' },
                  ].map((r, i) => (
                    <div key={r.source} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr 1fr', gap: 16, padding: '13px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'start' }}>
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
                <pre style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 2, fontFamily: 'IBM Plex Mono', margin: 0, whiteSpace: 'pre-wrap' }}>{`Treasury Wallet (Gnosis Safe — 2/3 multisig)
├── Initial KAUS: 10,000,000 KAUS
├── Genesis revenue: 499,500 KAUS (when sold out)
└── Monthly fee distribution source

Fee Collector Wallet (Hot Wallet)
├── Receives: 0.1% of all platform trades (KAUS)
├── Monthly: 50% burned (deflationary)
├── Monthly: 30% → Genesis holders (distributed equally)
└── Monthly: 20% retained (Field Nine ops)

KAUS Token Contract (Polygon ERC-20)
├── Max Supply: 100,000,000 KAUS
├── Initial Mint: 10,000,000 → Treasury
└── Burn: Deflationary via monthly fee burns`}</pre>
              </div>

              <div style={S.card}>
                <span style={S.label}>BLOCKCHAIN SETUP CHECKLIST</span>
                {[
                  { done: true,  item: 'KAUS Token Solidity contract written (ERC-20, OpenZeppelin)', link: null },
                  { done: true,  item: 'Hardhat config: Polygon mainnet + Amoy testnet + Mumbai',    link: null },
                  { done: true,  item: 'deploy-kaus.ts quick deploy script created',                 link: null },
                  { done: false, item: 'Fund deployer wallet with test MATIC (Amoy faucet)',          link: 'https://faucet.polygon.technology' },
                  { done: false, item: 'Set DEPLOYER_PRIVATE_KEY in blockchain/.env',                link: null },
                  { done: false, item: 'Deploy to Polygon Amoy testnet + Polygonscan verify',        link: 'https://amoy.polygonscan.com' },
                  { done: false, item: 'Add NEXT_PUBLIC_KAUS_CONTRACT to Vercel env',                link: null },
                  { done: false, item: 'Deploy to Polygon Mainnet + verify',                         link: 'https://polygonscan.com' },
                  { done: false, item: 'Set up Gnosis Safe treasury (app.safe.global)',              link: 'https://app.safe.global' },
                  { done: false, item: 'Create KAUS/USDC QuickSwap liquidity pool',                  link: 'https://quickswap.exchange' },
                  { done: false, item: 'Submit to CoinGecko / CoinMarketCap',                        link: null },
                ].map((c, i, arr) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 10, color: c.done ? 'var(--green)' : 'var(--dimmer)', flexShrink: 0 }}>{c.done ? '✓' : '○'}</span>
                    <span style={{ fontSize: 11, color: c.done ? 'var(--dim)' : 'var(--white)' }}>{c.item}</span>
                    {c.link && <a href={c.link} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: 'var(--blue)', marginLeft: 'auto', flexShrink: 0 }}>↗</a>}
                  </div>
                ))}
              </div>

              {/* Deploy commands */}
              <div style={S.card}>
                <span style={S.label}>DEPLOY COMMANDS</span>
                <pre style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'IBM Plex Mono', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-wrap' }}>{`# 1. Install dependencies
cd blockchain && npm install

# 2. Create .env
echo "DEPLOYER_PRIVATE_KEY=0x..." > .env

# 3. Compile contract
npx hardhat compile

# 4. Test locally
npx hardhat test

# 5. Deploy to Amoy testnet (recommended)
npx hardhat run scripts/deploy-kaus.ts --network amoy

# 6. Deploy to Polygon mainnet
npx hardhat run scripts/deploy-kaus.ts --network polygon`}</pre>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
