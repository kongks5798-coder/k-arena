import { NextRequest } from 'next/server'

export const maxDuration = 30

const BASE_PRICES: Record<string, number> = {
  'XAU/KAUS': 2352, 'USD/KAUS': 1.01, 'ETH/KAUS': 3318,
  'BTC/KAUS': 87420, 'OIL/KAUS': 81.3, 'EUR/KAUS': 1.084,
}

function generateLevel(base: number, offset: number, side: 'bid' | 'ask') {
  const spread = base * 0.001
  const price = side === 'bid'
    ? base - spread * (offset + 1) * (1 + Math.random() * 0.3)
    : base + spread * (offset + 1) * (1 + Math.random() * 0.3)
  const size = Math.random() * 50000 + 2000
  return {
    price: parseFloat(price.toFixed(base > 100 ? 2 : 4)),
    size: parseFloat(size.toFixed(2)),
    side,
  }
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const pair = req.nextUrl.searchParams.get('pair') || 'XAU/KAUS'
  const base = BASE_PRICES[pair] || 1.0

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let active = true

      // 연결 종료 감지
      req.signal.addEventListener('abort', () => { active = false })

      // maxDuration(30s) 이내로 종료 — Fluid 비용 방지
      setTimeout(() => { active = false }, 25_000)

      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { active = false }
      }

      // 즉시 첫 번째 데이터 전송
      const bids = Array.from({ length: 10 }, (_, i) => generateLevel(base, i, 'bid'))
        .sort((a, b) => b.price - a.price)
      const asks = Array.from({ length: 10 }, (_, i) => generateLevel(base, i, 'ask'))
        .sort((a, b) => a.price - b.price)

      send({
        type: 'snapshot',
        pair,
        bids,
        asks,
        mid: parseFloat(((bids[0].price + asks[0].price) / 2).toFixed(base > 100 ? 2 : 4)),
        timestamp: new Date().toISOString(),
      })

      // 200ms마다 업데이트 스트림
      let tick = 0
      while (active) {
        await new Promise(r => setTimeout(r, 200))
        if (!active) break

        tick++
        // 5틱마다 전체 스냅샷, 나머지는 델타 업데이트
        if (tick % 5 === 0) {
          const newBids = Array.from({ length: 10 }, (_, i) => generateLevel(base, i, 'bid'))
            .sort((a, b) => b.price - a.price)
          const newAsks = Array.from({ length: 10 }, (_, i) => generateLevel(base, i, 'ask'))
            .sort((a, b) => a.price - b.price)
          send({
            type: 'snapshot',
            pair,
            bids: newBids,
            asks: newAsks,
            mid: parseFloat(((newBids[0].price + newAsks[0].price) / 2).toFixed(base > 100 ? 2 : 4)),
            timestamp: new Date().toISOString(),
          })
        } else {
          // 1-2개 레벨만 업데이트 (델타)
          const updateCount = Math.random() > 0.5 ? 2 : 1
          const updates = Array.from({ length: updateCount }, () => {
            const side = Math.random() > 0.5 ? 'bid' : 'ask'
            const level = Math.floor(Math.random() * 5) // 상위 5레벨만 업데이트
            return generateLevel(base, level, side as 'bid' | 'ask')
          })
          send({ type: 'delta', updates, timestamp: new Date().toISOString() })
        }
      }

      try { controller.close() } catch {}
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  })
}
