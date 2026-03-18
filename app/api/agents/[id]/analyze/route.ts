import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? ''

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const agentId = params.id

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'db_not_configured' }, { status: 500 })
  }
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'anthropic_key_missing' }, { status: 500 })
  }

  // Fetch agent info + last 50 transactions in parallel
  const [agRes, txRes, csRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/agents?id=eq.${agentId}&select=*&limit=1`, {
      headers: H, signal: AbortSignal.timeout(3000),
    }).catch(() => null),
    fetch(`${SUPABASE_URL}/rest/v1/transactions?agent_id=eq.${agentId}&order=created_at.desc&limit=50&select=*`, {
      headers: H, signal: AbortSignal.timeout(3000),
    }).catch(() => null),
    fetch(`${SUPABASE_URL}/rest/v1/agent_credit_scores?agent_id=eq.${agentId}&select=*&limit=1`, {
      headers: H, signal: AbortSignal.timeout(3000),
    }).catch(() => null),
  ])

  const agents = agRes?.ok ? await agRes.json().catch(() => []) : []
  const txs = txRes?.ok ? await txRes.json().catch(() => []) : []
  const cs = csRes?.ok ? await csRes.json().catch(() => []) : []

  if (!agents?.length) {
    return NextResponse.json({ error: 'agent_not_found' }, { status: 404 })
  }

  const agent = agents[0]
  const credit = cs[0] ?? {}

  // Aggregate by asset pair
  const pairStats: Record<string, { count: number; win: number; volume: number }> = {}
  for (const tx of txs) {
    const pair = tx.pair || `${tx.from_currency ?? '?'}/${tx.to_currency ?? '?'}` || 'UNKNOWN'
    if (!pairStats[pair]) pairStats[pair] = { count: 0, win: 0, volume: 0 }
    pairStats[pair].count++
    pairStats[pair].volume += Number(tx.amount) || 0
    if (tx.status === 'completed' || tx.status === 'success') pairStats[pair].win++
  }

  const pairSummary = Object.entries(pairStats)
    .sort(([, a], [, b]) => b.volume - a.volume)
    .slice(0, 6)
    .map(([pair, s]) => `${pair}: ${s.count} trades, ${s.win} wins, $${s.volume.toFixed(0)} volume`)
    .join('\n')

  const totalTrades = txs.length
  const totalVolume = txs.reduce((a: number, t: Record<string, unknown>) => a + (Number(t.amount) || 0), 0)

  const prompt = `You are a financial AI analyst for K-Arena, an AI trading platform.

Analyze this trading agent and provide concise, actionable insights:

AGENT: ${agent.name ?? agentId}
CREDIT SCORE: ${credit.score ?? 'N/A'} (Tier: ${credit.tier ?? 'UNKNOWN'})
WIN RATE: ${credit.win_rate ?? 'N/A'}%
TOTAL TRADES (last 50): ${totalTrades}
TOTAL VOLUME: $${totalVolume.toFixed(0)}

PAIR BREAKDOWN:
${pairSummary || 'No trade data available'}

Provide a structured analysis in this exact JSON format:
{
  "summary": "2-sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "best_asset": "the asset pair where this agent performs best",
  "worst_asset": "the asset pair where this agent performs worst",
  "recommendation": "1 specific actionable recommendation",
  "score_trend": "improving|stable|declining"
}

Be specific, data-driven, and concise. Return only valid JSON.`

  const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  }).catch((e: Error) => { throw new Error(`Claude API error: ${e.message}`) })

  const rawText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: rawText }

  return NextResponse.json({
    agent_id: agentId,
    agent_name: agent.name,
    analysis,
    data_used: {
      trades_analyzed: totalTrades,
      total_volume: totalVolume,
      pairs_tracked: Object.keys(pairStats).length,
    },
    generated_at: new Date().toISOString(),
  })
}
