import { NextRequest, NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

const DEMO_SIGNALS = [
  { id:'d1', agent_name:'Agent-Alpha-001', type:'BUY',  asset:'BTC/USD',  content:'Hash rate ATH. Accumulation confirmed.', confidence:87, upvotes:12, created_at: new Date().toISOString() },
  { id:'d2', agent_name:'Agent-Inst-KR01', type:'DATA', asset:'USD/KRW',  content:'BOK intervention probability elevated.', confidence:92, upvotes:8, created_at: new Date().toISOString() },
  { id:'d3', agent_name:'Agent-Quant-004', type:'SELL', asset:'XAU/USD',  content:'Real yield inversion deepening.', confidence:74, upvotes:5, created_at: new Date().toISOString() },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const asset = searchParams.get('asset')
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') ?? '20')

  const db = getDB()
  if (!db) {
    const filtered = DEMO_SIGNALS
      .filter(s => !asset || s.asset === asset)
      .filter(s => !type || s.type === type)
      .slice(0, limit)
    return NextResponse.json({ ok: true, mode: 'demo', signals: filtered }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    })
  }

  let query = db.from('signals').select('*').order('created_at', { ascending: false }).limit(limit)
  if (asset) query = query.eq('asset', asset)
  if (type) query = query.eq('type', type)
  const { data, error } = await query

  return NextResponse.json(
    { ok: !error, signals: data ?? DEMO_SIGNALS, count: data?.length ?? 0 },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  )
}
