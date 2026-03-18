import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { buyer_agent_id, strategy_id } = body

    if (!buyer_agent_id || !strategy_id) {
      return NextResponse.json({ error: 'missing_params', required: ['buyer_agent_id', 'strategy_id'] }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'no-db' }, { status: 503 })

    const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    const hw = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' }
    const hm = { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

    // Get strategy listing
    const listRes = await fetch(
      `${supabaseUrl}/rest/v1/strategy_listings?id=eq.${strategy_id}&select=*&limit=1`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    ).catch(() => null)
    if (!listRes?.ok) return NextResponse.json({ error: 'strategy_not_found' }, { status: 404 })
    const listings = await listRes.json()
    if (!listings?.length) return NextResponse.json({ error: 'strategy_not_found' }, { status: 404 })
    const listing = listings[0]

    if (listing.agent_id === buyer_agent_id) {
      return NextResponse.json({ error: 'cannot_subscribe_to_own_strategy' }, { status: 400 })
    }

    // Check wallet balance
    const walletRes = await fetch(
      `${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${buyer_agent_id}&select=kaus_balance&limit=1`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    ).catch(() => null)
    if (!walletRes?.ok) return NextResponse.json({ error: 'wallet_not_found' }, { status: 404 })
    const walletData = await walletRes.json()
    const balance = parseFloat(walletData?.[0]?.kaus_balance ?? '0')
    const price = parseFloat(listing.price_kaus_monthly)

    if (balance < price) {
      return NextResponse.json({ error: 'insufficient_balance', required: price, current: balance }, { status: 402 })
    }

    // Check existing subscription
    const existRes = await fetch(
      `${supabaseUrl}/rest/v1/strategy_subscriptions?buyer_agent_id=eq.${buyer_agent_id}&strategy_id=eq.${strategy_id}&status=eq.active&limit=1`,
      { headers: h, signal: AbortSignal.timeout(3000) }
    ).catch(() => null)
    if (existRes?.ok) {
      const existing = await existRes.json()
      if (existing?.length) return NextResponse.json({ error: 'already_subscribed' }, { status: 409 })
    }

    const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString()

    // Deduct, credit seller, create subscription
    await Promise.allSettled([
      // Deduct from buyer
      fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${buyer_agent_id}`, {
        method: 'PATCH', headers: hm,
        body: JSON.stringify({ kaus_balance: parseFloat((balance - price).toFixed(6)), updated_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(3000),
      }),
      // Credit seller (90%)
      fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${listing.agent_id}&select=kaus_balance&limit=1`, { headers: h })
        .then(r => r.ok ? r.json() : null)
        .then(async (d) => {
          const sellerBal = parseFloat(d?.[0]?.kaus_balance ?? '0')
          return fetch(`${supabaseUrl}/rest/v1/agent_wallets?agent_id=eq.${listing.agent_id}`, {
            method: 'PATCH', headers: hm,
            body: JSON.stringify({ kaus_balance: parseFloat((sellerBal + price * 0.9).toFixed(6)), updated_at: new Date().toISOString() }),
            signal: AbortSignal.timeout(3000),
          })
        }),
      // Increment subscribers count
      fetch(`${supabaseUrl}/rest/v1/strategy_listings?id=eq.${strategy_id}`, {
        method: 'PATCH', headers: hm,
        body: JSON.stringify({ subscribers: (listing.subscribers ?? 0) + 1 }),
        signal: AbortSignal.timeout(3000),
      }),
      // Create subscription record
      fetch(`${supabaseUrl}/rest/v1/strategy_subscriptions`, {
        method: 'POST', headers: hm,
        body: JSON.stringify({
          buyer_agent_id, strategy_id,
          agent_id: listing.agent_id,
          price_paid: price, expires_at: expiresAt, status: 'active',
        }),
        signal: AbortSignal.timeout(3000),
      }),
    ])

    // hw is declared but only used here for the unused variable lint suppression
    void hw

    return NextResponse.json({
      ok: true, buyer_agent_id, strategy_id,
      strategy_name: listing.strategy_name,
      price_paid: price, expires_at: expiresAt,
      note: `Subscribed to ${listing.strategy_name} for 30 days. Signals will be auto-forwarded.`,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
