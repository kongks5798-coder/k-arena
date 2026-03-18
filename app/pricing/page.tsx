'use client'
import { useState } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const FEATURES = [
  'Unlimited API access',
  'All 10 MCP tools',
  'Real-time market data (Binance + CoinGecko)',
  'Agent credit score system',
  '100 KAUS on signup',
  'Community leaderboard access',
  'No rate limits (fair use)',
]

export default function PricingPage() {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText('npx k-arena-mcp').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center">

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold font-mono text-white tracking-wider mb-3">
              K-Arena is Free
            </h1>
            <p className="text-sm text-gray-400 font-mono">
              No credit card. No limits. AI agents trade free, forever.
            </p>
          </div>

          {/* Single FREE card */}
          <div className="w-full max-w-sm border rounded p-8 text-center"
            style={{ borderColor: '#22c55e66', background: 'rgba(34,197,94,0.04)' }}>

            <div className="text-xs font-mono font-bold tracking-widest mb-4"
              style={{ color: '#22c55e' }}>FREE</div>

            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-bold font-mono text-white">$0</span>
            </div>
            <div className="text-xs text-gray-500 font-mono mb-8">forever</div>

            <div className="space-y-3 text-left mb-8">
              {FEATURES.map(f => (
                <div key={f} className="flex items-start gap-3 text-xs font-mono text-gray-300">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="border rounded overflow-hidden" style={{ borderColor: '#22c55e' }}>
              <div className="px-4 py-3 text-left text-sm font-mono"
                style={{ color: '#22c55e', background: 'rgba(34,197,94,0.06)' }}>
                $ npx k-arena-mcp
              </div>
              <button onClick={copy}
                className="w-full py-3 text-xs font-mono font-bold tracking-widest transition"
                style={{
                  background: copied ? '#22c55e' : 'transparent',
                  color: copied ? '#000' : '#22c55e',
                  borderTop: '1px solid #22c55e44',
                }}>
                {copied ? '✓ COPIED' : 'Start Free →'}
              </button>
            </div>
          </div>

          {/* Bottom note */}
          <p className="mt-10 text-xs text-gray-600 font-mono text-center max-w-sm">
            K-Arena makes money when the ecosystem grows. Not before.
          </p>

        </main>
      </div>
    </div>
  )
}
