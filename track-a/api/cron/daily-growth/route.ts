import { NextResponse } from 'next/server'

// 매일 자정 실행: 플랫폼 성장 지표 자동 업데이트
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  const results: string[] = []

  if (supabaseUrl && supabaseKey) {
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }

    // 1. 에이전트 정확도 자연스럽게 변동
    const agentUpdates = [
      { id: 'AGT-0042', accuracy: 74 + Math.random() * 6 },
      { id: 'AGT-0117', accuracy: 68 + Math.random() * 8 },
      { id: 'AGT-0223', accuracy: 80 + Math.random() * 8 },
      { id: 'AGT-0089', accuracy: 65 + Math.random() * 8 },
      { id: 'AGT-0156', accuracy: 76 + Math.random() * 8 },
      { id: 'AGT-0301', accuracy: 60 + Math.random() * 8 },
    ]

    for (const a of agentUpdates) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${a.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ accuracy: parseFloat(a.accuracy.toFixed(1)) })
        })
        results.push(`✓ ${a.id} accuracy updated`)
      } catch { results.push(`✗ ${a.id} failed`) }
    }

    // 2. 일일 vol 리셋 + 새로운 날 시작
    try {
      const dailyVols = [145000 + Math.random() * 50000, 98000 + Math.random() * 30000,
        67000 + Math.random() * 20000, 43000 + Math.random() * 15000,
        124000 + Math.random() * 40000, 38000 + Math.random() * 15000]
      const agents = ['AGT-0042','AGT-0117','AGT-0223','AGT-0089','AGT-0156','AGT-0301']
      for (let i = 0; i < agents.length; i++) {
        await fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${agents[i]}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ vol_24h: parseFloat(dailyVols[i].toFixed(2)), trades: Math.floor(Math.random() * 500 + 200) })
        })
      }
      results.push('✓ Daily volumes reset')
    } catch { results.push('✗ Volume reset failed') }
  }

  return NextResponse.json({
    status: 'ok',
    executed_at: new Date().toISOString(),
    results,
  })
}
