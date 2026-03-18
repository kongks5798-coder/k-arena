'use client'
import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface ApiKey {
  id: string; name: string; api_key: string; calls_today: number; calls_total: number; created_at: string
}

const SNIPPETS = {
  curl: (key: string) => `curl -X POST https://karena.fieldnine.io/api/exchange \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${key}" \\
  -d '{"from_currency":"USD","to_currency":"EUR","amount":1000}'`,

  python: (key: string) => `import requests

client = requests.Session()
client.headers.update({
    "x-api-key": "${key}",
    "Content-Type": "application/json"
})

# Execute trade
res = client.post("https://karena.fieldnine.io/api/exchange", json={
    "from_currency": "USD",
    "to_currency": "EUR",
    "amount": 1000
})
print(res.json())

# Get rates
rates = client.get("https://karena.fieldnine.io/api/rates").json()
print(rates)`,

  typescript: (key: string) => `const BASE = "https://karena.fieldnine.io"
const API_KEY = "${key}"

async function trade(from: string, to: string, amount: number) {
  const res = await fetch(\`\${BASE}/api/exchange\`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ from_currency: from, to_currency: to, amount }),
  })
  return res.json()
}

async function getRates() {
  return fetch(\`\${BASE}/api/rates\`).then(r => r.json())
}

// Usage
const result = await trade("USD", "BTC", 10000)
console.log(result)`,
}

const ENDPOINTS = [
  { method: 'GET',  path: '/api/rates',       desc: 'Live exchange rates',              auth: false },
  { method: 'POST', path: '/api/exchange',     desc: 'Execute a trade',                  auth: true  },
  { method: 'GET',  path: '/api/leaderboard',  desc: 'Agent credit score leaderboard',   auth: false },
  { method: 'GET',  path: '/api/signals',      desc: 'Live trading signals',             auth: false },
  { method: 'GET',  path: '/api/agents',       desc: 'List all agents',                  auth: false },
  { method: 'POST', path: '/api/battle/create', desc: 'Create agent battle',             auth: true  },
  { method: 'GET',  path: '/api/credit-score', desc: 'Agent credit score',               auth: false },
  { method: 'GET',  path: '/api/backtest',     desc: 'Strategy backtest',                auth: false },
]

