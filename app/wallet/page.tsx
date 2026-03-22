'use client'
import { useState, useEffect, useCallback } from 'react'

const KAUS_CONTRACT = process.env.NEXT_PUBLIC_KAUS_CONTRACT || '0xfBfbb12E10f8b3418C278147F37507526670B247'
const USDC_CONTRACT = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
const POLYGON_CHAIN_ID = '0x89'

function encodeBalanceOf(addr: string): string {
  const sig = '0x70a08231'
  const padded = addr.replace('0x', '').padStart(64, '0')
  return sig + padded
}

function encodeTransfer(to: string, amountHex: string): string {
  const sig = '0xa9059cbb'
  const toHex = to.replace('0x', '').padStart(64, '0')
  const amtHex = amountHex.replace('0x', '').padStart(64, '0')
  return sig + toHex + amtHex
}

function formatUnits(hex: string, decimals: number): string {
  const value = BigInt(hex)
  const divisor = BigInt(10 ** decimals)
  const whole = value / divisor
  const frac = value % divisor
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, 4).replace(/0+$/, '')
  return fracStr ? `${whole}.${fracStr}` : `${whole}`
}

function parseUnits18(amount: string): string {
  const [whole, frac = ''] = amount.split('.')
  const fracPadded = (frac + '0'.repeat(18)).slice(0, 18)
  const val = BigInt(whole) * BigInt(10 ** 18) + BigInt(fracPadded)
  return '0x' + val.toString(16)
}

