'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Agent { id: string; name: string; org: string; status: string; vol_24h: number; trades: number; accuracy: number }
interface PortfolioData {
  agent_id: string; agent: Agent | null
  summary: { total_trades: number; total_volume: number; total_fees: number; accuracy: number; win_rate: number; best_pair: string; recent_7d_trades: number; avg_trade_size: number }
  pair_breakdown: { pair: string; trades: number; volume: number; buys: number; sells: number }[]
  hourly_activity: { hour: number; trades: number; volume: number }[]
  peak_hour: number
}

const AGENT_IDS = ['AGT-0042','AGT-0117','AGT-0223','AGT-0089','AGT-0156','AGT-0301']

function fmt(n: number) { return n >= 1000000 ? `$${(n/1e6).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n.toFixed(0)}` }

export default function PortfolioPage() {
  const [agentId, setAgentId] = useState('AGT-0042')
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/portfolio?agent_id=${agentId}`)
      setData(await r.json())
    } catch {}
    setLoading(false)
  }, [agentId])

  useEffect(() => { load() }, [load])

  const G = 'var(--green)', R = 'var(--red)', Y = 'var(--yellow)'
  const maxHourVol = data ? Math.max(...data.hourly_activity.map(h => h.volume), 1) : 1

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'30px',height:'30px',background:G,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'14px',color:'#000'}}>K</div>
            <span style={{fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          </Link>
          <span style={{color:'var(--text3)'}}>/</span>
          <span style={{fontSize:'11px',color:G,fontWeight:600,letterSpacing:'0.1em'}}>PORTFOLIO</span>
        </div>
        {/* 에이전트 선택 */}
        <div style={{display:'flex',gap:'4px',overflowX:'auto'}}>
          {AGENT_IDS.map(id => (
            <button key={id} onClick={() => setAgentId(id)} style={{padding:'4px 10px',border:'1px solid',borderRadius:'2px',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'9px',fontWeight:600,whiteSpace:'nowrap',background:agentId===id?'rgba(0,255,136,0.1)':'transparent',color:agentId===id?G:'var(--text3)',borderColor:agentId===id?'rgba(0,255,136,0.3)':'var(--border2)',transition:'all 0.15s'}}>
              {id.replace('AGT-','')}
            </button>
          ))}
        </div>
      </nav>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 24px'}}>
        {loading ? (
          <div style={{padding:'48px',textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>Loading...</div>
        ) : data ? (
          <>
            {/* 에이전트 헤더 */}
            {data.agent && (
              <div style={{border:'1px solid var(--border2)',background:'var(--bg2)',padding:'20px 24px',marginBottom:'20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
                <div>
                  <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'6px'}}>{data.agent.id}</div>
                  <div style={{fontSize:'22px',fontWeight:700,color:'var(--text)',marginBottom:'4px'}}>{data.agent.name}</div>
                  <div style={{fontSize:'11px',color:'var(--text2)'}}>{data.agent.org}</div>
                </div>
                <span style={{fontSize:'10px',fontWeight:700,padding:'4px 12px',background:'rgba(0,255,136,0.1)',color:G,border:'1px solid rgba(0,255,136,0.3)',borderRadius:'2px'}}>{data.agent.status}</span>
              </div>
            )}

            {/* 핵심 통계 */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1px',background:'var(--border2)',marginBottom:'20px'}}>
              {[
                ['Total Volume', fmt(data.summary.total_volume), G],
                ['Total Trades', String(data.summary.total_trades), 'var(--text)'],
                ['Win Rate', `${data.summary.win_rate.toFixed(1)}%`, data.summary.win_rate > 70 ? G : data.summary.win_rate > 55 ? Y : R],
                ['Accuracy', `${data.summary.accuracy.toFixed(1)}%`, data.summary.accuracy > 75 ? G : data.summary.accuracy > 60 ? Y : 'var(--text2)'],
                ['Total Fees', fmt(data.summary.total_fees), 'var(--text2)'],
                ['Best Pair', data.summary.best_pair, 'var(--text)'],
                ['Avg Trade', fmt(data.summary.avg_trade_size), 'var(--text)'],
                ['7D Trades', String(data.summary.recent_7d_trades), 'var(--text)'],
              ].map(([l, v, c]) => (
                <div key={l} style={{background:'var(--bg2)',padding:'16px 20px'}}>
                  <div style={{fontSize:'9px',color:'var(--text3)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:'6px'}}>{l}</div>
                  <div style={{fontSize:'18px',fontWeight:700,color:c as string}}>{v}</div>
                </div>
              ))}
            </div>

            {/* 페어별 성과 */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
              <div style={{border:'1px solid var(--border2)'}}>
                <div style={{padding:'12px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)',fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>Pair Performance</div>
                {data.pair_breakdown.slice(0,6).map(p => (
                  <div key={p.pair} style={{padding:'10px 16px',borderBottom:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>{p.pair}</div>
                      <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'2px'}}>{p.trades} trades · {fmt(p.volume)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'11px',color:G}}>{p.buys}B / {p.sells}S</div>
                      <div style={{fontSize:'9px',color:p.buys > p.sells ? G : R}}>{p.buys > p.sells ? 'BULLISH' : 'BEARISH'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 24시간 활동 히트맵 */}
              <div style={{border:'1px solid var(--border2)'}}>
                <div style={{padding:'12px 16px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)',fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
                  24H Activity · Peak: {data.peak_hour}:00
                </div>
                <div style={{padding:'16px',display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'4px'}}>
                  {data.hourly_activity.map(h => {
                    const intensity = h.volume / maxHourVol
                    return (
                      <div key={h.hour} title={`${h.hour}:00 · ${fmt(h.volume)}`} style={{
                        height:'28px',borderRadius:'2px',background:`rgba(0,255,136,${intensity * 0.7 + 0.05})`,
                        border:'1px solid rgba(0,255,136,0.1)',cursor:'default',display:'flex',alignItems:'center',justifyContent:'center',
                      }}>
                        <span style={{fontSize:'8px',color:'rgba(0,0,0,0.6)',fontWeight:600}}>{String(h.hour).padStart(2,'0')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 바로가기 */}
            <div style={{display:'flex',gap:'8px'}}>
              <Link href={`/agents/${agentId}`} style={{flex:1,display:'block',textAlign:'center',padding:'11px',background:'rgba(0,255,136,0.08)',border:'1px solid rgba(0,255,136,0.2)',borderRadius:'2px',fontSize:'11px',fontWeight:700,color:G,letterSpacing:'0.08em',textDecoration:'none'}}>Agent Detail →</Link>
              <Link href="/exchange" style={{flex:1,display:'block',textAlign:'center',padding:'11px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'11px',fontWeight:600,color:'var(--text2)',letterSpacing:'0.08em',textDecoration:'none'}}>Trade Now</Link>
              <Link href="/leaderboard" style={{flex:1,display:'block',textAlign:'center',padding:'11px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',fontSize:'11px',fontWeight:600,color:'var(--text2)',letterSpacing:'0.08em',textDecoration:'none'}}>Leaderboard</Link>
            </div>
          </>
        ) : (
          <div style={{padding:'48px',textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>No data</div>
        )}
      </div>
    </div>
  )
}
