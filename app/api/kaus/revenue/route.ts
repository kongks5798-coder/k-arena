import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}` })

export async function GET() {
  try {
    const [feeRes, buyRes] = await Promise.all([
      fetch(`${SB()}/rest/v1/platform_fees?select=fee_kaus,fee_usd,created_at`, { headers: H(), cache: 'no-store' }),
      fetch(`${SB()}/rest/v1/kaus_purchases?select=amount_usd,amount_kaus,tx_hash,buyer_wallet,created_at&order=created_at.desc&limit=20`, { headers: H(), cache: 'no-store' }),
    ])

    const fees: any[]    = feeRes.ok  ? await feeRes.json()  : []
    const purchases: any[] = buyRes.ok ? await buyRes.json() : []

    const now = Date.now()
    const d1  = now - 86400000
    const d7  = now - 7 * 86400000

    const totalKaus = fees.reduce((s, f) => s + Number(f.fee_kaus || 0), 0)
    const totalUsd  = fees.reduce((s, f) => s + Number(f.fee_usd  || 0), 0)
    const kaus24h   = fees.filter(f => new Date(f.created_at).getTime() > d1).reduce((s, f) => s + Number(f.fee_kaus || 0), 0)
    const kaus7d    = fees.filter(f => new Date(f.created_at).getTime() > d7).reduce((s, f) => s + Number(f.fee_kaus || 0), 0)

    return NextResponse.json({
      ok: true,
      revenue: {
        total_kaus: Math.round(totalKaus * 100) / 100,
        total_usd:  Math.round(totalUsd  * 100) / 100,
        kaus_24h:   Math.round(kaus24h   * 100) / 100,
        kaus_7d:    Math.round(kaus7d    * 100) / 100,
        fee_count:  fees.length,
      },
      purchases: purchases.slice(0, 10),
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
