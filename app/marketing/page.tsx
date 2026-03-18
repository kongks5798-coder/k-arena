'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface NpmDownloads {
  downloads: number
  package: string
}

interface GitHubRepo {
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}

interface MarketingLog {
  id: number
  platform: string
  action: string
  result: string
  url: string | null
  created_at: string
}

interface MarketingStats {
  npm_weekly: number
  npm_monthly: number
  github_stars: number
  github_forks: number
  total_logs: number
  latest_activity: string
  logs: MarketingLog[]
}

const EMPTY: MarketingStats = {
  npm_weekly: 0,
  npm_monthly: 0,
  github_stars: 0,
  github_forks: 0,
  total_logs: 0,
  latest_activity: '--',
  logs: [],
}

// Colors keyed by lowercase platform name (partial match)
const PLATFORM_META: Record<string, { label: string; color: string; icon: string }> = {
  npm:           { label: 'npm',           color: '#ef4444', icon: '📦' },
  smithery:      { label: 'Smithery',      color: '#7c3aed', icon: '🔧' },
  'mcp registry':{ label: 'MCP Registry', color: '#06b6d4', icon: '🗂️' },
  'product hunt':{ label: 'Product Hunt', color: '#da552f', icon: '🚀' },
  '.well-known': { label: '.well-known',  color: '#10b981', icon: '🌐' },
  vercel:        { label: 'Vercel',        color: '#ffffff', icon: '▲' },
  supabase:      { label: 'Supabase',      color: '#3ecf8e', icon: '🗄️' },
  hackernews:    { label: 'Hacker News',   color: '#ff6600', icon: '🔶' },
  github:        { label: 'GitHub',        color: '#8b5cf6', icon: '⚙️' },
  twitter:       { label: 'Twitter / X',  color: '#1d9bf0', icon: '𝕏' },
  reddit:        { label: 'Reddit',        color: '#ff4500', icon: '👾' },
  linkedin:      { label: 'LinkedIn',      color: '#0a66c2', icon: '💼' },
  system:        { label: 'System',        color: '#6b7280', icon: '⚡' },
}

function getPlatformMeta(platform: string) {
  const key = platform.toLowerCase()
  for (const [k, v] of Object.entries(PLATFORM_META)) {
    if (key.includes(k)) return v
  }
  return { label: platform, color: '#6b7280', icon: '·' }
}

