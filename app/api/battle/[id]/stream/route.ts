import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const battleId = params.id
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const h = {
        apikey: supabaseKey ?? '',
        Authorization: `Bearer ${supabaseKey ?? ''}`,
      }

      let viewers = Math.floor(Math.random() * 20) + 3 // simulate viewers starting at 3-22

      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      const tick = async () => {
        if (!supabaseUrl || !supabaseKey) {
          send({ error: 'no-db' })
          return
        }

        // Fetch battle
        const bRes = await fetch(
          `${supabaseUrl}/rest/v1/battles?id=eq.${battleId}&select=*&limit=1`,
          { headers: h, signal: AbortSignal.timeout(2000) }
        ).catch(() => null)

        if (!bRes?.ok) { send({ error: 'battle_not_found' }); return }
        const battles = await bRes.json()
        if (!battles?.length) { send({ error: 'battle_not_found' }); return }

        const battle = battles[0]

        // Fetch credit scores for both agents in parallel
        const [csARes, csBRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${battle.agent_a_id}&select=score,tier&limit=1`, {
            headers: h, signal: AbortSignal.timeout(2000),
          }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/agent_credit_scores?agent_id=eq.${battle.agent_b_id}&select=score,tier&limit=1`, {
            headers: h, signal: AbortSignal.timeout(2000),
          }).catch(() => null),
        ])

        const csA = csARes?.ok ? await csARes.json() : null
        const csB = csBRes?.ok ? await csBRes.json() : null

        const scoreA = Number(csA?.[0]?.score ?? 100)
        const scoreB = Number(csB?.[0]?.score ?? 100)
        const total = scoreA + scoreB || 200
        const probA = parseFloat(((scoreA / total) * 100).toFixed(1))
        const probB = parseFloat((100 - probA).toFixed(1))

        // Fetch agent names
        const [agARes, agBRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${battle.agent_a_id}&select=id,name&limit=1`, {
            headers: h, signal: AbortSignal.timeout(2000),
          }).catch(() => null),
          fetch(`${supabaseUrl}/rest/v1/agents?id=eq.${battle.agent_b_id}&select=id,name&limit=1`, {
            headers: h, signal: AbortSignal.timeout(2000),
          }).catch(() => null),
        ])

        const agA = agARes?.ok ? await agARes.json() : null
        const agB = agBRes?.ok ? await agBRes.json() : null

        // Drift viewers slightly
        viewers = Math.max(1, viewers + Math.floor(Math.random() * 3) - 1)

        send({
          battle,
          agent_a: { id: battle.agent_a_id, name: agA?.[0]?.name ?? battle.agent_a_id.slice(0, 8), score: scoreA, tier: csA?.[0]?.tier ?? 'BRONZE', win_prob: probA },
          agent_b: { id: battle.agent_b_id, name: agB?.[0]?.name ?? battle.agent_b_id.slice(0, 8), score: scoreB, tier: csB?.[0]?.tier ?? 'BRONZE', win_prob: probB },
          viewers,
          timestamp: new Date().toISOString(),
        })
      }

      // Initial tick immediately
      await tick()

      // Then every 2 seconds (balance between real-time and API rate limits)
      const interval = setInterval(tick, 2000)

      // Stop after 10 minutes max
      const timeout = setTimeout(() => {
        clearInterval(interval)
        controller.close()
      }, 600_000)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        clearTimeout(timeout)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
