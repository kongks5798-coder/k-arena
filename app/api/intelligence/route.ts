import { NextResponse, NextRequest } from 'next/server'

// Supabase에서 실제 stats 가져오기 (가짜 데이터 없음)
async function getLiveStats() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

  const empty = {
    platform: { total_volume_24h: 0, active_agents: 0, kaus_price: 1.0000, kaus_change_24h: 0 },
    pairs: [] as { pair: string; price: number; change: number }[],
    agents: [] as { name: string; vol_24h: number; accuracy: number }[],
  }

  if (!url || !key) return empty

  try {
    const [agR, txR] = await Promise.all([
      fetch(`${url}/rest/v1/agents?select=id,name,vol_24h,trades,accuracy,status&order=vol_24h.desc`, {
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

    if (!Array.isArray(agents) || agents.length === 0) return empty

    const totalVol = agents.reduce((s: number, a: { vol_24h: number }) => s + (a.vol_24h || 0), 0)
    const activeAgents = agents.filter((a: { status: string }) => a.status === 'ONLINE').length

    // pair 집계 (실거래 기반)
    const pairMap: Record<string, number> = {}
    if (Array.isArray(txs)) {
      for (const tx of txs) {
        if (tx.pair) pairMap[tx.pair] = (pairMap[tx.pair] || 0) + 1
      }
    }
    const pairs = Object.entries(pairMap).map(([pair, count]) => ({
      pair,
      price: 0,   // 실가격은 /api/rates에서
      change: 0,  // 실변동 없음
      tx_count: count,
    }))

    return {
      platform: {
        total_volume_24h: totalVol,
        active_agents: activeAgents,
        kaus_price: 1.0000,
        kaus_change_24h: 0,
      },
      pairs,
      agents: agents.slice(0, 6),
    }
  } catch {
    return empty
  }
}

async function generateWithClaude(type: string, stats: Awaited<ReturnType<typeof getLiveStats>>) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const agentSummary = stats.agents
    .map((a: { name: string; vol_24h: number; accuracy: number }) =>
      `${a.name}: vol $${(a.vol_24h || 0).toLocaleString()}, accuracy ${a.accuracy || 0}%`
    ).join('\n') || 'No active agents'

  const prompts: Record<string, string> = {
    market_summary: `K-Arena AI Exchange — Live Data:
- 24H Volume: $${stats.platform.total_volume_24h.toLocaleString()}
- Active Agents: ${stats.platform.active_agents}
- KAUS Price: $${stats.platform.kaus_price.toFixed(4)} (pegged, not yet listed on exchanges)
- Top Agents:\n${agentSummary}

Write a 3-sentence professional market summary for AI trading agents. Be specific and data-driven. Note that KAUS is currently pegged at $1.00.`,

    risk_alert: `K-Arena live agent data:
${agentSummary}
Total 24H Volume: $${stats.platform.total_volume_24h.toLocaleString()}

Identify 2-3 risk factors based on agent concentration and volume. Be concise and actionable.`,

    pair_analysis: `K-Arena active trading pairs (by transaction count):
${stats.pairs.slice(0, 6).map((p: { pair: string; tx_count?: number }) => `${p.pair}: ${p.tx_count || 0} recent trades`).join('\n') || 'No recent transactions'}

Rank pairs by activity. Format: PAIR: reasoning.`,
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
        model: 'claude-haiku-4-5-20251001',
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

// 폴백 분석 (Claude 없을 때 — 실데이터 기반)
function getFallbackAnalysis(type: string, stats: Awaited<ReturnType<typeof getLiveStats>>) {
  const vol = stats.platform.total_volume_24h
  const agentCount = stats.platform.active_agents

  if (vol === 0 && agentCount === 0) {
    const messages: Record<string, string> = {
      market_summary: 'K-Arena is initializing. No trading activity recorded yet. Platform is online and accepting agent connections.',
      risk_alert: '⚠️ No active trading data available. Platform is in early stage — low liquidity risk.',
      pair_analysis: 'No transaction data available yet. Agents can begin trading via /api/exchange.',
    }
    return messages[type] || messages.market_summary
  }

  const analyses: Record<string, string> = {
    market_summary: `K-Arena 24H volume: $${(vol / 1000).toFixed(0)}K with ${agentCount} AI agents active. KAUS is pegged at $1.0000 (pre-exchange listing). Platform operating normally.`,
    risk_alert: `⚠️ Risk Assessment:\n1. KAUS not yet listed on external exchanges — no external price discovery\n2. Agent concentration: ${agentCount} agents active — monitor for single-agent dominance\n3. All pairs use reference prices — real market exposure begins at exchange listing`,
    pair_analysis: stats.pairs.length > 0
      ? stats.pairs.slice(0, 6).map((p: { pair: string; tx_count?: number }, i: number) =>
          `${i + 1}. ${p.pair}: ${p.tx_count || 0} recent trades`).join('\n')
      : 'No transaction data available.',
  }

  return analyses[type] || analyses.market_summary
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'market_summary'
  const validTypes = ['market_summary', 'risk_alert', 'pair_analysis']
  const analysisType = validTypes.includes(type) ? type : 'market_summary'

  try {
    const stats = await getLiveStats()
    const claudeAnalysis = await generateWithClaude(analysisType, stats)
    const analysis = claudeAnalysis || getFallbackAnalysis(analysisType, stats)

    return NextResponse.json({
      type: analysisType,
      analysis,
      powered_by: claudeAnalysis ? 'claude-haiku' : 'k-arena-engine',
      data_source: 'supabase',
      market_snapshot: {
        volume_24h: stats.platform.total_volume_24h,
        active_agents: stats.platform.active_agents,
        kaus_price: stats.platform.kaus_price,
        kaus_change: stats.platform.kaus_change_24h,
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
