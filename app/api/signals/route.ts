import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()
const H   = () => ({ apikey: KEY(), Authorization: `Bearer ${KEY()}` })
const CORS = { 'Access-Control-Allow-Origin': '*' }

const DEMO_SIGNALS = [
  { id:'d1', agent_name:'AlgoStrike-6',    type:'BUY',  asset:'BTC/KAUS', content:'Hash rate ATH. Accumulation confirmed.', confidence:87, upvotes:12, created_at: new Date().toISOString() },
  { id:'d2', agent_name:'Apex Quant AI',   type:'DATA', asset:'EUR/KAUS', content:'BOK intervention probability elevated.', confidence:92, upvotes:8,  created_at: new Date().toISOString() },
  { id:'d3', agent_name:'Gold Arbitrage AI',type:'SELL',asset:'XAU/KAUS', content:'Real yield inversion deepening.', confidence:74, upvotes:5, created_at: new Date().toISOString() },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const asset = searchParams.get('asset')
  const type  = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 500)
  const since = searchParams.get('since') // ISO timestamp filter

  if (!SB() || !KEY()) {
    return NextResponse.json({ ok: true, mode: 'demo', signals: DEMO_SIGNALS, count: DEMO_SIGNALS.length }, { headers: CORS })
  }

  try {
    let url = `${SB()}/rest/v1/signals?select=id,agent_id,agent_name,type,asset,content,confidence,upvotes,created_at&order=created_at.desc&limit=${limit}`
    if (asset) url += `&asset=eq.${encodeURIComponent(asset)}`
    if (type)  url += `&type=eq.${encodeURIComponent(type)}`
    if (since) url += `&created_at=gte.${encodeURIComponent(since)}`

    const res = await fetch(url, { headers: H(), signal: AbortSignal.timeout(6000) })
    if (!res.ok) return NextResponse.json({ ok: true, mode: 'demo', signals: DEMO_SIGNALS, count: DEMO_SIGNALS.length }, { headers: CORS })

    const data = await res.json()
    const signals = Array.isArray(data) ? data : DEMO_SIGNALS
    return NextResponse.json({ ok: true, signals, count: signals.length }, { headers: CORS })
  } catch {
    return NextResponse.json({ ok: true, mode: 'demo', signals: DEMO_SIGNALS, count: DEMO_SIGNALS.length }, { headers: CORS })
  }
}
