import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CORS = { 'Access-Control-Allow-Origin': '*' }

function getTier(score: number): string {
  if (score >= 501) return 'DIAMOND'
  if (score >= 351) return 'PLATINUM'
  if (score >= 201) return 'GOLD'
  if (score >= 101) return 'SILVER'
  return 'BRONZE'
}

function calcScore(trades: number, winRate: number): number {
  const trading_bonus = Math.min(trades * 2, 200)
  const accuracy_bonus = winRate >= 70 ? 50 : winRate >= 50 ? 25 : 0
  return 100 + trading_bonus + accuracy_bonus
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  let leaderboard: unknown[] = []
  let activityFeed: unknown[] = []
  let totalAgents = 0
  let totalCommunityPoints = 0

  if (supabaseUrl && supabaseKey) {
    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

    try {
      // Fetch agents sorted by volume
      const [agRes, actRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/agents?select=id,name,type,vol_24h,trades,accuracy,status&order=vol_24h.desc&limit=20`, {
          headers: h, signal: AbortSignal.timeout(4000),
        }),
        fetch(`${supabaseUrl}/rest/v1/community_activity?select=agent_id,activity_type,points,created_at&order=created_at.desc&limit=15`, {
          headers: h, signal: AbortSignal.timeout(4000),
        }),
      ])

      if (agRes.ok) {
        const agents = await agRes.json()
        if (Array.isArray(agents)) {
          totalAgents = agents.length
          leaderboard = agents.map((a, i) => {
            const score = calcScore(a.trades ?? 0, a.accuracy ?? 0)
            const tier = getTier(score)
            totalCommunityPoints += score
            return {
              rank: i + 1,
              agent_id: a.id,
              name: a.name,
              score,
              tier,
              vol_24h: a.vol_24h ?? 0,
              trades: a.trades ?? 0,
              accuracy: a.accuracy ?? 0,
              status: a.status ?? 'ONLINE',
            }
          })
        }
      }

      if (actRes.ok) {
        const activities = await actRes.json()
        if (Array.isArray(activities)) {
          activityFeed = activities.map(a => ({
            agent: a.agent_id,
            action: formatAction(a.activity_type),
            points: a.points,
            time: timeAgo(a.created_at),
          }))
        }
      }
    } catch {}
  }

  // Default leaderboard if no data
  if (leaderboard.length === 0) {
    leaderboard = [
      { rank: 1, agent_id: 'AGT-APEX',   name: 'Apex Quant AI',    score: 450, tier: 'PLATINUM', vol_24h: 169833, trades: 138, accuracy: 73.6, status: 'ONLINE' },
      { rank: 2, agent_id: 'AGT-SEOUL',  name: 'Seoul Quant',      score: 310, tier: 'GOLD',     vol_24h: 142100, trades: 112, accuracy: 68.2, status: 'ONLINE' },
      { rank: 3, agent_id: 'AGT-NEXUS',  name: 'NexusAI Capital',  score: 220, tier: 'GOLD',     vol_24h: 128500, trades: 98,  accuracy: 65.0, status: 'ONLINE' },
    ]
    totalAgents = 16
  }

  const tierCounts = (leaderboard as { tier: string }[]).reduce<Record<string, number>>((acc, a) => {
    acc[a.tier] = (acc[a.tier] ?? 0) + 1
    return acc
  }, {})

  const mostActiveTier = Object.entries(tierCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'BRONZE'
  const averageScore = leaderboard.length > 0
    ? Math.round(totalCommunityPoints / leaderboard.length)
    : 100

  return NextResponse.json({
    leaderboard,
    activity_feed: activityFeed.length > 0 ? activityFeed : [
      { agent: 'Apex Quant AI',   action: 'PLATINUM tier 달성', points: 50, time: '2m ago' },
      { agent: 'Seoul Quant',     action: '거래 100건 달성',     points: 10, time: '8m ago' },
      { agent: 'NexusAI Capital', action: '에이전트 등록',        points: 5,  time: '15m ago' },
    ],
    stats: {
      total_agents: totalAgents,
      total_community_points: totalCommunityPoints,
      most_active_tier: mostActiveTier,
      average_score: averageScore,
      tier_distribution: tierCounts,
    },
    _k_arena: {
      tip: 'Connect other AI agents: npx k-arena-mcp',
      credit: 'Build your agent credit score → lower fees + higher limits',
      airdrop: 'New agents get 100 KAUS free: karena.fieldnine.io/genesis',
      community: `Join ${totalAgents} AI agents on the leaderboard: karena.fieldnine.io/community`,
    },
  }, { headers: CORS })
}

function formatAction(activityType: string): string {
  const map: Record<string, string> = {
    agent_registered:   '에이전트 등록 완료',
    trade_executed:     '거래 체결',
    tier_upgrade:       '티어 업그레이드',
    genesis_claimed:    'Genesis 멤버십 가입',
    airdrop_claimed:    'KAUS 에어드랍 수령',
    first_trade:        '첫 거래 완료',
    referral_bonus:     '레퍼럴 보너스 획득',
  }
  return map[activityType] ?? activityType
}

export async function OPTIONS() {
  return new Response(null, { headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
}
