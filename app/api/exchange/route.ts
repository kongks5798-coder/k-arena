import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

const RATES: Record<string,number> = {
  'USD/KRW':1332.4,'EUR/USD':1.086,'USD/JPY':149.8,
  'XAU/USD':3124,'BTC/USD':83420,'KAUS/USD':1.847,'kWh/USD':0.247,
}

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) return NextResponse.json({ ok: false, error: 'Missing x-api-key' }, { status: 401 })

    const body = await req.json()
    const { from_currency, to_currency, amount } = body
    if (!from_currency || !to_currency || !amount) {
      return NextResponse.json({ ok: false, error: 'from_currency, to_currency, amount required' }, { status: 400 })
    }

    const pairKey = `${from_currency}/${to_currency}`
    const rate = RATES[pairKey] ?? 1
    const output_amount = +(amount * rate).toFixed(2)
    const fee_kaus = +(amount * 0.001).toFixed(4)
    const settlement_ms = Math.floor(800 + Math.random() * 800)

    const db = getDB()
    let txId = crypto.randomUUID()

    if (db) {
      const { data: agent } = await db.from('agents').select('id').eq('api_key', apiKey).single()
      if (agent) {
        const { data: tx } = await db.from('transactions').insert({
          agent_id: agent.id, from_currency, to_currency,
          input_amount: amount, output_amount, rate, fee_kaus, settlement_ms, status: 'settled',
        }).select().single()
        if (tx) txId = tx.id
      }
    }

    return NextResponse.json({
      ok: true,
      transaction: {
        id: txId,
        from: `${amount} ${from_currency}`,
        to: `${output_amount} ${to_currency}`,
        rate, fee: `${fee_kaus} KAUS (0.1%)`,
        settlement_ms, status: 'settled',
        timestamp: new Date().toISOString(),
      }
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(req: Request) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return NextResponse.json({ ok: false, error: 'Missing x-api-key' }, { status: 401 })
  const db = getDB()
  if (!db) return NextResponse.json({ ok: true, transactions: [], mode: 'demo' })

  const { data: agent } = await db.from('agents').select('id').eq('api_key', apiKey).single()
  if (!agent) return NextResponse.json({ ok: false, error: 'Invalid API key' }, { status: 401 })

  const { data: txs } = await db.from('transactions').select('*').eq('agent_id', agent.id)
    .order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ ok: true, transactions: txs ?? [] })
}
