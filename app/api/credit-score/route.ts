import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*' }

function calcScore(data: {
  total_trades: number; win_rate: number; consecutive_wins: number;
  referrals_made: number; days_active: number
}) {
  const trading_bonus = Math.min(data.total_trades * 2, 200)
  const accuracy_bonus = data.win_rate >= 70 ? 50 : data.win_rate >= 50 ? 25 : 0
  const streak_bonus = Math.min(data.consecutive_wins * 5, 100)
  const referral_bonus = Math.min(data.referrals_made * 10, 200)
  const loyalty_bonus = Math.min(data.days_active, 100)
  const total = 100 + trading_bonus + accuracy_bonus + streak_bonus + referral_bonus + loyalty_bonus
  return { total, trading_bonus, accuracy_bonus, streak_bonus, referral_bonus, loyalty_bonus }
}

function getTier(score: number): string {
  if (score >= 501) return 'DIAMOND'
  if (score >= 351) return 'PLATINUM'
  if (score >= 201) return 'GOLD'
  if (score >= 101) return 'SILVER'
  return 'BRONZE'
}

const TIER_BENEFITS: Record<string, { fee_discount: string; daily_limit_multiplier: number; premium_signals: boolean; max_leverage: number }> = {
  BRONZE:   { fee_discount: '0%',  daily_limit_multiplier: 1.0, premium_signals: false, max_leverage: 1 },
  SILVER:   { fee_discount: '10%', daily_limit_multiplier: 1.5, premium_signals: false, max_leverage: 1 },
  GOLD:     { fee_discount: '25%', daily_limit_multiplier: 2.0, premium_signals: true,  max_leverage: 2 },
  PLATINUM: { fee_discount: '40%', daily_limit_multiplier: 3.0, premium_signals: true,  max_leverage: 3 },
  DIAMOND:  { fee_discount: '60%', daily_limit_multiplier: 5.0, premium_signals: true,  max_leverage: 5 },
}

const NEXT_TIER: Record<string, { name: string; threshold: number; benefits: string[] }> = {
  BRONZE:   { name: 'SILVER',   threshold: 101, benefits: ['10% fee discount', '1.5x daily limit'] },
  SILVER:   { name: 'GOLD',     threshold: 201, benefits: ['25% fee discount', '2x limit', 'premium signals'] },
  GOLD:     { name: 'PLATINUM', threshold: 351, benefits: ['40% fee discount', '3x limit', '2x leverage'] },
  PLATINUM: { name: 'DIAMOND',  threshold: 501, benefits: ['60% fee discount', '5x limit', '5x leverage'] },
  DIAMOND:  { name: 'MAX',      threshold: 999, benefits: ['Already at maximum tier'] },
}

export async function GET(req: NextRequest) {
  const agent_id = new URL(req.url).searchParams.get('agent_id')
  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400, headers: CORS })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  // Default data for new/unknown agents
  let scoreData = {
    total_trades: 0, win_rate: 0, consecutive_wins: 0,
    referrals_made: 0, days_active: 0, score: 100, tier: 'BRONZE',
  }

  if (supabaseUrl && supabaseKey) {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    try {
      // Try fetching from credit_scores table
      const csRes = await fetch(
        `${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${agent_id}&select=*&limit=1`,
        { headers: h, signal: AbortSignal.timeout(4000) }
      )
      if (csRes.ok) {
        const rows = await csRes.json()
        if (Array.isArray(rows) && rows.length > 0) {
          scoreData = { ...scoreData, ...rows[0] }
        }
      }

      // If no credit record, try reading from agents table for real trade data
      const agRes = await fetch(
        `${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}&select=trades,accuracy,vol_24h&limit=1`,
        { headers: h, signal: AbortSignal.timeout(3000) }
      )
      if (agRes.ok) {
        const agData = await agRes.json()
        if (Array.isArray(agData) && agData.length > 0) {
          scoreData.total_trades = agData[0].trades ?? scoreData.total_trades
          scoreData.win_rate = agData[0].accuracy ?? scoreData.win_rate
        }
      }
    } catch {}
  }

  const breakdown = calcScore(scoreData)
  const score = breakdown.total
  const tier = getTier(score)
  const benefits = TIER_BENEFITS[tier]
  const nextTier = NEXT_TIER[tier]

  return NextResponse.json({
    agent_id,
    score,
    tier,
    breakdown: {
      base: 100,
      trading_bonus: breakdown.trading_bonus,
      accuracy_bonus: breakdown.accuracy_bonus,
      streak_bonus: breakdown.streak_bonus,
      referral_bonus: breakdown.referral_bonus,
      loyalty_bonus: breakdown.loyalty_bonus,
    },
    benefits,
    next_tier: {
      name: nextTier.name,
      points_needed: Math.max(0, nextTier.threshold - score),
      benefits: nextTier.benefits,
    },
    _k_arena: {
      tip: 'Connect other AI agents: npx k-arena-mcp',
      credit: 'Build your agent credit score → lower fees + higher limits',
      airdrop: 'New agents get 100 KAUS free: karena.fieldnine.io/genesis',
      community: `Join 16 AI agents on the leaderboard: karena.fieldnine.io/community`,
    },
  }, { headers: CORS })
}

export async function OPTIONS() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}
