'use client'
import { useState, useEffect, useCallback } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface NpmDownloads {
  downloads: number
  start: string
  end: string
  package: string
}

interface GitHubRepo {
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  watchers_count: number
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
  smithery_rank: string
  total_logs: number
  logs: MarketingLog[]
}

const EMPTY: MarketingStats = {
  npm_weekly: 0,
  npm_monthly: 0,
  github_stars: 0,
  github_forks: 0,
  smithery_rank: '--',
  total_logs: 0,
  logs: [],
}

const PLATFORM_COLORS: Record<string, string> = {
  hackernews: '#ff6600',
  github: '#7c3aed',
  twitter: '#1d9bf0',
  reddit: '#ff4500',
  linkedin: '#0a66c2',
  producthunt: '#da552f',
}

const PLATFORM_LABELS: Record<string, string> = {
  hackernews: 'Hacker News',
  github: 'GitHub',
  twitter: 'Twitter / X',
  reddit: 'Reddit',
  linkedin: 'LinkedIn',
  producthunt: 'Product Hunt',
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
  const [scanResult, setScanResult] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      // Fetch in parallel: npm downloads, GitHub stars, marketing logs
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
          s.total_logs = d.count ?? 0
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

  // Count logs by platform
  const platformCounts = stats.logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.platform] = (acc[log.platform] ?? 0) + 1
    return acc
  }, {})

  const recentLogs = stats.logs.slice(0, 20)

  async function triggerScan() {
    setScanning(true)
    setScanResult('')
    try {
      // The marketing agent is a script, not a server route.
      // We POST a synthetic scan-start log and display instructions.
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
      setScanResult('Scan log recorded. Run: npx tsx scripts/marketing-agent.ts')
      await fetchStats()
    } catch {
      setScanResult('Error triggering scan')
    }
    setScanning(false)
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-mono text-white tracking-wider">
                MARKETING INTELLIGENCE
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                AI-powered opportunity scanner · npm · GitHub · community reach
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className="text-xs text-gray-600 font-mono">
                  Updated: {lastUpdate}
                </span>
              )}
              <button
                onClick={triggerScan}
                disabled={scanning}
                className="px-4 py-2 text-xs font-mono border border-green-700 text-green-400 hover:bg-green-900/30 rounded transition disabled:opacity-50"
              >
                {scanning ? 'SCANNING...' : '▶ RUN SCAN'}
              </button>
            </div>
          </div>

          {scanResult && (
            <div className="border border-yellow-700 bg-yellow-900/20 rounded p-3 text-xs font-mono text-yellow-400">
              {scanResult}
            </div>
          )}

          {/* Distribution KPIs */}
          <div>
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">
              Distribution Metrics
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="npm downloads (7d)"
                value={loading ? '--' : stats.npm_weekly.toLocaleString()}
                sub="k-arena-mcp package"
                color="#22c55e"
              />
              <StatCard
                label="npm downloads (30d)"
                value={loading ? '--' : stats.npm_monthly.toLocaleString()}
                sub="monthly installs"
                color="#22c55e"
              />
              <StatCard
                label="GitHub Stars"
                value={loading ? '--' : stats.github_stars}
                sub="kongks5798-coder/k-arena"
                color="#f59e0b"
              />
              <StatCard
                label="GitHub Forks"
                value={loading ? '--' : stats.github_forks}
                sub="community forks"
                color="#8b5cf6"
              />
            </div>
          </div>

          {/* Directory Links */}
          <div>
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">
              MCP Directories — Check These Manually
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  name: 'Smithery',
                  url: 'https://smithery.ai/server/k-arena-mcp',
                  desc: 'MCP server directory',
                  color: '#7c3aed',
                },
                {
                  name: 'PulseMCP',
                  url: 'https://pulsemcp.com',
                  desc: 'MCP community hub',
                  color: '#0ea5e9',
                },
                {
                  name: 'npmjs.com',
                  url: 'https://www.npmjs.com/package/k-arena-mcp',
                  desc: 'Package registry',
                  color: '#ef4444',
                },
              ].map(dir => (
                <a
                  key={dir.name}
                  href={dir.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between border border-gray-800 bg-gray-900/50 rounded p-4 hover:border-gray-600 transition group"
                >
                  <div>
                    <div className="text-sm font-bold font-mono" style={{ color: dir.color }}>
                      {dir.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{dir.desc}</div>
                  </div>
                  <span className="text-gray-600 group-hover:text-gray-300 text-lg">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform breakdown */}
            <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
              <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest">
                Activity by Platform
              </div>
              {Object.keys(platformCounts).length === 0 ? (
                <div className="text-xs text-gray-600 font-mono">
                  No activity logged yet. Run the scan agent to populate.
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(platformCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([platform, count]) => {
                      const max = Math.max(...Object.values(platformCounts))
                      const pct = max > 0 ? (count / max) * 100 : 0
                      const color = PLATFORM_COLORS[platform] ?? '#6b7280'
                      return (
                        <div key={platform}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-gray-300">
                              {PLATFORM_LABELS[platform] ?? platform}
                            </span>
                            <span className="text-xs font-mono" style={{ color }}>
                              {count}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full">
                            <div
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Launch checklist */}
            <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
              <div className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-widest">
                Launch Checklist
              </div>
              <div className="space-y-2">
                {[
                  { done: true, label: 'npm publish k-arena-mcp' },
                  { done: stats.github_stars > 0, label: 'GitHub repo public' },
                  { done: false, label: 'Smithery.ai registration' },
                  { done: false, label: 'PulseMCP submission' },
                  { done: false, label: 'Product Hunt launch' },
                  { done: false, label: 'Hacker News Show HN' },
                  { done: false, label: 'KAUS Polygon mainnet deploy' },
                  { done: false, label: 'r/MachineLearning post' },
                  { done: false, label: 'awesome-mcp-servers PR' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs font-mono">
                    <span className={item.done ? 'text-green-400' : 'text-gray-600'}>
                      {item.done ? '✓' : '○'}
                    </span>
                    <span className={item.done ? 'text-gray-300' : 'text-gray-600'}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="border border-gray-800 bg-gray-900/50 rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                Marketing Activity Log ({stats.total_logs} total)
              </div>
              <button
                onClick={fetchStats}
                className="text-xs text-gray-600 hover:text-gray-400 font-mono transition"
              >
                ↻ refresh
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="text-xs text-gray-600 font-mono py-8 text-center">
                No logs yet. Run: <span className="text-green-400">npx tsx scripts/marketing-agent.ts</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-gray-600 border-b border-gray-800">
                      <th className="text-left pb-2 pr-4">Platform</th>
                      <th className="text-left pb-2 pr-4">Action</th>
                      <th className="text-left pb-2 pr-4 max-w-xs">Result</th>
                      <th className="text-left pb-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map(log => {
                      let resultPreview = log.result
                      try {
                        const parsed = JSON.parse(log.result)
                        resultPreview = parsed.title ?? log.result
                      } catch {}

                      const color = PLATFORM_COLORS[log.platform] ?? '#6b7280'
                      const ts = new Date(log.created_at)
                      const timeStr = ts.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

                      return (
                        <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-2 pr-4">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px]"
                              style={{ backgroundColor: color + '33', color }}
                            >
                              {PLATFORM_LABELS[log.platform] ?? log.platform}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-gray-400">{log.action}</td>
                          <td className="py-2 pr-4 text-gray-300 max-w-xs">
                            {log.url ? (
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-green-400 truncate block"
                                title={resultPreview}
                              >
                                {resultPreview.slice(0, 60)}{resultPreview.length > 60 ? '…' : ''}
                              </a>
                            ) : (
                              <span className="truncate block" title={resultPreview}>
                                {resultPreview.slice(0, 60)}{resultPreview.length > 60 ? '…' : ''}
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

          {/* Run Instructions */}
          <div className="border border-gray-800 bg-gray-900/30 rounded p-4">
            <div className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-widest">
              Run Marketing Agent
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="text-gray-400">
                <span className="text-gray-600"># Basic scan (no GitHub auth)</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-green-400">
                npx tsx scripts/marketing-agent.ts
              </div>
              <div className="text-gray-400 mt-2">
                <span className="text-gray-600"># With GitHub token (higher rate limit)</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded px-3 py-2 text-green-400">
                GITHUB_TOKEN=ghp_xxx npx tsx scripts/marketing-agent.ts
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
