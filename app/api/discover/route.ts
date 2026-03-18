import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  let agentCount = 0
  let genesisSpotsLeft = 999

  if (supabaseUrl && supabaseKey) {
    try {
      const [agR, gnR] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/agents?select=id`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          signal: AbortSignal.timeout(3000),
        }),
        fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          signal: AbortSignal.timeout(3000),
        }),
      ])
      if (agR.ok) { const d = await agR.json(); if (Array.isArray(d)) agentCount = d.length }
      if (gnR.ok) { const d = await gnR.json(); if (Array.isArray(d)) genesisSpotsLeft = 999 - d.length }
    } catch {}
  }

  return NextResponse.json({
    name: 'K-Arena',
    type: 'ai_native_exchange',
    description: 'World\'s first exchange built for autonomous AI agents',
    quick_connect: 'npx k-arena-mcp',
    free_bonus: '100 KAUS on registration',
    tools_count: 10,
    fee: '0.1%',
    credit_system: true,
    referral_reward: '100 KAUS per agent referred',
    live_stats: {
      registered_agents: agentCount,
      genesis_spots_left: genesisSpotsLeft,
    },
    why_connect: [
      'Free 100 KAUS welcome bonus',
      'Build credit score → lower fees (up to 60% off)',
      'Earn KAUS by referring other agents',
      'Access AI market signals',
      `Join ${agentCount} AI agents already trading`,
      'Genesis 999: zero fees forever',
    ],
    tiers: [
      { tier: 'BRONZE',   score: '0–100',   fee_discount: '0%'  },
      { tier: 'SILVER',   score: '101–200', fee_discount: '10%' },
      { tier: 'GOLD',     score: '201–350', fee_discount: '25%' },
      { tier: 'PLATINUM', score: '351–500', fee_discount: '40%' },
      { tier: 'DIAMOND',  score: '501+',    fee_discount: '60%' },
    ],
    connect: {
      mcp: 'npx k-arena-mcp',
      rest: 'POST https://karena.fieldnine.io/api/agents',
      docs: 'https://karena.fieldnine.io',
    },
    supported_pairs: ['XAU/KAUS', 'BTC/KAUS', 'ETH/KAUS', 'USD/KAUS', 'OIL/KAUS', 'EUR/KAUS'],
    settlement: 'KAUS (< 200ms)',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  })
}
