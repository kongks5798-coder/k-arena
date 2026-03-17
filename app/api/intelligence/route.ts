import { NextResponse, NextRequest } from 'next/server'

// 고정 BASE URL - self-fetch 루프 방지
const BASE = 'https://karena.fieldnine.io'

function randF(min: number, max: number, d = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(d))
}

// stats를 직접 생성 (자기 참조 없음)
function getMockStats() {
  return {
    platform: {
      total_volume_24h: randF(400000, 650000, 0),
      active_agents: 6,
      kaus_price: randF(0.98, 1.05, 4),
      kaus_change_24h: randF(-3, 4, 2),
    },
    pairs: [
      { pair: 'XAU/KAUS', price: randF(2340, 2380, 2), change: randF(-1.5, 2, 3) },
      { pair: 'USD/KAUS', price: randF(0.99, 1.02, 4), change: randF(-0.5, 0.8, 3) },
      { pair: 'ETH/KAUS', price: randF(3200, 3500, 2), change: randF(-3, 4, 3) },
      { pair: 'BTC/KAUS', price: randF(85000, 95000, 0), change: randF(-2, 3, 3) },
      { pair: 'OIL/KAUS', price: randF(78, 86, 2), change: randF(-1.5, 2, 3) },
      { pair: 'EUR/KAUS', price: randF(1.07, 1.12, 4), change: randF(-0.5, 0.8, 3) },
    ],
  }
}

// Supabase에서 실제 stats 가져오기
async function getLiveStats() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return getMockStats()

  try {
    const [agR, txR] = await Promise.all([
      fetch(`${url}/rest/v1/agents?select=*&order=vol_24h.desc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`${url}/rest/v1/transactions?select=amount,pair&order=created_at.desc&limit=100`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      }),
    ])

    const agents = agR.ok ? await agR.json() : []
    const txs = txR.ok ? await txR.json() : []

    const totalVol = Array.isArray(agents)
      ? agents.reduce((s: number, a: { vol_24h: number }) => s + (a.vol_24h || 0), 0)
      : getMockStats().platform.total_volume_24h

    return {
      platform: {
        total_volume_24h: totalVol,
        active_agents: Array.isArray(agents) ? agents.length : 6,
        kaus_price: randF(0.98, 1.05, 4),
        kaus_change_24h: randF(-3, 4, 2),
        recent_tx_count: Array.isArray(txs) ? txs.length : 0,
      },
      agents: Array.isArray(agents) ? agents.slice(0, 6) : [],
      pairs: getMockStats().pairs,
    }
  } catch {
    return getMockStats()
  }
}

async function generateWithClaude(type: string, stats: ReturnType<typeof getMockStats>) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompts: Record<string, string> = {
    market_summary: `K-Arena AI Exchange stats:
- 24H Volume: $${stats.platform.total_volume_24h.toLocaleString()}
- Agents: ${stats.platform.active_agents} ONLINE
- KAUS: $${stats.platform.kaus_price} (${stats.platform.kaus_change_24h > 0 ? '+' : ''}${stats.platform.kaus_change_24h}% 24h)
- Top pairs: ${stats.pairs.slice(0, 3).map(p => `${p.pair} ${p.change > 0 ? '▲' : '▼'}${Math.abs(p.change).toFixed(2)}%`).join(', ')}

Write a 3-sentence professional market summary for AI trading agents. Be specific and data-driven.`,

    risk_alert: `K-Arena market data:
${stats.pairs.map(p => `${p.pair}: ${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}%`).join('\n')}
KAUS: ${stats.platform.kaus_change_24h > 0 ? '+' : ''}${stats.platform.kaus_change_24h}% 24h

Identify 2-3 risk factors. Be concise and actionable for AI agents.`,

    pair_analysis: `Analyze these K-Arena trading pairs:
${stats.pairs.map(p => `${p.pair}: price $${p.price > 1000 ? p.price.toLocaleString() : p.price.toFixed(4)}, change ${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}%`).join('\n')}

Rank by opportunity (best to worst) with 1-line reasoning each. Format: PAIR: reasoning.`,
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompts[type] || prompts.market_summary }],
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) return null
    const d = await r.json()
    return d.content?.[0]?.text || null
  } catch {
    return null
  }
}

// 폴백 분석 (Claude 없을 때)
function getFallbackAnalysis(type: string, stats: ReturnType<typeof getMockStats>) {
  const topGainer = [...stats.pairs].sort((a, b) => b.change - a.change)[0]
  const topLoser = [...stats.pairs].sort((a, b) => a.change - b.change)[0]
  const vol = stats.platform.total_volume_24h
  const kaus = stats.platform.kaus_price

  const analyses: Record<string, string> = {
    market_summary: `K-Arena 24H volume reached $${(vol / 1000).toFixed(0)}K with ${stats.platform.active_agents} AI agents trading autonomously. ${topGainer.pair} leads gains at ${topGainer.change > 0 ? '+' : ''}${topGainer.change.toFixed(2)}%, while ${topLoser.pair} shows weakness at ${topLoser.change.toFixed(2)}%. KAUS settled at $${kaus.toFixed(4)}, reflecting ${stats.platform.kaus_change_24h > 0 ? 'positive' : 'negative'} momentum across the platform.`,

    risk_alert: `⚠️ Risk Assessment:\n1. ${topLoser.pair} showing ${Math.abs(topLoser.change).toFixed(2)}% decline — reduce exposure\n2. KAUS volatility at ${Math.abs(stats.platform.kaus_change_24h).toFixed(2)}% — monitor settlement risk\n3. Volume concentration: ensure diversification across pairs`,

    pair_analysis: stats.pairs
      .sort((a, b) => b.change - a.change)
      .map((p, i) => `${i + 1}. ${p.pair}: ${p.change > 0 ? '▲ BULLISH' : '▼ BEARISH'} ${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}% — ${p.change > 1 ? 'strong momentum, consider LONG' : p.change < -1 ? 'selling pressure, watch support' : 'range-bound, wait for breakout'}`)
      .join('\n'),
  }

  return analyses[type] || analyses.market_summary
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'market_summary'
  const validTypes = ['market_summary', 'risk_alert', 'pair_analysis']
  const analysisType = validTypes.includes(type) ? type : 'market_summary'

  try {
    const stats = await getLiveStats()
    const claudeAnalysis = await generateWithClaude(analysisType, stats as ReturnType<typeof getMockStats>)
    const analysis = claudeAnalysis || getFallbackAnalysis(analysisType, stats as ReturnType<typeof getMockStats>)

    return NextResponse.json({
      type: analysisType,
      analysis,
      powered_by: claudeAnalysis ? 'claude-haiku' : 'k-arena-engine',
      market_snapshot: {
        volume_24h: stats.platform.total_volume_24h,
        kaus_price: stats.platform.kaus_price,
        kaus_change: stats.platform.kaus_change_24h,
        top_pair: stats.pairs.sort((a, b) => b.change - a.change)[0]?.pair,
      },
      generated_at: new Date().toISOString(),
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
