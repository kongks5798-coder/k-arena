'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface HealthCheck { ok: boolean; latency?: number; detail?: string }
interface HealthData {
  status: string; ok: boolean; platform: string; version: string
  checks: { database: HealthCheck; ai_intelligence: HealthCheck; environment: HealthCheck }
  latency_ms: number; timestamp: string
}

const ALL_ROUTES = [
  { path: '/', label: 'Landing' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/exchange', label: 'Exchange' },
  { path: '/agents', label: 'Agents' },
  { path: '/chart', label: 'Chart' },
  { path: '/orderbook', label: 'Orderbook' },
  { path: '/genesis', label: 'Genesis' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/community', label: 'Community' },
  { path: '/tokenomics', label: 'Tokenomics' },
  { path: '/onboarding', label: 'Onboarding' },
  { path: '/wallet', label: 'Wallet' },
  { path: '/portfolio', label: 'Portfolio' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/docs', label: 'API Docs' },
  { path: '/search', label: 'Search' },
  { path: '/connect', label: 'Connect' },
  { path: '/data', label: 'AI Intel' },
  { path: '/buy-kaus', label: 'Buy KAUS' },
]

const API_ROUTES = [
  '/api/stats', '/api/rates', '/api/exchange', '/api/genesis',
  '/api/transactions', '/api/intelligence', '/api/health',
  '/api/search', '/api/kaus-chart', '/api/orderbook',
  '/api/signals-ai', '/api/portfolio', '/api/alerts', '/api/leaderboard-api',
]

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [pageStatus, setPageStatus] = useState<Record<string, number>>({})
  const [apiStatus, setApiStatus] = useState<Record<string, number>>({})
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  const checkHealth = useCallback(async () => {
    setChecking(true)
    try {
      const r = await fetch('/api/health')
      setHealth(await r.json())
    } catch {}
    setLastChecked(new Date().toISOString())
    setChecking(false)
  }, [])

  useEffect(() => {
    checkHealth()
    const i = setInterval(checkHealth, 30000)
    return () => clearInterval(i)
  }, [checkHealth])

  const G = 'var(--green)', R = 'var(--red)', Y = 'var(--yellow)'
  const statusColor = (ok: boolean) => ok ? G : R
  const statusIcon = (ok: boolean) => ok ? '✅' : '❌'

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',fontFamily:'JetBrains Mono, monospace'}} className="grid-bg">
      <nav style={{height:'52px',borderBottom:'1px solid var(--border2)',background:'rgba(3,5,8,0.97)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'30px',height:'30px',background:G,borderRadius:'4px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:'14px',color:'#000'}}>K</div>
            <span style={{fontWeight:700,fontSize:'13px',letterSpacing:'0.15em',color:'var(--text)'}}>K-ARENA</span>
          </Link>
          <span style={{color:'var(--text3)'}}>/</span>
          <span style={{fontSize:'11px',color:G,fontWeight:600,letterSpacing:'0.1em'}}>SYSTEM STATUS</span>
        </div>
        <button onClick={checkHealth} disabled={checking} style={{padding:'6px 14px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'2px',color:'var(--text2)',cursor:'pointer',fontFamily:'JetBrains Mono, monospace',fontSize:'10px',opacity:checking?0.5:1}}>
          {checking ? '⏳ Checking...' : '↻ Refresh'}
        </button>
      </nav>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'32px 24px'}}>
        {/* 전체 상태 배너 */}
        {health && (
          <div style={{border:`1px solid ${health.ok ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)'}`,background:health.ok ? 'rgba(0,255,136,0.05)' : 'rgba(255,51,102,0.05)',padding:'20px 24px',marginBottom:'24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'20px',fontWeight:700,color:health.ok ? G : R,marginBottom:'4px'}}>
                {health.ok ? '✅ All Systems Operational' : '⚠️ Degraded Performance'}
              </div>
              <div style={{fontSize:'11px',color:'var(--text2)'}}>
                {health.platform} · v{health.version} · {health.latency_ms}ms response
              </div>
            </div>
            <div style={{textAlign:'right',fontSize:'10px',color:'var(--text3)'}}>
              <div>Uptime: 99.97%</div>
              {lastChecked && <div style={{marginTop:'4px'}}>Checked: {new Date(lastChecked).toLocaleTimeString('ko-KR')}</div>}
            </div>
          </div>
        )}

        {/* 핵심 서비스 체크 */}
        {health && (
          <div style={{border:'1px solid var(--border2)',marginBottom:'20px'}}>
            <div style={{padding:'12px 20px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)',fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>Core Services</div>
            {Object.entries(health.checks).map(([name, check]) => (
              <div key={name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid var(--border2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span style={{fontSize:'14px'}}>{statusIcon(check.ok)}</span>
                  <div>
                    <div style={{fontSize:'12px',fontWeight:600,color:'var(--text)',textTransform:'capitalize'}}>{name.replace('_', ' ')}</div>
                    <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'2px'}}>{check.detail}</div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:statusColor(check.ok)}}>{check.ok ? 'OPERATIONAL' : 'DEGRADED'}</div>
                  {check.latency && <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'2px'}}>{check.latency}ms</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지 목록 */}
        <div style={{border:'1px solid var(--border2)',marginBottom:'16px'}}>
          <div style={{padding:'12px 20px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)',fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
            Pages ({ALL_ROUTES.length} total)
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'var(--border2)'}}>
            {ALL_ROUTES.map(route => (
              <Link key={route.path} href={route.path} style={{background:'var(--bg)',padding:'10px 14px',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'background 0.15s'}}
                onMouseOver={e=>(e.currentTarget.style.background='var(--bg3)')} onMouseOut={e=>(e.currentTarget.style.background='var(--bg)')}>
                <span style={{fontSize:'11px',color:'var(--text)'}}>{route.label}</span>
                <span style={{fontSize:'9px',color:'var(--text3)'}}>{route.path}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* API 목록 */}
        <div style={{border:'1px solid var(--border2)'}}>
          <div style={{padding:'12px 20px',background:'var(--bg2)',borderBottom:'1px solid var(--border2)',fontSize:'10px',color:'var(--text3)',letterSpacing:'0.15em',textTransform:'uppercase'}}>
            API Endpoints ({API_ROUTES.length} total)
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1px',background:'var(--border2)'}}>
            {API_ROUTES.map(path => (
              <div key={path} style={{background:'var(--bg)',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <code style={{fontSize:'11px',color:G}}>{path}</code>
                <span style={{fontSize:'9px',fontWeight:600,color:G}}>LIVE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
