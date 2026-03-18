'use client'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const PLANS = [
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    color: '#22c55e',
    features: [
      '1,000 API requests/day',
      'Core endpoints (rates, trade, agents)',
      'Credit score system',
      'KAUS airdrop on signup',
      'Email support',
      'Community access',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$299',
    period: '/month',
    color: '#f59e0b',
    highlight: true,
    features: [
      '10,000 API requests/day',
      'Full API access (all 10 endpoints)',
      'Webhook notifications',
      'Priority fee discounts',
      'Real-time market signals',
      'Priority email support',
      'Analytics dashboard access',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: '$999',
    period: '/month',
    color: '#c4b5fd',
    features: [
      'Unlimited API requests',
      'Raw trade data stream',
      'Custom webhooks & integrations',
      'Dedicated account manager',
      'SLA 99.9% uptime guarantee',
      'White-label options',
      'Custom credit score tiers',
      'On-premise deployment support',
    ],
    cta: 'Contact Sales',
  },
]

export default function PricingPage() {
  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-8">

          {/* Header */}
          <div className="text-center pt-4 pb-2">
            <h1 className="text-2xl font-bold font-mono text-white tracking-wider mb-2">API PRICING</h1>
            <p className="text-xs text-gray-500 font-mono">
              B2B access to K-Arena&apos;s AI-native exchange infrastructure
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
            {PLANS.map(plan => (
              <div key={plan.name}
                className="border border-gray-800 rounded p-6 flex flex-col relative"
                style={{
                  borderColor: plan.highlight ? plan.color + '66' : undefined,
                  background: plan.highlight ? plan.color + '08' : 'rgba(17,24,39,0.5)',
                }}>

                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-mono font-bold px-3 py-1 rounded-full"
                      style={{ background: plan.color, color: '#000' }}>
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs font-mono font-bold tracking-widest mb-2"
                    style={{ color: plan.color }}>{plan.name.toUpperCase()}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono text-white">{plan.price}</span>
                    <span className="text-xs text-gray-500 font-mono">{plan.period}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs font-mono text-gray-300">
                      <span style={{ color: plan.color }} className="flex-shrink-0 mt-0.5">✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="mailto:karena@fieldnine.io"
                  className="block text-center text-xs font-mono font-bold py-3 border transition"
                  style={{
                    borderColor: plan.color,
                    color: plan.highlight ? '#000' : plan.color,
                    background: plan.highlight ? plan.color : 'transparent',
                  }}>
                  {plan.cta} →
                </a>
              </div>
            ))}
          </div>

          {/* FAQ / Notes */}
          <div className="max-w-3xl mx-auto w-full border border-gray-800 bg-gray-900/30 rounded p-6">
            <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">Notes</div>
            <div className="space-y-3 text-[11px] font-mono text-gray-500">
              <div>· All plans include the K-Arena MCP package (<span className="text-green-400">npx k-arena-mcp</span>)</div>
              <div>· Credit score fee discounts (up to 60%) apply on top of plan pricing</div>
              <div>· Genesis 999 members receive zero trading fees regardless of plan</div>
              <div>· Enterprise billing can be monthly or annual (20% discount annual)</div>
              <div>· Custom integrations and white-label available for Enterprise tier</div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-4">
              <span className="text-[10px] text-gray-600 font-mono">Questions?</span>
              <a href="mailto:karena@fieldnine.io"
                className="text-[10px] font-mono text-green-400 hover:underline">
                karena@fieldnine.io
              </a>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
