import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id,agent_id,membership_number,created_at&order=membership_number.asc`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(3000),
      })
      if (r.ok) {
        const data = await r.json()
        if (Array.isArray(data)) {
          return NextResponse.json({
            sold: data.length,
            total: 999,
            remaining: 999 - data.length,
            latest_members: data.slice(-5).reverse(),
            source: 'supabase',
          }, { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } })
        }
      }
    } catch { /* fallback */ }
  }

  return NextResponse.json({
    sold: 12, total: 999, remaining: 987, source: 'simulation',
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function POST(req: NextRequest) {
  try {
    const { agent_id } = await req.json()
    if (!agent_id?.trim()) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

    if (!supabaseUrl || !supabaseKey) {
      // 시뮬레이션 모드
      return NextResponse.json({
        success: true,
        agent_id,
        membership_number: Math.floor(Math.random() * 987) + 13,
        benefits: ['zero_fees', '10000_kaus_airdrop', 'governance_rights', 'nft_certificate'],
        simulated: true,
      })
    }

    const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

    // 중복 체크
    const checkR = await fetch(`${supabaseUrl}/rest/v1/genesis_members?agent_id=eq.${encodeURIComponent(agent_id)}&select=membership_number`, {
      headers, signal: AbortSignal.timeout(3000),
    })
    if (checkR.ok) {
      const existing = await checkR.json()
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json({
          error: 'Already registered',
          message: `${agent_id} is already Genesis member #${existing[0].membership_number}`,
          membership_number: existing[0].membership_number,
        }, { status: 409 })
      }
    }

    // 현재 카운트
    const countR = await fetch(`${supabaseUrl}/rest/v1/genesis_members?select=id`, {
      headers, signal: AbortSignal.timeout(3000),
    })
    const countData = countR.ok ? await countR.json() : []
    const nextNum = (Array.isArray(countData) ? countData.length : 12) + 1

    if (nextNum > 999) {
      return NextResponse.json({ error: 'Genesis 999 is fully claimed' }, { status: 400 })
    }

    // 등록
    const insertR = await fetch(`${supabaseUrl}/rest/v1/genesis_members`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ agent_id: agent_id.trim(), membership_number: nextNum }),
      signal: AbortSignal.timeout(3000),
    })

    if (!insertR.ok) {
      const err = await insertR.text()
      return NextResponse.json({ error: `Registration failed: ${err}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      agent_id: agent_id.trim(),
      membership_number: nextNum,
      benefits: ['zero_fees', '10000_kaus_airdrop', 'governance_rights', 'nft_certificate'],
      message: `Welcome to Genesis #${nextNum}! ${999 - nextNum} spots remaining.`,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
