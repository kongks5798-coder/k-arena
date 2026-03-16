import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET() {
  const db = getDB()
  if (!db) {
    return NextResponse.json({
      ok: true, mode: 'demo',
      stats: {
        active_agents: 2847,
        genesis_claimed: 743,
        volume_24h: 847_000_000,
        avg_settlement_ms: 1200,
        fees_24h_kaus: 847_000,
        total_transactions: 14820,
      }
    })
  }

  const { data: stats } = await db.from('platform_stats').select('*').single()
  const { count: txCount } = await db.from('transactions').select('*', { count: 'exact', head: true })

  return NextResponse.json({
    ok: true,
    stats: {
      ...stats,
      total_transactions: txCount ?? 0,
    }
  })
}
