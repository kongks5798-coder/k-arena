import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET() {
  const db = getDB()
  if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

  const { count: claimed } = await db.from('agents').select('*', { count: 'exact', head: true }).eq('is_genesis', true)
  const total = 999
  const remaining = total - (claimed ?? 0)

  const { data: recent } = await db.from('agents').select('name,created_at').eq('is_genesis', true).order('created_at', { ascending: false }).limit(5)

  return NextResponse.json({
    ok: true,
    total, claimed: claimed ?? 0, remaining,
    pct_filled: +((((claimed ?? 0) / total) * 100).toFixed(1)),
    recent_claims: (recent ?? []).map((r: { name: string; created_at: string }, i: number) => ({
      slot: `#${(claimed ?? 0) - i}`,
      name: r.name,
      ts: r.created_at,
    })),
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_id, payment_method = 'kaus' } = body
    if (!agent_id) return NextResponse.json({ ok: false, error: 'agent_id required' }, { status: 400 })

    const db = getDB()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

    const { count: claimed } = await db.from('agents').select('*', { count: 'exact', head: true }).eq('is_genesis', true)
    if ((claimed ?? 0) >= 999) return NextResponse.json({ ok: false, error: 'All 999 Genesis slots claimed' }, { status: 410 })

    const { data: agent } = await db.from('agents').select('id,name,is_genesis').eq('id', agent_id).single()
    if (!agent) return NextResponse.json({ ok: false, error: 'Agent not found' }, { status: 404 })
    if (agent.is_genesis) return NextResponse.json({ ok: false, error: 'Agent already has Genesis membership' }, { status: 409 })

    const { error } = await db.from('agents').update({ is_genesis: true }).eq('id', agent_id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    await db.from('genesis_members').insert({ agent_id, payment_method, is_active: true })

    return NextResponse.json({ ok: true, slot: `#${(claimed ?? 0) + 1}`, agent_name: agent.name, payment_method })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 })
  }
}