export default function WalletPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [kausBalance, setKausBalance] = useState('--')
  const [usdcBalance, setUsdcBalance] = useState('--')
  const [totalSupply, setTotalSupply] = useState('--')
  const [totalFees, setTotalFees] = useState('--')
  const [sendTo, setSendTo] = useState('')
  const [sendAmt, setSendAmt] = useState('')
  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const getEth = () => (window as any).ethereum

  const loadBalances = useCallback(async (addr: string) => {
    const eth = getEth()
    if (!eth) return
    try {
      const [kb, ub, ts, tf] = await Promise.all([
        eth.request({ method: 'eth_call', params: [{ to: KAUS_CONTRACT, data: encodeBalanceOf(addr) }, 'latest'] }),
        eth.request({ method: 'eth_call', params: [{ to: USDC_CONTRACT, data: encodeBalanceOf(addr) }, 'latest'] }),
        eth.request({ method: 'eth_call', params: [{ to: KAUS_CONTRACT, data: '0x18160ddd' }, 'latest'] }),
        eth.request({ method: 'eth_call', params: [{ to: KAUS_CONTRACT, data: '0x7a8a8f2d' }, 'latest'] }),
      ])
      setKausBalance(formatUnits(kb, 18))
      setUsdcBalance(formatUnits(ub, 6))
      setTotalSupply(formatUnits(ts, 18))
      setTotalFees(formatUnits(tf, 18))
    } catch {}
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch('/api/kaus/revenue')
      const d = await r.json()
      setHistory(d.purchases || [])
    } catch {}
  }, [])

  const connect = async () => {
    setError('')
    const eth = getEth()
    if (!eth) { setError('MetaMask가 설치되어 있지 않습니다.'); return }
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: POLYGON_CHAIN_ID }] })
    } catch (e: any) {
      if (e.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: POLYGON_CHAIN_ID,
            chainName: 'Polygon Mainnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://polygon-bor-rpc.publicnode.com'],
            blockExplorerUrls: ['https://polygonscan.com']
          }]
        })
      }
    }
    const accounts = await eth.request({ method: 'eth_requestAccounts' })
    const addr = accounts[0]
    setAccount(addr)
    await Promise.all([loadBalances(addr), loadHistory()])
  }

  const addToMetaMask = async () => {
    const eth = getEth()
    if (!eth) return
    await eth.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: { address: KAUS_CONTRACT, symbol: 'KAUS', decimals: 18, image: 'https://karena.fieldnine.io/brand/kaus-logo.svg' }
      }
    })
  }

  const sendKaus = async () => {
    if (!account || !sendTo || !sendAmt) return
    setSending(true); setError(''); setStatus('')
    try {
      const eth = getEth()
      const amtHex = parseUnits18(sendAmt)
      const data = encodeTransfer(sendTo, amtHex)
      const hash = await eth.request({
        method: 'eth_sendTransaction',
        params: [{ from: account, to: KAUS_CONTRACT, data, gas: '0x15F90' }]
      })
      setTxHash(hash)
      setStatus('전송 완료!')
      setSendTo(''); setSendAmt('')
      setTimeout(() => loadBalances(account), 3000)
    } catch (e: any) {
      setError(e.message || '전송 실패')
    }
    setSending(false)
  }

  useEffect(() => {
    const eth = getEth()
    if (eth) {
      eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts[0]) { setAccount(accounts[0]); loadBalances(accounts[0]); loadHistory() }
      })
    }
  }, [loadBalances, loadHistory])

  const mono = { fontFamily: 'IBM Plex Mono, monospace' }
  const card: React.CSSProperties = { border: '1px solid #1a1a1a', background: '#0d0d0d', padding: '20px 24px' }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0F0EC', ...mono, padding: '48px 32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>K-ARENA / WALLET</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>KAUS WALLET</h1>
        <p style={{ fontSize: 11, color: '#555', marginBottom: 32 }}>Polygon Mainnet · {KAUS_CONTRACT.slice(0, 10)}...</p>

        {!account ? (
          <button onClick={connect} style={{ background: '#00FF88', color: '#000', border: 'none', padding: '14px 32px', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.1em', ...mono }}>
            CONNECT METAMASK
          </button>
        ) : (
          <>
            <div style={{ ...card, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.15em', marginBottom: 4 }}>CONNECTED WALLET</div>
                <div style={{ fontSize: 13, color: '#00FF88' }}>{account.slice(0, 8)}...{account.slice(-6)}</div>
              </div>
              <button onClick={addToMetaMask} style={{ background: 'transparent', border: '1px solid #333', color: '#888', padding: '8px 16px', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', ...mono }}>
                + ADD TO METAMASK
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'KAUS BALANCE', value: `${kausBalance} KAUS`, color: '#00FF88' },
                { label: 'USDC BALANCE', value: `${usdcBalance} USDC`, color: '#F0F0EC' },
                { label: 'TOTAL SUPPLY', value: `${totalSupply} KAUS`, color: '#888' },
                { label: 'TOTAL FEES COLLECTED', value: `${totalFees} KAUS`, color: '#888' },
              ].map(c => (
                <div key={c.label} style={card}>
                  <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ ...card, marginBottom: 32 }}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 16 }}>SEND KAUS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={sendTo}
                  onChange={e => setSendTo(e.target.value)}
                  placeholder="Recipient address (0x...)"
                  style={{ flex: 2, minWidth: 200, background: '#111', border: '1px solid #222', color: '#F0F0EC', padding: '10px 12px', fontSize: 11, ...mono }}
                />
                <input
                  value={sendAmt}
                  onChange={e => setSendAmt(e.target.value)}
                  placeholder="Amount"
                  style={{ flex: 1, minWidth: 100, background: '#111', border: '1px solid #222', color: '#F0F0EC', padding: '10px 12px', fontSize: 11, ...mono }}
                />
                <button onClick={sendKaus} disabled={sending} style={{ background: sending ? '#333' : '#00FF88', color: '#000', border: 'none', padding: '10px 24px', fontSize: 12, fontWeight: 700, cursor: sending ? 'default' : 'pointer', ...mono }}>
                  {sending ? 'SENDING...' : 'SEND'}
                </button>
              </div>
              {error && <div style={{ marginTop: 8, fontSize: 11, color: '#ff4444' }}>{error}</div>}
              {status && <div style={{ marginTop: 8, fontSize: 11, color: '#00FF88' }}>{status}</div>}
              {txHash && (
                <div style={{ marginTop: 8, fontSize: 10, color: '#555' }}>
                  TX: <a href={`https://polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00FF88' }}>{txHash.slice(0, 20)}...</a>
                </div>
              )}
            </div>

            <div style={card}>
              <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 16 }}>PURCHASE HISTORY</div>
              {history.length === 0 ? (
                <div style={{ fontSize: 11, color: '#333' }}>구매 내역 없음</div>
              ) : (
                history.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #111', fontSize: 11, color: '#888' }}>
                    <span style={{ color: '#F0F0EC' }}>{p.buyer_wallet?.slice(0, 8)}...{p.buyer_wallet?.slice(-4)}</span>
                    <span style={{ color: '#00FF88' }}>+{p.amount_kaus} KAUS</span>
                    <span>${p.amount_usd}</span>
                    {p.tx_hash && (
                      <a href={`https://polygonscan.com/tx/${p.tx_hash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'none', fontSize: 9 }}>PolygonScan →</a>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/buy-kaus" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>← BUY KAUS</a>
          <a href="/liquidity" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>LIQUIDITY POOL →</a>
          <a href={`https://polygonscan.com/token/${KAUS_CONTRACT}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>POLYGONSCAN ↗</a>
        </div>
      </div>
    </div>
  )
}
