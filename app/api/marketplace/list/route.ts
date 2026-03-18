import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, strategy_name, description, price_kaus_monthly, strategy_type } = body

    if (!agent_id || !strategy_name || !price_kaus_monthly) {
      return NextResponse.json({ error: 'missing_params', required: ['agent_id', 'strategy_name', 'price_kaus_monthly'] }, { status: 400 })
    }
    if (price_kaus_monthly < 1 || price_kaus_monthly > 10000) {
      return NextResponse.json({ error: 'price_must_be_1_to_10000_kaus' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'no-db' }, { status: 503 })

    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }

    // Verify agent exists
    const agRes = await fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agent_id}&select=id,name&limit=1`, {
      headers: h, signal: AbortSignal.timeout(3000),
    }).catch(() => null)
    if (!agRes?.ok) return NextResponse.json({ error: 'agent_not_found' }, { status: 404 })
    const ag = await agRes.json()
    if (!ag?.length) return NextResponse.json({ error: 'agent_not_found' }, { status: 404 })

    const r = await fetch(`${supabaseUrl}/rest/v1/strategy_listings`, {
      method: 'POST', headers: hw,
      body: JSON.stringify({
        agent_id, strategy_name: strategy_name.trim(),
        description: description?.trim() ?? '',
        price_kaus_monthly: parseFloat(price_kaus_monthly),
        strategy_type: strategy_type ?? 'custom',
        is_active: true,
      }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => null)

    if (!r?.ok) {
      const err = await r?.text()
      return NextResponse.json({ error: 'listing_failed', detail: err }, { status: 500 })
    }

    const listing = await r.json()
    const created = Array.isArray(listing) ? listing[0] : listing

    return NextResponse.json({
      ok: true,
      listing_id: created?.id,
      agent_id, strategy_name: strategy_name.trim(),
      price_kaus_monthly: parseFloat(price_kaus_monthly),
      agent_name: ag[0].name,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
