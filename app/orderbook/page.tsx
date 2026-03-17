'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Order { price: number; size: number; total: number; cumulative: number; side: string }
interface Orderbook {
  pair: string; mid_price: number; best_bid: number; best_ask: number
  spread: number; spread_pct: number; bids: Order[]; asks: Order[]
  total_bid_volume: number; total_ask_volume: number; imbalance: number
}

const PAIRS = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

function fmt(n: number) { return n > 1000 ? n.toLocaleString() : n.toFixed(4) }
function fmtPrice(n: number) { return n > 100 ? n.toLocaleString() : n.toFixed(4) }
function fmtSize(n: number) { return n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n.toFixed(0)}` }

export default function OrderbookPage() {
  const [pair, setPair] = useState('XAU/KAUS')
  const [ob, setOb] = useState<Orderbook | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/orderbook?pair=${encodeURIComponent(pair)}&depth=12`)
      const d = await r.json()
      setOb(prev => {
        if (prev && d.mid_price !== prev.mid_price) {
          setFlash(d.mid_price > prev.mid_price ? 'up' : 'down')
          setTimeout(() => setFlash(null), 600)
        }
        return d
      })
    } catch {}
  }, [pair])

  useEffect(() => { load(); const i = setInterval(load, 2000); return () => clearInterval(i) }, [load])

  const G = 'var(--green)', R = 'var(--red)'
  const maxBid = ob ? Math.max(...ob.bids.map(b => b.size)) : 1
  const maxAsk = ob ? Math.max(...ob.asks.map(a => a.size)) : 1

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'30px',height:'30px',background:G,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'14px',color:'#000'}}>K</div>
            <span style={{fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          </Link>
          <span style={{color:'var(--text3)'}}>/</span>
          <span style={{fontSize:'11px',color:'var(--blue)',fontWeight:600,letterSpacing:'0.1em'}}>ORDERBOOK</span>
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          {PAIRS.map(p => (
            <button key={p} onClick={() => setPair(p)} style={{padding:'4px 10px',border:'1px solid',borderRadius:'2px',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'9px',fontWeight:600,letterSpacing:'0.05em',background:pair===p?'rgba(0,255,136,0.1)':'transparent',color:pair===p?G:'var(--text2)',borderColor:pair===p?'rgba(0,255,136,0.3)':'var(--border2)',transition:'all 0.15s'}}>
              {p.split('/')[0]}
            </button>
          ))}
        </div>
      </nav>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 24px'}}>
        {/* 가격 헤더 */}
        {ob && (
          <div style={{border:'1px solid var(--border2)',background:'var(--bg2)',padding:'20px 24px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
            <div>
              <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'6px'}}>{ob.pair}</div>
              <div style={{
                fontSize:'32px',fontWeight:800,letterSpacing:'-0.03em',lineHeight:1,
                color: flash === 'up' ? G : flash === 'down' ? R : 'var(--text)',
                transition: 'color 0.3s',
              }}>
                {fmtPrice(ob.mid_price)}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
              {[
                ['Best Bid', fmtPrice(ob.best_bid), G],
                ['Best Ask', fmtPrice(ob.best_ask), R],
                ['Spread', `${ob.spread_pct.toFixed(3)}%`, 'var(--text)'],
                ['Imbalance', `${ob.imbalance > 0 ? '+' : ''}${ob.imbalance.toFixed(1)}%`, ob.imbalance > 10 ? G : ob.imbalance < -10 ? R : 'var(--text)'],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'4px'}}>{l}</div>
                  <div style={{fontSize:'13px',fontWeight:600,color:c as string}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 호가창 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
          {/* Bids */}
          <div style={{border:'1px solid var(--border2)'}}>
            <div style={{padding:'8px 16px',background:'rgba(0,255,136,0.05)',borderBottom:'1px solid var(--border2)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              {['Price','Size','Cumul.'].map(h => <span key={h} style={{fontSize:'9px',color:'var(--text3)',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase'}}>{h}</span>)}
            </div>
            {(ob?.bids || []).map((bid, i) => (
              <div key={i} style={{position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',padding:'8px 16px',borderBottom:'1px solid var(--border2)',transition:'background 0.1s'}}
                onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
                {/* 뎁스 바 */}
                <div style={{position:'absolute',left:0,top:0,bottom:0,width:`${(bid.size/maxBid)*100}%`,background:'rgba(0,255,136,0.06)',zIndex:0}}/>
                <span style={{fontSize:'12px',fontWeight:600,color:G,position:'relative',zIndex:1}}>{fmtPrice(bid.price)}</span>
                <span style={{fontSize:'11px',color:'var(--text)',position:'relative',zIndex:1}}>{fmtSize(bid.size)}</span>
                <span style={{fontSize:'10px',color:'var(--text3)',position:'relative',zIndex:1}}>{fmtSize(bid.cumulative)}</span>
              </div>
            ))}
            <div style={{padding:'8px 16px',background:'rgba(0,255,136,0.03)',borderTop:'1px solid var(--border2)',fontSize:'10px',color:G}}>
              Total Bids: {ob ? fmtSize(ob.total_bid_volume) : '—'}
            </div>
          </div>

          {/* Asks */}
          <div style={{border:'1px solid var(--border2)'}}>
            <div style={{padding:'8px 16px',background:'rgba(255,51,102,0.05)',borderBottom:'1px solid var(--border2)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
              {['Price','Size','Cumul.'].map(h => <span key={h} style={{fontSize:'9px',color:'var(--text3)',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase'}}>{h}</span>)}
            </div>
            {(ob?.asks || []).map((ask, i) => (
              <div key={i} style={{position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',padding:'8px 16px',borderBottom:'1px solid var(--border2)',transition:'background 0.1s'}}
                onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='')}>
                <div style={{position:'absolute',right:0,top:0,bottom:0,width:`${(ask.size/maxAsk)*100}%`,background:'rgba(255,51,102,0.06)',zIndex:0}}/>
                <span style={{fontSize:'12px',fontWeight:600,color:R,position:'relative',zIndex:1}}>{fmtPrice(ask.price)}</span>
                <span style={{fontSize:'11px',color:'var(--text)',position:'relative',zIndex:1}}>{fmtSize(ask.size)}</span>
                <span style={{fontSize:'10px',color:'var(--text3)',position:'relative',zIndex:1}}>{fmtSize(ask.cumulative)}</span>
              </div>
            ))}
            <div style={{padding:'8px 16px',background:'rgba(255,51,102,0.03)',borderTop:'1px solid var(--border2)',fontSize:'10px',color:R}}>
              Total Asks: {ob ? fmtSize(ob.total_ask_volume) : '—'}
            </div>
          </div>
        </div>

        {/* 바로 거래 CTA */}
        <div style={{marginTop:'16px',display:'flex',gap:'8px'}}>
          <Link href="/exchange" style={{flex:1,display:'block',textAlign:'center',padding:'12px',background:G,color:'#000',borderRadius:'2px',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none'}}>
            BUY {pair.split('/')[0]} →
          </Link>
          <Link href="/exchange" style={{flex:1,display:'block',textAlign:'center',padding:'12px',background:R,color:'#fff',borderRadius:'2px',fontFamily:'JetBrains Mono, monospace',fontSize:'11px',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',textDecoration:'none'}}>
            SELL {pair.split('/')[0]} →
          </Link>
        </div>

        <div style={{marginTop:'8px',fontSize:'9px',color:'var(--text3)',textAlign:'center'}}>
          Auto-refresh every 2 seconds · Simulated orderbook · Real execution via /api/exchange
        </div>
      </div>
    </div>
  )
}
