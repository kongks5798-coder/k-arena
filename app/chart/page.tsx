'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface Candle {
  timestamp: string; open: number; high: number; low: number; close: number; volume: number
}
interface ChartData {
  symbol: string; period: string; current_price: number; open_price: number
  change_pct: number; high: number; low: number; volume_24h: number; history: Candle[]
}

const PERIODS = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

const PAIRS = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

export default function ChartPage() {
  const [period, setPeriod] = useState('24h')
  const [pair, setPair] = useState('KAUS/USD')
  const [data, setData] = useState<ChartData | null>(null)
  const [hovered, setHovered] = useState<Candle | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/kaus-chart?period=${period}`)
      setData(await r.json())
    } catch {}
  }, [period])

  useEffect(() => { load(); const i = setInterval(load, 8000); return () => clearInterval(i) }, [load])

  const G = 'var(--green)', R = 'var(--red)'
  const isUp = (data?.change_pct || 0) >= 0

  // SVG 캔들스틱 차트
  const renderCandlestick = () => {
    if (!data?.history?.length) return null
    const h = data.history.slice(-48) // 최근 48개 표시
    const W = 900, H = 220, PAD = { t:8, b:24, l:8, r:60 }
    const chartW = W - PAD.l - PAD.r
    const chartH = H - PAD.t - PAD.b

    const prices = h.flatMap(c => [c.high, c.low])
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 0.001
    const candleW = Math.max(2, chartW / h.length - 2)

    const toY = (p: number) => PAD.t + (1 - (p - minP) / range) * chartH
    const toX = (i: number) => PAD.l + (i + 0.5) * (chartW / h.length)

    // Y 축 레이블
    const yLabels = [0.1, 0.3, 0.5, 0.7, 0.9].map(pct => ({
      y: PAD.t + pct * chartH,
      price: maxP - pct * range,
    }))

    const volumes = h.map(c => c.volume)
    const maxVol = Math.max(...volumes)

    return (
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'220px',display:'block',cursor:'crosshair'}}>
        {/* 배경 그리드 */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={l.y} x2={W-PAD.r} y2={l.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <text x={W-PAD.r+4} y={l.y+4} fontSize="8" fill="#4a6358" fontFamily="monospace">
              {l.price > 1 ? l.price.toFixed(2) : l.price.toFixed(4)}
            </text>
          </g>
        ))}

        {/* 볼륨 바 (하단 20%) */}
        {h.map((c, i) => {
          const volH = (c.volume / maxVol) * (chartH * 0.2)
          const x = toX(i)
          const isGreen = c.close >= c.open
          return (
            <rect key={`vol-${i}`}
              x={x - candleW/2} y={H - PAD.b - volH}
              width={candleW} height={volH}
              fill={isGreen ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)'}/>
          )
        })}

        {/* 캔들스틱 */}
        {h.map((c, i) => {
          const x = toX(i)
          const isGreen = c.close >= c.open
          const color = isGreen ? '#00ff88' : '#ff3366'
          const openY = toY(c.open)
          const closeY = toY(c.close)
          const highY = toY(c.high)
          const lowY = toY(c.low)
          const bodyTop = Math.min(openY, closeY)
          const bodyH = Math.max(1, Math.abs(closeY - openY))

          return (
            <g key={i}
              onMouseEnter={() => setHovered(c)}
              onMouseLeave={() => setHovered(null)}>
              {/* 위크 (고가-저가) */}
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1"/>
              {/* 바디 */}
              <rect x={x - candleW/2} y={bodyTop} width={candleW} height={bodyH}
                fill={isGreen ? color : color} opacity={isGreen ? 0.9 : 0.8}
                stroke={color} strokeWidth="0.5"/>
            </g>
          )
        })}

        {/* 현재가 라인 */}
        {data && (() => {
          const lastClose = h[h.length-1].close
          const y = toY(lastClose)
          return (
            <g>
              <line x1={PAD.l} y1={y} x2={W-PAD.r} y2={y}
                stroke={isUp ? '#00ff88' : '#ff3366'} strokeWidth="1" strokeDasharray="4,4" opacity="0.6"/>
              <rect x={W-PAD.r} y={y-8} width={PAD.r-2} height={16}
                fill={isUp ? '#00ff88' : '#ff3366'} opacity="0.9" rx="1"/>
              <text x={W-PAD.r+3} y={y+4} fontSize="9" fill="#000" fontFamily="monospace" fontWeight="bold">
                {lastClose > 1 ? lastClose.toFixed(2) : lastClose.toFixed(4)}
              </text>
            </g>
          )
        })()}
      </svg>
    )
  }

  const displayData = hovered || data?.history[data.history.length - 1]

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px',textDecoration:'none'}}>
            <div style={{width:'28px',height:'28px',background:G,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'13px',color:'#000'}}>K</div>
            <span style={{fontWeight:700,fontSize:'12px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          </Link>
          <span style={{color:'var(--text3)'}}>/</span>
          <span style={{fontSize:'11px',color:G,fontWeight:600,letterSpacing:'0.1em'}}>CHART</span>
        </div>
        <div style={{display:'flex',gap:'4px',overflowX:'auto'}}>
          {PAIRS.map(p => (
            <button key={p} onClick={() => setPair(p)} style={{padding:'4px 8px',border:'1px solid',borderRadius:'2px',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'9px',fontWeight:600,whiteSpace:'nowrap',background:pair===p?'rgba(0,255,136,0.1)':'transparent',color:pair===p?G:'var(--text3)',borderColor:pair===p?'rgba(0,255,136,0.3)':'var(--border2)',transition:'all 0.15s'}}>
              {p.split('/')[0]}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:'4px',flexShrink:0}}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} style={{padding:'5px 10px',border:'1px solid',borderRadius:'2px',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'10px',fontWeight:700,background:period===p.value?'rgba(0,255,136,0.1)':'transparent',color:period===p.value?G:'var(--text2)',borderColor:period===p.value?'rgba(0,255,136,0.3)':'var(--border2)',transition:'all 0.15s'}}>
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{maxWidth:'960px',margin:'0 auto',padding:'24px'}}>
        {/* 가격 헤더 */}
        <div style={{display:'flex',alignItems:'flex-end',gap:'20px',marginBottom:'16px',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'4px'}}>{data?.symbol || 'KAUS / USD'}</div>
            <div style={{display:'flex',alignItems:'baseline',gap:'12px'}}>
              <span style={{fontSize:'clamp(24px,4vw,40px)',fontWeight:800,color:isUp?G:R,letterSpacing:'-0.03em'}}>
                ${displayData?.close.toFixed(4) || data?.current_price.toFixed(4) || '—'}
              </span>
              <span style={{fontSize:'16px',fontWeight:600,color:isUp?G:R}}>
                {isUp?'+':''}{data?.change_pct.toFixed(2)}% {period.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:'24px',paddingBottom:'4px'}}>
            {[
              ['H', data?.high.toFixed(4), G],
              ['L', data?.low.toFixed(4), R],
              ['Vol', data ? `$${((data.volume_24h||0)/1000).toFixed(0)}K` : '—', 'var(--text)'],
            ].map(([l,v,c])=>(
              <div key={l}>
                <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',marginBottom:'3px'}}>{l}</div>
                <div style={{fontSize:'12px',fontWeight:600,color:c as string}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 캔들스틱 차트 */}
        <div style={{border:'1px solid var(--border2)',background:'var(--bg)',borderRadius:'2px',overflow:'hidden',marginBottom:'12px',position:'relative'}}>
          {data ? renderCandlestick() : (
            <div className="skeleton" style={{height:'220px',width:'100%'}}/>
          )}
          {hovered && (
            <div style={{position:'absolute',top:'8px',left:'16px',fontSize:'10px',color:'var(--text2)',background:'rgba(8,12,16,0.9)',padding:'6px 10px',border:'1px solid var(--border2)',borderRadius:'2px',pointerEvents:'none'}}>
              <div>{new Date(hovered.timestamp).toLocaleString('ko-KR', {month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'})}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'4px 16px',marginTop:'4px'}}>
                {[['O',hovered.open],['H',hovered.high],['L',hovered.low],['C',hovered.close]].map(([l,v])=>(
                  <div key={l}><span style={{color:'var(--text3)'}}>{l} </span><span style={{color:'var(--text)',fontWeight:600}}>${Number(v).toFixed(4)}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 하단 빠른 링크 */}
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <Link href="/exchange" style={{flex:1,minWidth:'120px',display:'block',textAlign:'center',padding:'10px',background:'rgba(0,255,136,0.08)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'2px',fontSize:'11px',fontWeight:700,color:G,letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Trade KAUS →</Link>
          <Link href="/orderbook" style={{flex:1,minWidth:'120px',display:'block',textAlign:'center',padding:'10px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'11px',fontWeight:600,color:'var(--text2)',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Orderbook</Link>
          <Link href="/tokenomics" style={{flex:1,minWidth:'120px',display:'block',textAlign:'center',padding:'10px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'11px',fontWeight:600,color:'var(--text2)',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Tokenomics</Link>
          <Link href="/buy-kaus" style={{flex:1,minWidth:'120px',display:'block',textAlign:'center',padding:'10px',background:'rgba(255,204,0,0.08)',border:'1px solid rgba(255,204,0,0.2)',borderRadius:'2px',fontSize:'11px',fontWeight:700,color:'var(--yellow)',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Buy KAUS</Link>
        </div>
      </div>
    </div>
  )
}