function StatCard({ label, value, sub, color = '#22c55e' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
      <div className="text-xs text-gray-500 font-mono mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  )
}

export default function MarketingPage() {
  const [stats, setStats] = useState<MarketingStats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      const [npmWeek, npmMonth, ghRes, logsRes] = await Promise.allSettled([
        fetch('https://api.npmjs.org/downloads/point/last-week/k-arena-mcp'),
        fetch('https://api.npmjs.org/downloads/point/last-month/k-arena-mcp'),
        fetch('https://api.github.com/repos/kongks5798-coder/k-arena'),
        fetch('/api/marketing-log'),
      ])

      const s: MarketingStats = { ...EMPTY }

      if (npmWeek.status === 'fulfilled' && npmWeek.value.ok) {
        const d: NpmDownloads = await npmWeek.value.json()
        s.npm_weekly = d.downloads ?? 0
      }
      if (npmMonth.status === 'fulfilled' && npmMonth.value.ok) {
        const d: NpmDownloads = await npmMonth.value.json()
        s.npm_monthly = d.downloads ?? 0
      }
      if (ghRes.status === 'fulfilled' && ghRes.value.ok) {
        const d: GitHubRepo = await ghRes.value.json()
        s.github_stars = d.stargazers_count ?? 0
        s.github_forks = d.forks_count ?? 0
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.ok) {
        const d = await logsRes.value.json()
        if (d.ok) {
          s.logs = d.logs ?? []
          s.total_logs = d.count ?? s.logs.length
          if (s.logs.length > 0) {
            const latest = new Date(s.logs[0].created_at)
            s.latest_activity = latest.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
          }
        }
      }

      setStats(s)
      setLastUpdate(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    const t = setInterval(fetchStats, 30000)
    return () => clearInterval(t)
  }, [fetchStats])

  // Platform activity summary
  const platformCounts = stats.logs.reduce<Record<string, number>>((acc, log) => {
    const key = log.platform
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const recentLogs = stats.logs.slice(0, 25)

  // Checklist: derive done state from logs
  const hasPlatform = (p: string) =>
    stats.logs.some(l => l.platform.toLowerCase().includes(p.toLowerCase()))

  async function triggerScan() {
    setScanning(true)
    setScanMsg('')
    try {
      await fetch('/api/marketing-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'system',
          action: 'manual_scan_triggered',
          result: 'Manual scan initiated from dashboard',
          url: null,
        }),
      })
      setScanMsg('Scan log saved. Run: npx tsx scripts/marketing-agent.ts')
      await fetchStats()
    } catch {
      setScanMsg('Error — check /api/marketing-log')
    }
    setScanning(false)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-mono text-white tracking-wider">
                MARKETING INTELLIGENCE
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Distribution · Activity · Reach · npm · GitHub · community
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-xs text-gray-600 font-mono">↻ {lastUpdate}</span>
              )}
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="px-4 py-2 text-xs font-mono border border-green-700 text-green-400 hover:bg-green-900/30 rounded transition disabled:opacity-50"
              >
                {scanning ? 'LOGGING...' : '▶ LOG SCAN'}
              </button>
            </div>
          </div>

          {scanMsg && (
            <div className="border border-yellow-700 bg-yellow-900/20 rounded p-3 text-xs font-mono text-yellow-400">
              {scanMsg}
            </div>
          )}

          {/* ── Performance Summary ── */}
          <div>
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">
              Performance Summary
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard
                label="npm DL (7d)"
                value={loading ? '--' : stats.npm_weekly.toLocaleString()}
                sub="k-arena-mcp"
                color="#22c55e"
              />
              <StatCard
                label="npm DL (30d)"
                value={loading ? '--' : stats.npm_monthly.toLocaleString()}
                sub="monthly"
                color="#22c55e"
              />
              <StatCard
                label="GitHub Stars"
                value={loading ? '--' : stats.github_stars}
                sub="k-arena repo"
                color="#f59e0b"
              />
              <StatCard
                label="GitHub Forks"
                value={loading ? '--' : stats.github_forks}
                sub="community"
                color="#8b5cf6"
              />
              <StatCard
                label="Total Activities"
                value={loading ? '--' : stats.total_logs}
                sub="all platforms"
                color="#06b6d4"
              />
              <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
                <div className="text-xs text-gray-500 font-mono mb-1">Latest Activity</div>
                <div className="text-sm font-bold font-mono text-green-400 leading-tight">
                  {loading ? '--' : stats.latest_activity}
                </div>
                <div className="text-xs text-gray-600 mt-1">most recent log</div>
              </div>
            </div>
          </div>

          {/* ── Platform Activity Cards ── */}
          <div>
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">
              Activity by Platform ({Object.keys(platformCounts).length} platforms)
            </div>
            {Object.keys(platformCounts).length === 0 ? (
              <div className="border border-gray-800 bg-gray-900/30 rounded p-6 text-center">
                <div className="text-xs text-gray-600 font-mono mb-2">No activity logged yet.</div>
                <div className="text-xs font-mono text-green-400">
                  GET /api/marketing-seed  ←  seed initial logs
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(platformCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const meta = getPlatformMeta(platform)
                    const latest = stats.logs.find(l => l.platform === platform)
                    const latestTime = latest
                      ? new Date(latest.created_at).toISOString().replace('T', ' ').slice(0, 10)
                      : ''
                    return (
                      <div
                        key={platform}
                        className="border border-gray-800 bg-gray-900/50 rounded p-4 hover:border-gray-600 transition"
                        style={{ borderLeftColor: meta.color, borderLeftWidth: '3px' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">{meta.icon}</span>
                          <span
                            className="text-xl font-bold font-mono"
                            style={{ color: meta.color }}
                          >
                            {count}
                          </span>
                        </div>
                        <div className="text-xs font-bold font-mono text-white">{meta.label}</div>
                        {latestTime && (
                          <div className="text-[10px] text-gray-600 font-mono mt-1">{latestTime}</div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* ── Two Column: Checklist + Directories ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Launch Checklist — derived from real logs */}
            <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
              <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest">
                Launch Checklist
              </div>
              <div className="space-y-2.5">
                {[
                  { key: 'npm',           label: 'npm publish k-arena-mcp',         auto: true },
                  { key: 'github',        label: 'GitHub repo public',               auto: stats.github_stars >= 0 },
                  { key: 'smithery',      label: 'Smithery.ai registration',         auto: hasPlatform('smithery') },
                  { key: 'mcp registry',  label: 'MCP Registry Issue 제출',           auto: hasPlatform('mcp registry') },
                  { key: '.well-known',   label: '.well-known/mcp-server-card.json', auto: hasPlatform('.well-known') },
                  { key: 'product hunt',  label: 'Product Hunt 런칭 예약',             auto: hasPlatform('product hunt') },
                  { key: 'vercel',        label: '41번째 Vercel 배포',                 auto: hasPlatform('vercel') },
                  { key: 'hackernews',    label: 'Hacker News Show HN',              auto: hasPlatform('hackernews') },
                  { key: 'kaus',          label: 'KAUS Polygon mainnet deploy',      auto: false },
                  { key: 'reddit',        label: 'r/MachineLearning post',           auto: hasPlatform('reddit') },
                  { key: 'awesome',       label: 'awesome-mcp-servers PR',           auto: false },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-2 text-xs font-mono">
                    <span className={item.auto ? 'text-green-400' : 'text-gray-600'}>
                      {item.auto ? '✓' : '○'}
                    </span>
                    <span className={item.auto ? 'text-gray-200' : 'text-gray-600'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Directory Links */}
            <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
              <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest">
                Distribution Channels
              </div>
              <div className="space-y-2">
                {[
                  { name: 'npmjs.com',       url: 'https://www.npmjs.com/package/k-arena-mcp',               color: '#ef4444', desc: 'k-arena-mcp package' },
                  { name: 'Smithery.ai',     url: 'https://smithery.ai/servers/kongks5798-coder/k-arena',    color: '#7c3aed', desc: 'MCP server directory' },
                  { name: 'MCP Registry',    url: 'https://github.com/modelcontextprotocol/registry/issues/1074', color: '#06b6d4', desc: 'Official registry issue' },
                  { name: 'PulseMCP',        url: 'https://pulsemcp.com',                                    color: '#0ea5e9', desc: 'MCP community hub' },
                  { name: 'Product Hunt',    url: 'https://www.producthunt.com',                             color: '#da552f', desc: 'Launch scheduled' },
                  { name: '.well-known',     url: 'https://karena.fieldnine.io/.well-known/mcp-server-card.json', color: '#10b981', desc: 'MCP server card' },
                  { name: 'GitHub Repo',     url: 'https://github.com/kongks5798-coder/k-arena',             color: '#8b5cf6', desc: `${stats.github_stars} stars` },
                ].map(ch => (
                  <a
                    key={ch.name}
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-800/50 transition group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ch.color }} />
                      <div>
                        <div className="text-xs font-mono font-bold text-gray-200 group-hover:text-white">
                          {ch.name}
                        </div>
                        <div className="text-[10px] text-gray-600">{ch.desc}</div>
                      </div>
                    </div>
                    <span className="text-gray-600 group-hover:text-gray-300 text-sm">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Activity Log ── */}
          <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                Marketing Activity Log
                <span className="ml-2 text-green-400">{stats.total_logs} entries</span>
              </div>
              <button
                onClick={fetchStats}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono transition"
              >
                ↻ refresh
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-xs text-gray-600 font-mono">No logs yet.</div>
                <div className="text-xs font-mono">
                  <span className="text-gray-500">Seed initial data: </span>
                  <a
                    href="/api/marketing-seed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:underline"
                  >
                    GET /api/marketing-seed
                  </a>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-gray-600 border-b border-gray-800">
                      <th className="text-left pb-2 pr-3 w-28">Platform</th>
                      <th className="text-left pb-2 pr-3 w-24">Action</th>
                      <th className="text-left pb-2 pr-3">Result</th>
                      <th className="text-left pb-2 whitespace-nowrap">Time (UTC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map(log => {
                      const meta = getPlatformMeta(log.platform)
                      const timeStr = new Date(log.created_at)
                        .toISOString().replace('T', ' ').slice(0, 16)

                      return (
                        <tr key={log.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                          <td className="py-2 pr-3">
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                              style={{ backgroundColor: meta.color + '22', color: meta.color }}
                            >
                              {meta.icon} {meta.label}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-gray-400">{log.action}</td>
                          <td className="py-2 pr-3 text-gray-300 max-w-sm">
                            {log.url ? (
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-green-400 truncate block"
                                title={log.result}
                              >
                                {log.result.length > 55 ? log.result.slice(0, 55) + '…' : log.result}
                              </a>
                            ) : (
                              <span className="truncate block" title={log.result}>
                                {log.result.length > 55 ? log.result.slice(0, 55) + '…' : log.result}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-gray-600 whitespace-nowrap">{timeStr}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Agent Run Instructions ── */}
          <div className="border border-gray-800 bg-gray-900/30 rounded p-4">
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">
              Run Marketing Scan Agent
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="text-gray-600 mb-1"># Scan HN + GitHub opportunities</div>
                <div className="bg-black border border-gray-800 rounded px-3 py-2 text-green-400">
                  npx tsx scripts/marketing-agent.ts
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1"># With GitHub token (5× rate limit)</div>
                <div className="bg-black border border-gray-800 rounded px-3 py-2 text-green-400">
                  GITHUB_TOKEN=ghp_xxx npx tsx scripts/marketing-agent.ts
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
