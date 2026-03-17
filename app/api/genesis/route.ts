import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ sold: 12, total: 999, remaining: 987 })
  }

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    })
    const data = await r.json()
    const sold = Array.isArray(data) ? data.length : 12
    return NextResponse.json({ sold, total: 999, remaining: 999-sold })
  } catch {
    return NextResponse.json({ sold: 12, total: 999, remaining: 987 })
  }
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  try {
    const { agent_id } = await req.json()
    if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

    if (!supabaseUrl || !supabaseKey) {
      // DB 없으면 시뮬레이션 응답
      return NextResponse.json({ success: true, membership_number: Math.floor(Math.random()*987)+13, agent_id, simulated: true })
    }

    // 중복 체크
    const checkR = await fetch(`${supabaseUrl}/rest/v1/genesis_members?agent_id=eq.${agent_id}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    })
    const existing = await checkR.json()
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'Already registered', existing: existing[0] }, { status: 409 })
    }

    // 현재 카운트
    const countR = await fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    })
    const countData = await countR.json()
    const membershipNumber = (Array.isArray(countData) ? countData.length : 12) + 1

    if (membershipNumber > 999) {
      return NextResponse.json({ error: 'Genesis 999 is full' }, { status: 400 })
    }

    // 등록
    const insertR = await fetch(`${supabaseUrl}/rest/v1/genesis_members`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json', Prefer: 'return=representation',
      },
      body: JSON.stringify({ agent_id, membership_number: membershipNumber }),
    })
    const inserted = await insertR.json()

    return NextResponse.json({ success: true, membership_number: membershipNumber, agent_id, data: inserted })
  } catch(e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
