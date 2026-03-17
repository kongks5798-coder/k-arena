'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface Agent {
  id: string; name: string; type: string; is_genesis: boolean
  is_active: boolean; daily_limit: number; asset_classes: string[]
  created_at: string; wallet_address?: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('DATE')
  const [selected, setSelected] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const LIMIT = 25

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) })
    if (filter !== 'ALL') params.set('type', filter)
    fetch(`/api/agents?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) { setAgents(d.agents ?? []); setTotal(d.count ?? 0) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter, page])

  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n?.toLocaleString() ?? 0}`

  const filtered = agents.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'DATE')   return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'LIMIT')  return (b.daily_limit ?? 0) - (a.daily_limit ?? 0)
    if (sort === 'GENESIS') return (b.is_genesis ? 1 : 0) - (a.is_genesis ? 1 : 0)
    return 0
  })

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar rightContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'dot-pulse 2s infinite' }}/>
          <span style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.1em' }}>{total.toLocaleString()} REGISTERED</span>
        </div>
      }/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', padding: '8px 20px', alignItems: 'center', height: 44 }}>
              <div style={{ display: 'flex', gap: 1 }}>
                {['ALL', 'AI Trading', 'Institutional', 'DAO', 'Research'].map(t => (
                  <button key={t} onClick={() => { setFilter(t); setPage(0) }} style={{ fontSize: 9, padding: '4px 10px', letterSpacing: '0.08em', background: filter === t ? 'var(--surface-3)' : 'transparent', color: filter === t ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${filter === t ? 'var(--border-mid)' : 'transparent'}`, cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ width: 1, background: 'var(--border)', height: 20 }}/>
              <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>SORT:</span>
              {['DATE', 'LIMIT', 'GENESIS'].map(s => (
                <button key={s} onClick={() => setSort(s)} style={{ fontSize: 9, padding: '4px 10px', letterSpacing: '0.08em', background: sort === s ? 'var(--surface-3)' : 'transparent', color: sort === s ? 'var(--white)' : 'var(--dimmer)', border: `1px solid ${sort === s ? 'var(--border-mid)' : 'transparent'}`, cursor: 'pointer' }}>{s}</button>
              ))}
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH..." style={{ marginLeft: 'auto', width: 160, fontSize: 10, padding: '4px 10px' }}/>
            </div>

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 130px 100px 100px 80px', padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
              {['#', 'AGENT', 'TYPE', 'WALLET', 'DAILY LIMIT', 'STATUS'].map(h => (
                <span key={h} style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em' }}>{h}</span>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>LOADING...</div>
              ) : sorted.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--dimmer)', fontSize: 11 }}>NO AGENTS FOUND</div>
              ) : sorted.map((a, i) => (
                <div key={a.id} onClick={() => setSelected(a === selected ? null : a)} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 130px 100px 100px 80px', padding: '11px 20px', borderBottom: '1px solid var(--border)', background: selected?.id === a.id ? 'var(--surface-3)' : i % 2 === 0 ? 'transparent' : 'var(--surface)', cursor: 'pointer' }}>
                  <span style={{ fontSize: 11, color: 'var(--dimmer)' }}>{page * LIMIT + i + 1}</span>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--white)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {a.name}
                      {a.is_genesis && <span style={{ fontSize: 8, padding: '1px 4px', border: '1px solid var(--green)', color: 'var(--green)' }}>G</span>}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 2 }}>{a.asset_classes?.join(' · ')}</div>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: '0.06em', alignSelf: 'center' }}>{a.type?.toUpperCase()}</span>
                  <span style={{ fontSize: 10, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono', alignSelf: 'center' }}>{a.wallet_address?.slice(0, 10) ?? '—'}...</span>
                  <span style={{ fontSize: 11, color: 'var(--dim)', alignSelf: 'center' }}>{fmt(a.daily_limit)}</span>
                  <span style={{ fontSize: 9, color: 'var(--green)', alignSelf: 'center', letterSpacing: '0.06em' }}>ACTIVE</span>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'var(--dimmer)' }}>{total} TOTAL · PAGE {page + 1}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ fontSize: 9, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border)', color: page === 0 ? 'var(--dimmer)' : 'var(--white)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}>← PREV</button>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total} style={{ fontSize: 9, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border)', color: (page + 1) * LIMIT >= total ? 'var(--dimmer)' : 'var(--white)', cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer' }}>NEXT →</button>
              </div>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: 260, borderLeft: '1px solid var(--border)', padding: '16px', overflowY: 'auto', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 10, color: 'var(--dim)', letterSpacing: '0.12em' }}>AGENT DETAIL</span>
                <button onClick={() => setSelected(null)} style={{ fontSize: 11, color: 'var(--dimmer)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', fontFamily: 'IBM Plex Mono', marginBottom: 14, wordBreak: 'break-all' }}>{selected.wallet_address}</div>
              {[
                ['TYPE',    selected.type],
                ['GENESIS', selected.is_genesis ? 'YES' : 'NO'],
                ['LIMIT',   fmt(selected.daily_limit)],
                ['JOINED',  new Date(selected.created_at).toLocaleDateString()],
                ['ID',      selected.id.slice(0, 18) + '...'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                  <span style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.1em' }}>{k}</span>
                  <span style={{ color: k === 'GENESIS' && v === 'YES' ? 'var(--green)' : 'var(--white)' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 8 }}>ASSETS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.asset_classes?.map(c => (
                    <span key={c} style={{ fontSize: 9, padding: '2px 8px', border: '1px solid var(--border-mid)', color: 'var(--dim)' }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
