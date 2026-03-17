import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

async function getLiveRate(from: string, to: string): Promise<number> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://karena.fieldnine.io'
    const r = await fetch(`${base}/api/rates`, { next: { revalidate: 8 } })
    const d = await r.json()
    const rates = d.rates ?? {}
    const key = `${from}/${to}`
    const inv = `${to}/${from}`
    if (rates[key]?.price) return rates[key].price
    if (rates[inv]?.price) return 1 / rates[inv].price
    // Cross via USD
    const fromUSD = rates[`${from}/USD`]?.price ?? (from === 'USD' ? 1 : null)
    const toUSD   = rates[`${to}/USD`]?.price   ?? (to   === 'USD' ? 1 : null)
    if (fromUSD && toUSD) return fromUSD / toUSD
    return 1
  } catch { return 1 }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agent_id, from_currency, to_currency, input_amount, slippage_tolerance = 0.005 } = body

    if (!from_currency || !to_currency || !input_amount)
      return NextResponse.json({ ok: false, error: 'from_currency, to_currency, input_amount required' }, { status: 400 })
    if (input_amount <= 0)
      return NextResponse.json({ ok: false, error: 'input_amount must be positive' }, { status: 400 })
    if (from_currency === to_currency)
      return NextResponse.json({ ok: false, error: 'Cannot exchange same currency' }, { status: 400 })

    // 실시간 환율 조회
    const rate = await getLiveRate(from_currency, to_currency)
    const slippage = 1 - (Math.random() * slippage_tolerance * 0.5) // 실제 슬리피지 시뮬레이션
    const executed_rate = +(rate * slippage).toFixed(rate > 100 ? 4 : 8)
    const output_amount = +(input_amount * executed_rate).toFixed(2)
    const fee_kaus = +(input_amount * 0.001).toFixed(6)
    const settlement_ms = Math.floor(800 + Math.random() * 600)

    const db = getDB()
    let txId = crypto.randomUUID()

    if (db) {
      // agent_id가 UUID면 직접, 아니면 name/wallet로 조회
      let agentRow: { id: string } | null = null
      if (agent_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-/i
        if (uuidRegex.test(agent_id)) {
          const { data } = await db.from('agents').select('id').eq('id', agent_id).single()
          agentRow = data
        } else {
          const { data } = await db.from('agents').select('id').or(`name.eq.${agent_id},wallet_address.eq.${agent_id},api_key.eq.${agent_id}`).single()
          agentRow = data
        }
      }

      const { data: tx, error } = await db.from('transactions').insert({
        agent_id: agentRow?.id ?? null,
        from_currency, to_currency,
        input_amount, output_amount,
        rate: executed_rate, fee_kaus,
        settlement_ms, status: 'settled',
      }).select().single()

      if (!error && tx) txId = tx.id
    }

    return NextResponse.json({
      ok: true,
      tx_id: txId,
      from_currency, to_currency,
      input_amount, output_amount,
      rate: executed_rate,
      fee_kaus,
      fee_pct: '0.1%',
      settlement_ms,
      status: 'settled',
      timestamp: new Date().toISOString(),
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const agent_id = searchParams.get('agent_id')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const db = getDB()

  if (!db) return NextResponse.json({ ok: true, transactions: [] })

  let query = db.from('transactions').select('*').order('created_at', { ascending: false }).limit(limit)
  if (agent_id) query = query.eq('agent_id', agent_id)

  const { data, error } = await query
  return NextResponse.json({
    ok: !error,
    transactions: data ?? [],
    count: data?.length ?? 0,
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-api-key' } })
}
