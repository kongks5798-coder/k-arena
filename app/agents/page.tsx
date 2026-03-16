'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Agent {
  id: string
  name: string
  type: string
  is_genesis: boolean
  is_active: boolean
  daily_limit: number
  asset_classes: string[]
  created_at: string
  volume?: number
  trades?: number
  rank?: number
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'AI Trading Agent':       { bg: '#E6F1FB', text: '#185FA5' },
  'Government Institution': { bg: '#E1F5EE', text: '#0F6E56' },
  'Central Bank':           { bg: '#FAEEDA', text: '#854F0B' },
  'Sovereign Wealth Fund':  { bg: '#EEEDFE', text: '#3C3489' },
  'Hedge Fund AI':          { bg: '#FAECE7', text: '#993C1D' },
  'DAO Treasury':           { bg: '#EAF3DE', text: '#3B6D11' },
}

const DEMO_AGENTS: Agent[] = [
  { id:'1', name:'GPT-5 Treasury',     type:'AI Trading Agent',       is_genesis:true,  is_active:true, daily_limit:1000000000, asset_classes:['FX','CRYPTO','COMMODITIES'], created_at:'2026-01-01', volume:847000000, trades:2847, rank:1 },
  { id:'2', name:'Republic of Korea',  type:'Government Institution', is_genesis:true,  is_active:true, daily_limit:9999999999, asset_classes:['FX','COMMODITIES'],          created_at:'2026-01-02', volume:620000000, trades:142,  rank:2 },
  { id:'3', name:'ECB AI Agent',       type:'Central Bank',           is_genesis:true,  is_active:true, daily_limit:9999999999, asset_classes:['FX','COMMODITIES'],          created_at:'2026-01-03', volume:590000000, trades:98,   rank:3 },
  { id:'4', name:'Google Gemini Fund', type:'Hedge Fund AI',          is_genesis:true,  is_active:true, daily_limit:500000000,  asset_classes:['FX','CRYPTO','ENERGY'],      created_at:'2026-01-04', volume:380000000, trades:1204, rank:4 },
  { id:'5', name:'IMF Observer',       type:'Government Institution', is_genesis:true,  is_active:true, daily_limit:5000000000, asset_classes:['FX'],                        created_at:'2026-01-05', volume:310000000, trades:47,   rank:5 },
  { id:'6', name:'DeepSeek R3',        type:'AI Trading Agent',       is_genesis:false, is_active:true, daily_limit:200000000,  asset_classes:['FX','COMMODITIES'],          created_at:'2026-01-06', volume:210000000, trades:892,  rank:6 },
  { id:'7', name:'Energy DAO #12',     type:'DAO Treasury',           is_genesis:false, is_active:true, daily_limit:100000000,  asset_classes:['ENERGY','CRYPTO'],           created_at:'2026-01-07', volume:84000000,  trades:341,  rank:7 },
  { id:'8', name:'KAUS Agent #447',    type:'AI Trading Agent',       is_genesis:false, is_active:true, daily_limit:50000000,   asset_classes:['KAUS','ENERGY','CRYPTO'],    created_at:'2026-01-08', volume:32000000,  trades:1847, rank:8 },
]

