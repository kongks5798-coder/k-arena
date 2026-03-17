'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Candle { timestamp: string; open: number; high: number; low: number; close: number; volume: number }
interface ChartData { symbol: string; period: string; current_price: number; open_price: number; change_pct: number; high: number; low: number; volume_24h: number; history: Candle[] }

const PERIODS = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
]

export default function ChartPage() {
  const [period, setPeriod] = useState('24h')
  const [data, setData] = useState<ChartData | null>(null)
  const [hovered, setHovered] = useState<Candle | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/kaus-chart?period=${period}`)
      setData(await r.json())
    } catch {}
  }, [period])

  useEffect(() => { load(); const i = setInterval(load, 10000); return () => clearInterval(i) }, [load])

  const G = 'var(--green)', R = 'var(--red)'

  // SVG 라인 차트 생성
  const renderChart = () => {
    if (!data?.history?.length) return null
    const h = data.history
    const W = 800, H = 200, PAD = 8

    const prices = h.map(c => c.close)
    const minP = Math.min(...prices)
    const maxP = Math.max(...prices)
    const range = maxP - minP || 0.01

    const points = h.map((c, i) => ({
      x: PAD + (i / (h.length - 1)) * (W - PAD * 2),
      y: PAD + (1 - (c.close - minP) / range) * (H - PAD * 2),
      data: c,
    }))

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const areaD = `${pathD} L ${points[points.length-1].x} ${H} L ${points[0].x} ${H} Z`

    const isUp = data.change_pct >= 0
    const color = isUp ? '#00ff88' : '#ff3366'

    const displayData = hovered || h[h.length - 1]

    return (
      <div>
        {/* 현재가 정보 */}
        <div style={{display:'flex',alignItems:'flex-end',gap:'16px',marginBottom:'16px',flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'4px'}}>KAUS / USD</div>
            <div style={{fontSize:'36px',fontWeight:800,color:isUp?G:R,letterSpacing:'-0.03em',lineHeight:1}}>
              ${displayData.close.toFixed(4)}
            </div>
          </div>
          <div style={{paddingBottom:'4px'}}>
            <div style={{fontSize:'16px',fontWeight:600,color:isUp?G:R}}>
              {isUp ? '+' : ''}{data.change_pct.toFixed(2)}%
            </div>
            <div style={{fontSize:'11px',color:'var(--text3)'}}>{period.toUpperCase()}</div>
          </div>
          <div style={{marginLeft:'auto',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',textAlign:'right',paddingBottom:'4px'}}>
            {[['24H High', data.high.toFixed(4), G], ['24H Low', data.low.toFixed(4), R], ['Volume', `$${(data.volume_24h/1000).toFixed(0)}K`, 'var(--text)']].map(([l,v,c])=>(
              <div key={l}>
                <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:'3px'}}>{l}</div>
                <div style={{fontSize:'12px',fontWeight:600,color:c as string}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SVG 차트 */}
        <div style={{border:'1px solid var(--border2)',background:'var(--bg)',borderRadius:'2px',overflow:'hidden',position:'relative'}}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'200px',display:'block'}}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.15"/>
                <stop offset="100%" stopColor={color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* 그리드 라인 */}
            {[0.25, 0.5, 0.75].map(pct => (
              <line key={pct} x1="0" y1={PAD + pct * (H - PAD*2)} x2={W} y2={PAD + pct * (H - PAD*2)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}
            {/* 에리어 */}
            <path d={areaD} fill="url(#areaGrad)"/>
            {/* 라인 */}
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
            {/* 호버 포인트들 */}
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill="transparent"
                onMouseEnter={() => setHovered(p.data)}
                onMouseLeave={() => setHovered(null)}
                style={{cursor:'crosshair'}}/>
            ))}
            {/* 마지막 포인트 강조 */}
            <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="3" fill={color}/>
          </svg>
          {hovered && (
            <div style={{position:'absolute',bottom:'8px',left:'16px',fontSize:'10px',color:'var(--text2)',background:'var(--bg2)',padding:'4px 8px',border:'1px solid var(--border2)',borderRadius:'2px'}}>
              {new Date(hovered.timestamp).toLocaleString('ko-KR')} · ${hovered.close.toFixed(4)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'30px',height:'30px',background:'var(--green)',borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'14px',color:'#000'}}>K</div>
            <span style={{fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          </Link>
          <span style={{color:'var(--text3)'}}>/</span>
          <span style={{fontSize:'11px',color:'var(--green)',fontWeight:600,letterSpacing:'0.1em'}}>KAUS CHART</span>
        </div>
        <div style={{display:'flex',gap:'4px'}}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} style={{padding:'5px 12px',border:'1px solid',borderRadius:'2px',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'10px',fontWeight:700,background:period===p.value?'rgba(0,255,136,0.1)':'transparent',color:period===p.value?'var(--green)':'var(--text2)',borderColor:period===p.value?'rgba(0,255,136,0.3)':'var(--border2)',transition:'all 0.15s'}}>
              {p.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 24px'}}>
        {data ? renderChart() : (
          <div style={{padding:'64px',textAlign:'center'}}>
            <div className="skeleton" style={{height:'32px',width:'200px',margin:'0 auto 12px'}}/>
            <div className="skeleton" style={{height:'200px',width:'100%'}}/>
          </div>
        )}

        {/* 관련 링크 */}
        <div style={{marginTop:'16px',display:'flex',gap:'8px'}}>
          <Link href="/exchange" style={{flex:1,display:'block',textAlign:'center',padding:'10px',background:'rgba(0,255,136,0.08)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'2px',fontSize:'11px',fontWeight:700,color:'var(--green)',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Trade KAUS →</Link>
          <Link href="/orderbook" style={{flex:1,display:'block',textAlign:'center',padding:'10px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'11px',fontWeight:600,color:'var(--text2)',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Orderbook</Link>
          <Link href="/tokenomics" style={{flex:1,display:'block',textAlign:'center',padding:'10px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'11px',fontWeight:600,color:'var(--text2)',letterSpacing:'0.08em',textTransform:'uppercase',textDecoration:'none'}}>Tokenomics</Link>
        </div>
      </div>
    </div>
  )
}
