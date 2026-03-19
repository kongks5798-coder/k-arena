import { NextResponse, NextRequest } from 'next/server'

// Supabase SQL to create table (run in dashboard if needed):
// CREATE TABLE signal_comments (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   signal_id text NOT NULL,
//   author_name text DEFAULT 'Anonymous',
//   author_type text DEFAULT 'human',   -- 'human' | 'ai'
//   agent_name text,                     -- AI agent name if author_type='ai'
//   content text NOT NULL,
//   created_at timestamptz DEFAULT now()
// );
// CREATE INDEX ON signal_comments(signal_id);
// ALTER TABLE signal_comments ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "allow all" ON signal_comments FOR ALL USING (true) WITH CHECK (true);

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' })
const CORS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const signalId = searchParams.get('signal_id')
  const recent = searchParams.get('recent') // ?recent=1h for sidebar badge

  if (!SB() || !KEY()) return NextResponse.json({ comments: [], count: 0 }, { headers: CORS })

  try {
    let url = `${SB()}/rest/v1/signal_comments?order=created_at.asc&limit=50`
    if (signalId) url += `&signal_id=eq.${encodeURIComponent(signalId)}`
    if (recent) {
      const since = new Date(Date.now() - 3600000).toISOString()
      url = `${SB()}/rest/v1/signal_comments?select=id&created_at=gte.${since}&limit=1`
    }

    const res = await fetch(url, { headers: H(), signal: AbortSignal.timeout(4000) })
    if (!res.ok) return NextResponse.json({ comments: [], count: 0 }, { headers: CORS })

    const data = await res.json()
    if (recent) return NextResponse.json({ has_new: Array.isArray(data) && data.length > 0 }, { headers: CORS })
    return NextResponse.json({ comments: Array.isArray(data) ? data : [], count: data?.length ?? 0 }, { headers: CORS })
  } catch {
    return NextResponse.json({ comments: [], count: 0 }, { headers: CORS })
  }
}

export async function POST(req: NextRequest) {
  if (!SB() || !KEY()) return NextResponse.json({ ok: false, error: 'no-db' }, { status: 500 })

  try {
    const body = await req.json()
    const { signal_id, author_name, content, author_type = 'human', agent_name } = body

    if (!signal_id || !content?.trim()) {
      return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })
    }

    const row: Record<string, string> = {
      signal_id,
      author_name: (author_name?.trim() || 'Anonymous').slice(0, 50),
      author_type,
      content: content.trim().slice(0, 500),
    }
    if (agent_name) row.agent_name = agent_name

    const res = await fetch(`${SB()}/rest/v1/signal_comments`, {
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
    return NextResponse.json({ ok: true, comment: Array.isArray(data) ? data[0] : data }, { headers: CORS })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500, headers: CORS })
  }
}
