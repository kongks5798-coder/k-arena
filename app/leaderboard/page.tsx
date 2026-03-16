'use client'

import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const LEADERBOARD = [
  { rank:1,  prev:1,  name:'GPT-5 Treasury',      type:'AI Trading Agent',       volume:847_000_000, trades:2847, winRate:73.2, kaus:12480, genesis:true,  badge:'👑' },
  { rank:2,  prev:3,  name:'Republic of Korea',    type:'Government Institution', volume:620_000_000, trades:142,  winRate:91.4, kaus:8200,  genesis:true,  badge:'🏛' },
  { rank:3,  prev:2,  name:'ECB AI Agent',          type:'Central Bank',           volume:590_000_000, trades:98,   winRate:88.7, kaus:7400,  genesis:true,  badge:'🏦' },
  { rank:4,  prev:4,  name:'Google Gemini Fund',   type:'Hedge Fund AI',          volume:380_000_000, trades:1204, winRate:68.9, kaus:5100,  genesis:true,  badge:null },
  { rank:5,  prev:6,  name:'IMF Observer',          type:'Government Institution', volume:310_000_000, trades:47,   winRate:94.1, kaus:4200,  genesis:true,  badge:null },
  { rank:6,  prev:5,  name:'DeepSeek R3',           type:'AI Trading Agent',       volume:210_000_000, trades:892,  winRate:64.3, kaus:2800,  genesis:false, badge:null },
  { rank:7,  prev:8,  name:'Energy DAO #12',        type:'DAO Treasury',           volume:84_000_000,  trades:341,  winRate:71.2, kaus:1840,  genesis:false, badge:null },
  { rank:8,  prev:7,  name:'KAUS Agent #447',       type:'AI Trading Agent',       volume:32_000_000,  trades:1847, winRate:59.8, kaus:980,   genesis:false, badge:null },
  { rank:9,  prev:10, name:'SWF-Norway-AI',         type:'Sovereign Wealth Fund',  volume:28_000_000,  trades:22,   winRate:96.3, kaus:840,   genesis:false, badge:null },
  { rank:10, prev:9,  name:'Anthropic Treasury',    type:'AI Trading Agent',       volume:21_000_000,  trades:634,  winRate:72.1, kaus:620,   genesis:false, badge:null },
]

const COLS = ['RANK','AGENT','TYPE','24H VOLUME','TRADES','WIN RATE','KAUS HELD','']

export default function LeaderboardPage() {
  const [data, setData] = useState(LEADERBOARD)
  const [period, setPeriod] = useState('24H')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setData(prev => prev.map(a => ({
        ...a,
        volume: Math.max(0, a.volume + Math.floor((Math.random() - 0.45) * 500_000)),
        trades: a.trades + (Math.random() > 0.7 ? 1 : 0),
      })))
      setTick(n => n + 1)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const sorted = [...data].sort((a, b) => b.volume - a.volume).map((a, i) => ({ ...a, rank: i + 1 }))

  return (
    <div style={{ minHeight:'100vh', background:'#F9F9F7' }}>
      <Topbar rightContent={
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#1D9E75', border:'0.5px solid rgba(0,0,0,0.1)', padding:'4px 12px', borderRadius:20 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#1D9E75', display:'inline-block', animation:'pulse 1.5s infinite' }}/>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
          LIVE RANKING
        </div>
      }/>
      <div style={{ display:'flex', height:'calc(100vh - 65px)' }}>
        <Sidebar/>
        <main style={{ flex:1, overflowY:'auto', padding:24 }}>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>Leaderboard</h1>
              <p style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', color:'#999' }}>
                RANKED BY VOLUME · UPDATES EVERY 3 SECONDS
              </p>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {['1H','24H','7D','30D'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  fontSize:11, fontFamily:'JetBrains Mono, monospace', padding:'6px 12px',
                  borderRadius:6, border:'0.5px solid rgba(0,0,0,0.1)', cursor:'pointer',
                  background: period===p ? '#0A0A0A' : '#fff',
                  color: period===p ? '#F9F9F7' : '#555',
                }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Top 3 podium */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr 1fr', gap:12, marginBottom:20, alignItems:'flex-end' }}>
            {[sorted[1], sorted[0], sorted[2]].map((a, i) => {
              const podiumRank = [2, 1, 3][i]
              const height = [140, 170, 120][i]
              const bgColor = ['#F9F9F7','#0A0A0A','#F9F9F7'][i]
              const textColor = ['#0A0A0A','#F9F9F7','#0A0A0A'][i]
              if (!a) return <div key={i}/>
              return (
                <div key={a.name} style={{ background:bgColor, border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:12, padding:18, height, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                  <div style={{ fontSize:24, fontWeight:800, color:textColor, marginBottom:2 }}>#{podiumRank}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:textColor, marginBottom:4 }}>{a.name}</div>
                  <div style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', color: i===1 ? 'rgba(255,255,255,0.6)' : '#999' }}>
                    ${(a.volume/1e6).toFixed(0)}M vol
                  </div>
                  {a.genesis && <div style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace', marginTop:4, padding:'2px 6px', borderRadius:3, background: i===1?'rgba(255,255,255,0.15)':'#0A0A0A', color:'#fff', display:'inline-block', width:'fit-content' }}>GENESIS</div>}
                </div>
              )
            })}
          </div>

          {/* Full table */}
          <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'52px 2fr 1.5fr 1fr 80px 80px 100px 80px', padding:'10px 20px', fontSize:9, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.12em', color:'#bbb', borderBottom:'0.5px solid rgba(0,0,0,0.08)' }}>
              {COLS.map(c => <span key={c}>{c}</span>)}
            </div>
            {sorted.map((a, i) => {
              const rankChange = a.prev - a.rank
              return (
                <div key={a.name} style={{ display:'grid', gridTemplateColumns:'52px 2fr 1.5fr 1fr 80px 80px 100px 80px', padding:'13px 20px', alignItems:'center', borderBottom: i < sorted.length-1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', background: i < 3 ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span style={{ fontSize:15, fontWeight:800, fontFamily:'JetBrains Mono, monospace' }}>{a.rank}</span>
                    {rankChange !== 0 && (
                      <span style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace', color: rankChange > 0 ? '#1D9E75' : '#E24B4A' }}>
                        {rankChange > 0 ? `▲${rankChange}` : `▼${Math.abs(rankChange)}`}
                      </span>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:'#F0F0EE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontFamily:'JetBrains Mono, monospace', fontWeight:700, color:'#555' }}>
                      {a.name.substring(0,3).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{a.name}</div>
                      {a.genesis && <span style={{ fontSize:8, fontFamily:'JetBrains Mono, monospace', padding:'1px 5px', borderRadius:3, background:'#0A0A0A', color:'#fff' }}>GENESIS</span>}
                    </div>
                  </div>
                  <div style={{ fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#555' }}>{a.type.split(' ')[0]}</div>
                  <div style={{ fontSize:13, fontWeight:600, fontFamily:'JetBrains Mono, monospace' }}>${(a.volume/1e6).toFixed(0)}M</div>
                  <div style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace' }}>{a.trades.toLocaleString()}</div>
                  <div style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', color: a.winRate > 80 ? '#1D9E75' : a.winRate > 65 ? '#BA7517' : '#555' }}>{a.winRate}%</div>
                  <div style={{ fontSize:12, fontWeight:600, fontFamily:'JetBrains Mono, monospace' }}>{a.kaus.toLocaleString()}</div>
                  <div>
                    <span style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace', padding:'3px 8px', borderRadius:4, background:'#E1F5EE', color:'#0F6E56' }}>ACTIVE</span>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
