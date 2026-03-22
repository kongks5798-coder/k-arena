import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { buyer_wallet, amount_usd, amount_kaus, tx_hash, status } = body
    if (!buyer_wallet || !amount_usd) return NextResponse.json({ ok: false, reason: 'missing-fields' })

    const res = await fetch(`${SB()}/rest/v1/kaus_purchases`, {
      method: 'POST',
      headers: {
        apikey: KEY(), Authorization: `Bearer ${KEY()}`,
        'Content-Type': 'application/json', Prefer: 'return=representation'
      },
      body: JSON.stringify({ buyer_wallet, amount_usd, amount_kaus, tx_hash, status: status ?? 'confirmed', chain_id: 137 }),
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json({ ok: true, purchase: data[0] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
