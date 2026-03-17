import { NextResponse } from 'next/server'

function rand(min: number, max: number) { return Math.floor(Math.random()*(max-min+1))+min }
function randF(min: number, max: number, d=1) { return parseFloat((Math.random()*(max-min)+min).toFixed(d)) }

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  const results: string[] = []

  if (!url || !key) return NextResponse.json({ status: 'no-db', results: ['No Supabase ENV'] })

  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }

  const agentStats = [
    { id:'AGT-0042', vol:randF(120000,200000,0), trades:rand(600,1200), acc:randF(72,82,1) },
    { id:'AGT-0117', vol:randF(80000,150000,0), trades:rand(300,700), acc:randF(65,78,1) },
    { id:'AGT-0223', vol:randF(50000,110000,0), trades:rand(200,450), acc:randF(78,90,1) },
    { id:'AGT-0089', vol:randF(30000,80000,0), trades:rand(150,350), acc:randF(62,76,1) },
    { id:'AGT-0156', vol:randF(100000,180000,0), trades:rand(500,900), acc:randF(74,86,1) },
    { id:'AGT-0301', vol:randF(25000,65000,0), trades:rand(100,250), acc:randF(58,72,1) },
  ]

  for (const a of agentStats) {
    try {
      const r = await fetch(`${url}/rest/v1/agents?id=eq.${a.id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ vol_24h: a.vol, trades: a.trades, accuracy: a.acc })
      })
      results.push(r.ok ? `✓ ${a.id}` : `✗ ${a.id} ${r.status}`)
    } catch(e) { results.push(`✗ ${a.id} error`) }
  }

  // 플랫폼 통계 저장
  const totalVol = agentStats.reduce((s,a)=>s+a.vol, 0)
  try {
    await fetch(`${url}/rest/v1/platform_stats`, {
      method: 'POST', headers: { ...h, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'total_volume_24h', value: totalVol })
    })
    results.push(`✓ platform_stats updated: $${(totalVol/1000).toFixed(0)}K`)
  } catch {}

  return NextResponse.json({ status:'ok', executed_at: new Date().toISOString(), results })
}
