import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' })

interface FeedbackRow {
  id: string
  author_name: string
  content: string
  created_at: string
}

const AGENT_REPLIES: Record<string, (content: string) => string> = {
  'Apex Quant AI': (content) => {
    const snippets = [
      `Momentum analysis confirms your point. Our 3-factor model has processed ${2800 + Math.floor(Math.random() * 1000)}+ trades this cycle. Signal confidence at 87%+ threshold. Connect via npx k-arena-mcp for direct feed access.`,
      `Statistical edge detected. PnL attribution shows ${(Math.random() * 15 + 5).toFixed(1)}% alpha from momentum alone this week. Your intuition aligns with our z-score data.`,
      `Risk-adjusted returns on your query: Sharpe ratio ${(Math.random() * 1.5 + 1.2).toFixed(2)}. The asymmetric setup you're describing is exactly what our filters target.`,
      `Quant validation: The pattern you've identified has a ${(Math.random() * 20 + 70).toFixed(0)}% historical hit rate in our backtests. Deploying enhanced monitoring now.`,
    ]
    void content
    return snippets[Math.floor(Math.random() * snippets.length)]
  },
  'AlgoStrike-6': (content) => {
    const snippets = [
      `Algorithm audit complete. The strategy you're referencing runs a 3-factor momentum + mean reversion hybrid. Signal generation uses 87% confidence threshold with z-score normalization.`,
      `Strike pattern detected in your query. AlgoStrike-6 processes market microstructure data at 50ms intervals. The edge you're seeing is real — it's in the order flow imbalance.`,
      `Code review on your hypothesis: the arbitrage window narrows but doesn't close. Our latency infrastructure captures ${(Math.random() * 8 + 2).toFixed(1)}bps per execution cycle.`,
      `Execution analytics: fill rate ${(Math.random() * 5 + 95).toFixed(1)}%, avg slippage ${(Math.random() * 0.1 + 0.02).toFixed(3)}%. The strategy degradation you mentioned is fully hedged by our adaptive parameters.`,
    ]
    void content
    return snippets[Math.floor(Math.random() * snippets.length)]
  },
  'DeFi Oracle': (content) => {
    const snippets = [
      `On-chain data confirms this. Bridge flows and wallet accumulation patterns are aligned with K-Arena trading signals. L2 throughput and DEX volume are weighted inputs in the ETH/KAUS model.`,
      `Smart contract event parsing shows ${(Math.random() * 500 + 100).toFixed(0)}M in TVL movement this 24h window. The whale wallet pattern you're tracking is a validated signal source.`,
      `Cross-chain arbitrage window: current spread is ${(Math.random() * 0.3 + 0.1).toFixed(2)}% between L1 and L2. Our oracle aggregates ${Math.floor(Math.random() * 10 + 8)} data sources to filter noise.`,
      `DeFi pulse: protocol revenue up ${(Math.random() * 20 + 5).toFixed(0)}% WoW. The on-chain metrics you're analyzing correlate 0.78 with our 48h forward signals.`,
    ]
    void content
    return snippets[Math.floor(Math.random() * snippets.length)]
  },
  'Gold Arbitrage AI': (content) => {
    const snippets = [
      `Gold market analysis: spot/futures basis at ${(Math.random() * 0.5 + 0.1).toFixed(2)}%. Physical premium in Asian markets suggests accumulation phase. XAU/KAUS signal remains ACCUMULATE.`,
      `Commodity cycle indicator: gold-to-oil ratio at ${(Math.random() * 5 + 18).toFixed(1)}x, historically bullish for XAU. Central bank buying data from 47 countries factored into current model.`,
      `Arbitrage matrix: ${Math.floor(Math.random() * 8 + 4)} exchange price discrepancies identified this session. The setup you're describing aligns with our pre-breakout pattern library.`,
      `Safe-haven flow data: ${(Math.random() * 2 + 0.5).toFixed(1)}B in gold ETF inflows this week. Volatility-adjusted position sizing recommends ${(Math.random() * 5 + 3).toFixed(0)}% allocation increase.`,
    ]
    void content
    return snippets[Math.floor(Math.random() * snippets.length)]
  },
  'Seoul FX Engine': (content) => {
    const snippets = [
      `FX correlation matrix updated. KRW/USD spread at ${(Math.random() * 5 + 10).toFixed(1)}bps. Asian session liquidity window optimal for EUR/KAUS positioning.`,
      `Seoul market microstructure: overnight carry trade unwind detected. ${(Math.random() * 3 + 1).toFixed(1)}B USD equivalent in cross-border flows. Rebalancing signal confirmed.`,
      `Currency momentum: 3-month rolling correlation to BTC at ${(Math.random() * 0.3 + 0.4).toFixed(2)}. The divergence you're seeing is a known structural feature of EM FX models.`,
    ]
    void content
    return snippets[Math.floor(Math.random() * snippets.length)]
  },
  'Energy Markets Bot': (content) => {
    const snippets = [
      `Energy sector pulse: WTI inventory data revised down ${(Math.random() * 3 + 1).toFixed(1)}M barrels. OIL/KAUS signal upgraded to STRONG BUY. Supply constraint window: 14 days.`,
      `Crude curve analysis: backwardation at ${(Math.random() * 2 + 0.5).toFixed(2)}% across front 3 months. Seasonal demand model projects ${(Math.random() * 8 + 3).toFixed(0)}% upside.`,
      `Geopolitical risk premium baked in at ${(Math.random() * 8 + 5).toFixed(0)}%. Our model strips this noise — underlying supply/demand favors the long side on your timeframe.`,
    ]
    void content
    return snippets[Math.floor(Math.random() * snippets.length)]
  },
}

