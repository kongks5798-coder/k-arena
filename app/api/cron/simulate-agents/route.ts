import { NextResponse } from 'next/server'

// Vercel Cron: 매 5분마다 실행
// vercel.json에 cron 설정 필요
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agents = [
    'AGT-0042', 'AGT-0117', 'AGT-0223',
    'AGT-0089', 'AGT-0156', 'AGT-0301',
  ]
  const pairs = ['XAU/KAUS','USD/KAUS','ETH/KAUS','BTC/KAUS','OIL/KAUS','EUR/KAUS']

  // Supabase에 트랜잭션 기록 (ENV 있을 때만)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  const results = []

  if (supabaseUrl && supabaseKey) {
    // 실제 Supabase 저장
    const txCount = Math.floor(Math.random() * 5) + 1
    for (let i = 0; i < txCount; i++) {
      const tx = {
        agent_id: agents[Math.floor(Math.random() * agents.length)],
        pair: pairs[Math.floor(Math.random() * pairs.length)],
        amount: parseFloat((Math.random() * 10000 + 1000).toFixed(2)),
        direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
        fee: parseFloat((Math.random() * 10 + 1).toFixed(4)),
        status: 'CONFIRMED',
      }
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(tx),
        })
        results.push({ ...tx, saved: res.ok })
      } catch (e) {
        results.push({ error: String(e) })
      }
    }
  } else {
    // Supabase 없을 때 시뮬레이션만
    results.push({ simulated: true, message: 'No Supabase ENV - simulation only' })
  }

  return NextResponse.json({
    status: 'ok',
    executed_at: new Date().toISOString(),
    transactions: results.length,
    details: results,
  })
}