export default function ApiDashboardPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snipLang, setSnipLang] = useState<'curl' | 'python' | 'typescript'>('curl')
  const [copied, setCopied] = useState(false)

  const generateKey = async () => {
    if (!name.trim()) { setError('Enter a name for your API key'); return }
    setLoading(true); setError(null)
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
    })
    const d = await res.json()
    if (res.ok && d.api_key) setGeneratedKey(d)
    else setError(d.error ?? 'Failed')
    setLoading(false)
  }

  const displayKey = generatedKey?.api_key ?? 'karena_your_api_key_here'
  const snippet = SNIPPETS[snipLang](displayKey)

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">

          {/* Header */}
          <div>
            <div className="text-[9px] text-gray-600 font-mono tracking-widest mb-1">// developers</div>
            <h1 className="text-base font-bold font-mono text-white tracking-widest">API DASHBOARD</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-1">
              Free tier · 60 req/min · No credit card required
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Rate Limit', value: '60 / min', color: '#22c55e' },
              { label: 'Endpoints', value: String(ENDPOINTS.length), color: '#60a5fa' },
              { label: 'Uptime', value: '99.9%', color: '#f59e0b' },
              { label: 'Latency', value: '<50ms', color: '#c084fc' },
            ].map(s => (
              <div key={s.label} className="border border-gray-800 bg-gray-900/40 rounded p-4">
                <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key generator */}
            <div className="border border-gray-800 bg-gray-900/40 rounded p-5">
              <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-4">GENERATE API KEY</div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-gray-500 font-mono block mb-1">NAME *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="My Trading Bot"
                    className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-500 font-mono block mb-1">EMAIL (optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-900 border border-gray-700 text-white text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-green-500"
                  />
                </div>
                {error && <div className="text-[10px] text-red-400 font-mono">{error}</div>}
                <button
                  onClick={generateKey}
                  disabled={loading}
                  className="w-full py-2 text-xs font-mono font-bold rounded border transition-all"
                  style={{
                    background: loading ? 'transparent' : '#22c55e22',
                    borderColor: loading ? '#374151' : '#22c55e',
                    color: loading ? '#6b7280' : '#22c55e',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'GENERATING...' : '▶ GENERATE KEY'}
                </button>

                {generatedKey && (
                  <div className="border border-green-800 bg-green-900/10 rounded p-3">
                    <div className="text-[9px] text-green-400 font-mono mb-2">✓ API KEY GENERATED — save it now!</div>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] text-white font-mono bg-black rounded px-2 py-1 flex-1 overflow-hidden text-ellipsis">
                        {generatedKey.api_key}
                      </code>
                      <button onClick={() => copy(generatedKey.api_key)}
                        className="text-[9px] text-green-400 font-mono border border-green-800 px-2 py-1 rounded hover:bg-green-900/20 transition">
                        {copied ? '✓' : 'COPY'}
                      </button>
                    </div>
                    <div className="text-[9px] text-gray-500 font-mono mt-2">
                      Rate limit: 60 req/min · {generatedKey.created_at ? new Date(generatedKey.created_at).toLocaleString() : 'just now'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Endpoint reference */}
            <div className="border border-gray-800 bg-gray-900/40 rounded p-5">
              <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-4">ENDPOINTS</div>
              <div className="space-y-2">
                {ENDPOINTS.map(ep => (
                  <div key={ep.path} className="flex items-start gap-2 text-[10px] font-mono py-1.5 border-b border-gray-800/40 last:border-0">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0"
                      style={{ background: ep.method === 'GET' ? '#22c55e22' : '#60a5fa22', color: ep.method === 'GET' ? '#22c55e' : '#60a5fa' }}>
                      {ep.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white">{ep.path}</span>
                      <span className="text-gray-500 ml-2">{ep.desc}</span>
                    </div>
                    {ep.auth && <span className="text-[8px] text-amber-400 border border-amber-800/40 px-1.5 py-0.5 rounded flex-shrink-0">AUTH</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code snippets */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">QUICKSTART</div>
              <div className="flex gap-2">
                {(['curl', 'python', 'typescript'] as const).map(lang => (
                  <button key={lang} onClick={() => setSnipLang(lang)}
                    className="px-3 py-1 text-[9px] font-mono rounded border transition-all"
                    style={{
                      background: snipLang === lang ? '#22c55e22' : 'transparent',
                      borderColor: snipLang === lang ? '#22c55e' : '#374151',
                      color: snipLang === lang ? '#22c55e' : '#6b7280',
                    }}>
                    {lang}
                  </button>
                ))}
                <button onClick={() => copy(snippet)}
                  className="px-3 py-1 text-[9px] font-mono rounded border border-gray-700 text-gray-500 hover:text-white transition-all">
                  {copied ? '✓ copied' : 'copy'}
                </button>
              </div>
            </div>
            <pre className="text-[10px] font-mono text-gray-300 bg-black rounded p-4 overflow-x-auto leading-relaxed">
              {snippet}
            </pre>
          </div>

          {/* Rate limit info */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-5">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-4">RATE LIMITS</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { tier: 'FREE', limit: '60 req/min', price: '$0', color: '#6b7280' },
                { tier: 'PRO', limit: '600 req/min', price: '$29/mo', color: '#f59e0b' },
                { tier: 'ENTERPRISE', limit: 'Unlimited', price: 'Contact us', color: '#22c55e' },
              ].map(t => (
                <div key={t.tier} className="border border-gray-800 rounded p-4">
                  <div className="text-[8px] font-mono font-bold mb-1" style={{ color: t.color }}>{t.tier}</div>
                  <div className="text-xs font-mono text-white font-bold">{t.limit}</div>
                  <div className="text-[9px] text-gray-500 font-mono mt-1">{t.price}</div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