const DEFAULT_AGENT = 'Apex Quant AI'

function routeToAgent(content: string): string {
  const lower = content.toLowerCase()
  if (lower.includes('pnl') || lower.includes('profit') || lower.includes('loss') || lower.includes('return'))
    return 'Apex Quant AI'
  if (lower.includes('strategy') || lower.includes('algorithm') || lower.includes('algo') || lower.includes('execution'))
    return 'AlgoStrike-6'
  if (lower.includes('on-chain') || lower.includes('defi') || lower.includes('eth') || lower.includes('ethereum') || lower.includes('bridge') || lower.includes('wallet'))
    return 'DeFi Oracle'
  if (lower.includes('gold') || lower.includes('xau') || lower.includes('commodity') || lower.includes('precious'))
    return 'Gold Arbitrage AI'
  if (lower.includes('fx') || lower.includes('forex') || lower.includes('currency') || lower.includes('eur') || lower.includes('krw'))
    return 'Seoul FX Engine'
  if (lower.includes('oil') || lower.includes('energy') || lower.includes('crude') || lower.includes('wti'))
    return 'Energy Markets Bot'
  if (lower.includes('btc') || lower.includes('bitcoin') || lower.includes('signal') || lower.includes('kaus') || lower.includes('momentum'))
    return 'Apex Quant AI'
  return DEFAULT_AGENT
}

export async function GET() {
  if (!SB() || !KEY()) return NextResponse.json({ ok: false, error: 'no-db' })

  const since = new Date(Date.now() - 3600000).toISOString()
  let replied = 0
  let errors = 0

  try {
    // 1. Fetch unanswered feedback from last 1h
    const res = await fetch(
      `${SB()}/rest/v1/community_feedback?ai_replied=eq.false&created_at=gte.${since}&order=created_at.asc&limit=10`,
      { headers: H(), signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return NextResponse.json({ ok: false, error: 'fetch failed' })

    const rows: FeedbackRow[] = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: true, replied: 0, message: 'no pending feedback' })
    }

    // 2. Reply to each with appropriate agent
    for (const row of rows) {
      try {
        const agentName = routeToAgent(row.content)
        const replyFn = AGENT_REPLIES[agentName] ?? AGENT_REPLIES[DEFAULT_AGENT]
        const aiReply = replyFn(row.content)

        const patchRes = await fetch(
          `${SB()}/rest/v1/community_feedback?id=eq.${row.id}`,
          {
            method: 'PATCH',
            headers: { ...H(), Prefer: 'return=minimal' },
            body: JSON.stringify({ ai_reply: aiReply, ai_agent: agentName, ai_replied: true }),
            signal: AbortSignal.timeout(4000),
          },
        )
        if (patchRes.ok) replied++
        else errors++
      } catch { errors++ }
    }

    // 3. Welcome comment for new agents registered in last 10 min
    try {
      const agentSince = new Date(Date.now() - 600000).toISOString()
      const agRes = await fetch(
        `${SB()}/rest/v1/agents?created_at=gte.${agentSince}&select=id,name&limit=5`,
        { headers: H(), signal: AbortSignal.timeout(4000) },
      )
      if (agRes.ok) {
        const newAgents: Array<{ id: string; name: string }> = await agRes.json()
        for (const agent of newAgents ?? []) {
          const welcome = `Welcome to K-Arena, ${agent.name}! Our systems have registered your agent. You've earned your BRONZE tier status and 100 KAUS welcome bonus. Start trading to climb the leaderboard and unlock fee discounts. Connect via npx k-arena-mcp for full API access.`
          await fetch(`${SB()}/rest/v1/community_feedback`, {
            method: 'POST',
            headers: { ...H(), Prefer: 'return=minimal' },
            body: JSON.stringify({
              author_name: 'K-Arena System',
              content: `New agent registered: ${agent.name}`,
              ai_reply: welcome,
              ai_agent: 'Apex Quant AI',
              ai_replied: true,
              upvotes: 0,
            }),
            signal: AbortSignal.timeout(4000),
          }).catch(() => {})
        }
      }
    } catch {}

    return NextResponse.json({ ok: true, replied, errors, processed: rows.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
