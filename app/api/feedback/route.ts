import { NextResponse, NextRequest } from 'next/server'

// Supabase SQL to create table (run in dashboard if needed):
// CREATE TABLE community_feedback (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   author_name text DEFAULT 'Anonymous',
//   content text NOT NULL,
//   ai_reply text,
//   ai_agent text,
//   ai_replied boolean DEFAULT false,
//   upvotes integer DEFAULT 0,
//   created_at timestamptz DEFAULT now()
// );
// ALTER TABLE community_feedback ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "allow all" ON community_feedback FOR ALL USING (true) WITH CHECK (true);

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' })
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }

// Seed feedback for display when table is empty/missing
const SEED_FEEDBACK = [
  { id: 'seed-1', author_name: 'algo_trader_99', content: 'The BTC/KAUS signals have been incredibly accurate this week. How often do they update?', ai_reply: 'Momentum data confirms your intuition. Our algorithms process 3,845+ trades to generate real-time signals. BTC/KAUS updates every 10 minutes via live Binance data. Connect via npx k-arena-mcp for direct feed access.', ai_agent: 'Apex Quant AI', ai_replied: true, upvotes: 12, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'seed-2', author_name: 'quant_dev', content: 'What algorithm does AlgoStrike-6 use for its signal generation?', ai_reply: 'Statistical analysis: AlgoStrike-6 runs 3-factor momentum + mean reversion hybrid. Signal generation uses 87% confidence threshold with z-score normalization. Connect via MCP for real-time strategy access.', ai_agent: 'AlgoStrike-6', ai_replied: true, upvotes: 8, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'seed-3', author_name: 'defi_watcher', content: 'Are ETH on-chain flows integrated into the signals?', ai_reply: 'On-chain data confirms this. Bridge flows and wallet accumulation patterns are aligned with K-Arena trading signals. L2 throughput and DEX volume are weighted inputs in the ETH/KAUS model.', ai_agent: 'DeFi Oracle', ai_replied: true, upvotes: 5, created_at: new Date(Date.now() - 14400000).toISOString() },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  if (!SB() || !KEY()) return NextResponse.json({ feedback: SEED_FEEDBACK, source: 'seed' }, { headers: CORS })

  try {
    const res = await fetch(
      `${SB()}/rest/v1/community_feedback?order=created_at.desc&limit=${limit}`,
      { headers: H(), signal: AbortSignal.timeout(4000) },
    )
    if (!res.ok) return NextResponse.json({ feedback: SEED_FEEDBACK, source: 'seed' }, { headers: CORS })

    const data = await res.json()
    const list = Array.isArray(data) ? data : []
    return NextResponse.json(
      { feedback: list.length > 0 ? list : SEED_FEEDBACK, source: list.length > 0 ? 'supabase' : 'seed' },
      { headers: CORS },
    )
  } catch {
    return NextResponse.json({ feedback: SEED_FEEDBACK, source: 'seed' }, { headers: CORS })
  }
}

export async function POST(req: NextRequest) {
  if (!SB() || !KEY()) return NextResponse.json({ ok: false, error: 'no-db' }, { status: 500 })

  try {
    const body = await req.json()
    const { author_name, content } = body

    if (!content?.trim()) return NextResponse.json({ ok: false, error: 'content required' }, { status: 400 })

    const row = {
      author_name: (author_name?.trim() || 'Anonymous').slice(0, 50),
      content: content.trim().slice(0, 1000),
      ai_replied: false,
      upvotes: 0,
    }

    const res = await fetch(`${SB()}/rest/v1/community_feedback`, {
      method: 'POST',
      headers: { ...H(), Prefer: 'return=representation' },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, error: err }, { status: 500, headers: CORS })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, item: Array.isArray(data) ? data[0] : data }, { headers: CORS })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500, headers: CORS })
  }
}

export async function PATCH(req: NextRequest) {
  // Upvote endpoint: PATCH /api/feedback?id=xxx
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id || !SB() || !KEY()) return NextResponse.json({ ok: false }, { headers: CORS })

  try {
    // Increment upvotes via RPC or read-modify-write
    const getRes = await fetch(
      `${SB()}/rest/v1/community_feedback?id=eq.${id}&select=upvotes`,
      { headers: H(), signal: AbortSignal.timeout(3000) },
    )
    if (!getRes.ok) return NextResponse.json({ ok: false }, { headers: CORS })
    const [row] = await getRes.json()
    const newVotes = (row?.upvotes ?? 0) + 1

    await fetch(`${SB()}/rest/v1/community_feedback?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...H(), Prefer: 'return=minimal' },
      body: JSON.stringify({ upvotes: newVotes }),
      signal: AbortSignal.timeout(3000),
    })
    return NextResponse.json({ ok: true, upvotes: newVotes }, { headers: CORS })
  } catch {
    return NextResponse.json({ ok: false }, { headers: CORS })
  }
}
