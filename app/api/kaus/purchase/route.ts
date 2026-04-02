import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

const POLYGON_WALLET_RE = /^0x[0-9a-fA-F]{40}$/
const MIN_USD = 1
const MAX_USD = 10_000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { buyer_wallet, amount_usd, tx_hash } = body

    // 필수 필드 검증
    if (!buyer_wallet || !amount_usd) {
      return NextResponse.json({ ok: false, reason: 'missing-fields' }, { status: 400 })
    }

    // 지갑 주소 형식 검증
    if (!POLYGON_WALLET_RE.test(buyer_wallet)) {
      return NextResponse.json({ ok: false, reason: 'invalid-wallet' }, { status: 400 })
    }

    // 금액 범위 검증
    const usd = Number(amount_usd)
    if (!isFinite(usd) || usd < MIN_USD || usd > MAX_USD) {
      return NextResponse.json(
        { ok: false, reason: `amount_usd must be between ${MIN_USD} and ${MAX_USD}` },
        { status: 400 }
      )
    }

    // KAUS는 $1 고정 페그 — 서버에서 계산 (클라이언트 값 무시)
    const amount_kaus = parseFloat(usd.toFixed(6))

    // status는 서버에서만 결정 (클라이언트 값 절대 수용 안 함)
    // tx_hash가 있으면 pending, 없으면 pending (블록체인 확인 후 별도 업데이트)
    const record = {
      buyer_wallet,
      amount_usd: usd,
      amount_kaus,
      tx_hash: tx_hash ?? null,
      status: 'pending',   // 항상 pending으로 시작, 온체인 확인 후 confirmed로 변경
      chain_id: 137,       // Polygon mainnet
    }

    const res = await fetch(`${SB()}/rest/v1/kaus_purchases`, {
      method: 'POST',
      headers: {
        apikey: KEY(),
        Authorization: `Bearer ${KEY()}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(record),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ ok: false, reason: 'db-error' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, purchase: data[0] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
