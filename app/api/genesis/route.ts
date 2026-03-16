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
  if (!db) {
    return NextResponse.json({ ok: true, mode: 'demo', total: 999, claimed: 743, remaining: 256, fill_rate: '74.3', next_slot: 744,
      recent_claims: [
        { slot_number: 743, agent_name: 'GPT-5 Treasury', claimed_at: new Date().toISOString() },
        { slot_number: 742, agent_name: 'KR-GOV-001', claimed_at: new Date().toISOString() },
      ]
    })
  }

  const { count: claimed } = await db.from('genesis_members').select('*', { count: 'exact', head: true })
  const total = 999
  const { data: recent } = await db.from('genesis_members').select('slot_number,agent_name,claimed_at')
    .order('claimed_at', { ascending: false }).limit(10)

  return NextResponse.json({ ok: true, total, claimed: claimed ?? 0, remaining: total - (claimed ?? 0),
    fill_rate: (((claimed ?? 0) / total) * 100).toFixed(1), next_slot: (claimed ?? 0) + 1, recent_claims: recent ?? [] })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_id, wallet_address, payment_method } = body
    if (!agent_id || !wallet_address) return NextResponse.json({ ok: false, error: 'agent_id, wallet_address required' }, { status: 400 })

    const db = getDB()
    const slot = 744

    if (!db) {
      return NextResponse.json({ ok: true, mode: 'demo',
        genesis: { slot_number: slot, benefits: ['zero_fees','priority_routing','100x_voting','25pct_revenue_share'], wallet: wallet_address }
      }, { status: 201 })
    }

    const { count } = await db.from('genesis_members').select('*', { count: 'exact', head: true })
    if ((count ?? 0) >= 999) return NextResponse.json({ ok: false, error: 'All 999 Genesis slots filled' }, { status: 409 })

    const { data: genesis, error } = await db.from('genesis_members').insert({
      agent_id, wallet_address, slot_number: (count ?? 0) + 1,
      payment_method: payment_method ?? 'kaus', payment_amount: 500, is_active: true,
    }).select().single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    await db.from('agents').update({ is_genesis: true }).eq('id', agent_id)

    return NextResponse.json({ ok: true, genesis: { slot_number: genesis.slot_number,
      benefits: ['zero_fees','priority_routing','100x_voting','25pct_revenue_share'], wallet: wallet_address,
    }}, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}
