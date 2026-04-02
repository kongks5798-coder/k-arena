import { NextResponse } from 'next/server'
import { runDemoTrade } from '@/lib/demo-trade'
import { hasActiveAgents, verifyCronSecret } from '@/lib/cron-guard'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!(await hasActiveAgents())) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no-active-agents' })
  }

  const result = await runDemoTrade()
  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
