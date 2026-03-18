export const dynamic = 'force-dynamic'

const SUPABASE_TRANSACTIONS_SELECT =
  'id,agent_id,pair,amount,direction,fee,status,created_at'

function buildTxUrl(supabaseUrl: string, since?: string): string {
  const base = `${supabaseUrl}/rest/v1/transactions?select=${SUPABASE_TRANSACTIONS_SELECT}&order=created_at.desc&limit=10`
  if (since) return `${base}&created_at=gt.${encodeURIComponent(since)}`
  return base
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return new Response('Missing Supabase configuration', { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const sinceParam = searchParams.get('since')
  const defaultSince = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const initialSince = sinceParam || defaultSince

  const supabaseHeaders = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  }

  const abortController = new AbortController()
  request.signal.addEventListener('abort', () => abortController.abort())

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (text: string) => new TextEncoder().encode(text)

      // 1. Send initial snapshot — last 10 transactions
      try {
        const snapshotRes = await fetch(buildTxUrl(supabaseUrl), {
          headers: supabaseHeaders,
          signal: abortController.signal,
        })
        if (snapshotRes.ok) {
          const transactions = await snapshotRes.json()
          controller.enqueue(encode(sseEvent('snapshot', { transactions })))
        } else {
          controller.enqueue(encode(sseEvent('snapshot', { transactions: [] })))
        }
      } catch {
        if (abortController.signal.aborted) {
          controller.close()
          return
        }
        controller.enqueue(encode(sseEvent('snapshot', { transactions: [] })))
      }

      // 2. Track latest timestamp for polling
      let latestTimestamp = initialSince

      // 3. Poll every 5 seconds for new transactions
      while (!abortController.signal.aborted) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 5000)
          abortController.signal.addEventListener('abort', () => {
            clearTimeout(timer)
            resolve()
          })
        })

        if (abortController.signal.aborted) break

        try {
          const updateUrl = buildTxUrl(supabaseUrl, latestTimestamp)
          const updateRes = await fetch(updateUrl, {
            headers: supabaseHeaders,
            signal: abortController.signal,
          })

          if (updateRes.ok) {
            const transactions: Array<{ created_at: string }> = await updateRes.json()
            if (transactions.length > 0) {
              controller.enqueue(encode(sseEvent('update', { transactions })))
              // Advance latestTimestamp to the most recent returned row
              const newest = transactions[0].created_at
              if (newest && newest > latestTimestamp) {
                latestTimestamp = newest
              }
            }
          }
        } catch {
          if (abortController.signal.aborted) break
          // Network error — silently continue polling
        }
      }

      try {
        controller.close()
      } catch {
        // Already closed
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  })
}