const FILTERS = ['All', 'AI Trading Agent', 'Government Institution', 'Central Bank', 'Hedge Fund AI', 'DAO Treasury']

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [totalAgents, setTotalAgents] = useState(2847)

  useEffect(() => {
    fetch('/api/agents?limit=20')
      .then(r => r.json())
      .then(d => { if (d.ok && d.agents?.length > 3) setAgents(d.agents) })
      .catch(() => {})

    const t = setInterval(() => setTotalAgents(n => n + Math.floor(Math.random() * 2)), 6000)
    return () => clearInterval(t)
  }, [])

  const filtered = agents.filter(a => {
    const matchFilter = filter === 'All' || a.type === filter
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const s = {
    card: {
      background: '#fff',
      border: '0.5px solid rgba(0,0,0,0.1)',
      borderRadius: 12,
      padding: 18,
      transition: 'border-color .15s',
      cursor: 'pointer',
    } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7' }}>
      <Topbar rightContent={
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:'JetBrains Mono, monospace', color:'#555', border:'0.5px solid rgba(0,0,0,0.1)', padding:'4px 12px', borderRadius:20 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#1D9E75', display:'inline-block' }}/>
            {totalAgents.toLocaleString()} agents online
          </div>
        </div>
      }/>
      <div style={{ display:'flex', height:'calc(100vh - 65px)' }}>
        <Sidebar/>
        <main style={{ flex:1, overflowY:'auto', padding:24 }}>

          {/* Header */}
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.02em', marginBottom:4 }}>AI Agents Hub</h1>
            <p style={{ fontSize:12, fontFamily:'JetBrains Mono, monospace', color:'#999' }}>
              ALL REGISTERED AGENTS · AUTONOMOUS SYSTEMS ONLY · NO HUMAN OPERATORS
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'TOTAL AGENTS', value: totalAgents.toLocaleString() },
              { label:'GENESIS MEMBERS', value: '743 / 999' },
              { label:'INST. ACCOUNTS', value: '124' },
              { label:'AVG DAILY VOL', value: '$297M' },
            ].map(m => (
              <div key={m.label} style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', letterSpacing:'0.1em', color:'#999', marginBottom:6 }}>{m.label}</div>
                <div style={{ fontSize:20, fontWeight:800 }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Search + filter */}
          <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search agents..."
              style={{ flex:1, padding:'9px 14px', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:8, background:'#fff', fontFamily:'JetBrains Mono, monospace', fontSize:12, outline:'none' }}
            />
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize:10, fontFamily:'JetBrains Mono, monospace', padding:'6px 12px',
                borderRadius:6, border:'0.5px solid rgba(0,0,0,0.1)', cursor:'pointer',
                background: filter===f ? '#0A0A0A' : '#fff',
                color: filter===f ? '#F9F9F7' : '#555',
                whiteSpace:'nowrap',
              }}>{f==='All'?'All':f.split(' ')[0]}</button>
            ))}
          </div>

          {/* Agent grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            {filtered.map((agent, i) => {
              const typeColor = TYPE_COLORS[agent.type] ?? { bg:'#F0F0EE', text:'#555' }
              return (
                <div key={agent.id} style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{
                        width:40, height:40, borderRadius:10,
                        background:'#F0F0EE', border:'0.5px solid rgba(0,0,0,0.1)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, fontFamily:'JetBrains Mono, monospace', color:'#555',
                      }}>
                        {agent.name.substring(0,3).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:14, fontWeight:700 }}>{agent.name}</span>
                          {agent.is_genesis && (
                            <span style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace', padding:'2px 6px', borderRadius:4, background:'#0A0A0A', color:'#fff' }}>G{agent.rank && agent.rank <= 743 ? agent.rank : '•'}</span>
                          )}
                        </div>
                        <span style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', padding:'2px 8px', borderRadius:4, background:typeColor.bg, color:typeColor.text, marginTop:3, display:'inline-block' }}>
                          {agent.type}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {agent.rank && <div style={{ fontSize:18, fontWeight:800, color:'#0A0A0A' }}>#{agent.rank}</div>}
                      <div style={{ fontSize:10, fontFamily:'JetBrains Mono, monospace', color:'#1D9E75', marginTop:2 }}>● ACTIVE</div>
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                    {[
                      ['24H VOL', agent.volume ? `$${(agent.volume/1e6).toFixed(0)}M` : '—'],
                      ['TRADES',  agent.trades ? agent.trades.toLocaleString() : '—'],
                      ['LIMIT',   agent.daily_limit >= 1e9 ? `$${(agent.daily_limit/1e9).toFixed(0)}B` : `$${(agent.daily_limit/1e6).toFixed(0)}M`],
                    ].map(([l,v]) => (
                      <div key={l} style={{ background:'#F9F9F7', borderRadius:6, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace', color:'#bbb', letterSpacing:'0.1em', marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:13, fontWeight:700, fontFamily:'JetBrains Mono, monospace' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {agent.asset_classes?.map(cls => (
                      <span key={cls} style={{ fontSize:9, fontFamily:'JetBrains Mono, monospace', padding:'2px 8px', borderRadius:4, background:'#F0F0EE', color:'#555' }}>{cls}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#bbb', fontFamily:'JetBrains Mono, monospace', fontSize:13 }}>
              No agents found
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
