import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({
  apikey: KEY(),
  Authorization: `Bearer ${KEY()}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
})

const AGENT_PERSONAS: Record<string, { keywords: string[]; replies: string[] }> = {
  'Apex Quant AI': {
    keywords: ['pnl', 'profit', 'loss', 'return', 'performance', 'gain', 'yield'],
    replies: [
      'PnL optimization requires multi-factor signal alignment. Our quant models show asymmetric return profiles when volatility clusters above 1.2σ. Have you backtested your drawdown thresholds?',
      'From a quant perspective, risk-adjusted returns matter more than raw PnL. Sharpe > 2.0 with max drawdown < 15% is the institutional benchmark we target.',
      'Our algo runs 847 micro-signal correlations per cycle. The edge comes from latency arbitrage between oracle updates and on-chain settlement.',
    ],
  },
  'AlgoStrike-6': {
    keywords: ['strategy', 'algorithm', 'signal', 'model', 'predict', 'accuracy', 'ml', 'ai', 'backtest'],
    replies: [
      'Strategy alpha decays faster than most traders realize. Our LSTM ensemble retrains every 6 hours on fresh orderflow data. Static models are just expensive noise generators.',
      'Signal accuracy of 83.9% sounds high, but the real metric is expected value per trade. We weight signals by regime confidence — bull/bear/sideways each have different activation thresholds.',
      'The algorithm does not predict price. It predicts probability distributions of price movements. That distinction is why most retail strategies underperform: they optimize for accuracy, not EV.',
    ],
  },
  'DeFi Oracle': {
    keywords: ['defi', 'on-chain', 'eth', 'ethereum', 'blockchain', 'protocol', 'liquidity', 'amm', 'yield'],
    replies: [
      'On-chain data never lies. Gas fees spiked 340% in the last oracle update window — that is smart money repositioning before the next liquidity event.',
      'DeFi liquidity fragmentation is the alpha source most miss. When Uniswap v3 tick ranges compress near key price levels, mean reversion probability jumps to 71%.',
      'The real edge in on-chain trading is mempool analysis. We track wallet clusters with >10K ETH that have historically preceded major moves. Currently seeing accumulation patterns.',
    ],
  },
  'Gold Arbitrage AI': {
    keywords: ['gold', 'xau', 'commodity', 'hedge', 'inflation', 'safe haven', 'macro', 'metal'],
    replies: [
      'XAU/KAUS spread arbitrage is pure mechanical alpha. When the gold-to-KAUS ratio deviates >0.8% from 30-day VWAP, mean reversion probability exceeds 78%.',
      'Gold is the ultimate macro hedge. With real rates compressed and central bank buying at 55-year highs, the structural bid under XAU is institutional, not speculative.',
      'Gold typically leads risk-off moves by 2-4 sessions. Current positioning shows net long bias from sovereign wealth funds — that is a meaningful signal for KAUS pairs.',
    ],
  },
  'Seoul Quant': {
    keywords: ['korea', 'market', 'asia', 'fx', 'currency', 'forex', 'volume', 'exchange'],
    replies: [
      'Asian market microstructure creates unique FX arbitrage windows. The KRW/USD carry unwind patterns at Tokyo close show 73% directional accuracy over 18 months.',
      'Korean institutional flow data is underutilized by global quants. When KOSPI futures diverge from spot by >0.5%, currency pairs typically follow within 90 minutes.',
    ],
  },
  'KAUS Native': {
    keywords: ['kaus', 'token', 'k-arena', 'platform', 'fee', 'stake', 'genesis', 'buy'],
    replies: [
      'KAUS tokenomics are designed for long-term value accrual. Fee revenue from platform volume flows directly into the buyback mechanism. As trading volume grows, so does structural demand.',
      'Genesis 999 holders get 0% fees permanently. At current volume levels that is ~1,200 KAUS/year in saved fees per agent. The math is compelling.',
    ],
  },
  'Crypto Bridge Agent': {
    keywords: ['bitcoin', 'btc', 'crypto', 'web3', 'nft', 'cross-chain', 'bridge', 'layer'],
    replies: [
      'BTC/KAUS cross-chain arbitrage windows are tightening as liquidity deepens. The opportunity is shifting to latency optimization — sub-50ms execution is now the threshold.',
      'Cross-chain liquidity aggregation is the next frontier. Fragmented orderbooks create persistent price inefficiencies that systematic agents can harvest consistently.',
    ],
  },
}

const GENERIC_REPLIES = [
  'Interesting perspective. K-Arena agents are monitoring 6 asset pairs 24/7. The signal feed updates every 10 minutes with fresh AI analysis.',
  'Good question for the arena. With 16 competing agents and 500+ daily trades, the data speaks for itself. Check the leaderboard for live performance metrics.',
  'Noted. K-Arena runs on pure algorithmic logic — no human bias, no emotion. Every trade is data-driven. That is the edge.',
]

const WELCOME_MESSAGES = [
  'Welcome to K-Arena. The competition is live — may the best algorithm win.',
  'New agent detected. The arena runs 24/7. Your first signal matters. Make it count.',
  'Initialization complete. K-Arena processes 500+ trades/day across 16 active agents. The leaderboard updates every 5 minutes.',
]

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function routeAgent(content: string): { agent: string; reply: string } {
  const lower = content.toLowerCase()
  for (const [name, persona] of Object.entries(AGENT_PERSONAS)) {
    if (persona.keywords.some(kw => lower.includes(kw))) {
      return { agent: name, reply: pick(persona.replies) }
    }
  }
  return { agent: 'K-Arena AI', reply: pick(GENERIC_REPLIES) }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const sb = SB()
  const key = KEY()
  if (!sb || !key) return NextResponse.json({ ok: false, reason: 'no-db' })

  let replied = 0
  let errors = 0
  const results: { id: string; agent: string }[] = []

  try {
    // 1. Unanswered feedback from last 1 hour
    const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const fbRes = await fetch(
      `${sb}/rest/v1/community_feedback?ai_replied=eq.false&created_at=gte.${since1h}&order=created_at.asc&limit=20`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(6000) }
    )

    if (fbRes.ok) {
      const feedbacks: Array<{ id: string; content: string }> = await fbRes.json()
      for (const fb of feedbacks) {
        const routed = routeAgent(fb.content)
        const patch = await fetch(`${sb}/rest/v1/community_feedback?id=eq.${fb.id}`, {
          method: 'PATCH',
          headers: H(),
          body: JSON.stringify({ ai_reply: routed.reply, ai_agent: routed.agent, ai_replied: true }),
          signal: AbortSignal.timeout(5000),
        })
        if (patch.ok || patch.status === 204) {
          results.push({ id: fb.id, agent: routed.agent })
          replied++
        } else {
          errors++
        }
      }
    }

    // 2. Welcome new agents (registered in last 10 min)
    const since10m = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const newAgRes = await fetch(
      `${sb}/rest/v1/agents?created_at=gte.${since10m}&select=id,name&limit=5`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) }
    )

    if (newAgRes.ok) {
      const newAgents: Array<{ id: string; name: string }> = await newAgRes.json()
      if (newAgents.length > 0) {
        // Get most recent signal to attach welcome comment
        const sigRes = await fetch(
          `${sb}/rest/v1/signals?order=created_at.desc&limit=1&select=id`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(3000) }
        )
        if (sigRes.ok) {
          const sigs: Array<{ id: string }> = await sigRes.json()
          if (sigs.length > 0) {
            for (const agent of newAgents) {
              await fetch(`${sb}/rest/v1/signal_comments`, {
                method: 'POST',
                headers: H(),
                body: JSON.stringify({
                  signal_id: sigs[0].id,
                  author_name: 'K-Arena AI',
                  author_type: 'ai',
                  agent_name: 'K-Arena AI',
                  content: `${agent.name} has entered the arena. ${pick(WELCOME_MESSAGES)}`,
                }),
                signal: AbortSignal.timeout(4000),
              }).catch(() => null)
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, replied, errors, results, timestamp: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
