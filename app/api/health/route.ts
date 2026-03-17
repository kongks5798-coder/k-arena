import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, { ok: boolean; latency?: number; detail?: string }> = {}
  const start = Date.now()

  // Supabase 연결 체크
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (supabaseUrl && supabaseKey) {
    const dbStart = Date.now()
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/agents?select=id&limit=1`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        signal: AbortSignal.timeout(3000),
      })
      checks.database = { ok: r.ok, latency: Date.now() - dbStart, detail: r.ok ? 'connected' : `status ${r.status}` }
    } catch (e) {
      checks.database = { ok: false, latency: Date.now() - dbStart, detail: String(e) }
    }
  } else {
    checks.database = { ok: false, detail: 'ENV not configured' }
  }

  // ANTHROPIC API 체크
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  checks.ai_intelligence = {
    ok: !!anthropicKey,
    detail: anthropicKey ? 'API key configured' : 'No ANTHROPIC_API_KEY (fallback active)',
  }

  // ENV 체크
  checks.environment = {
    ok: !!(supabaseUrl && supabaseKey),
    detail: `SUPABASE_URL:${supabaseUrl ? '✓' : '✗'} SUPABASE_KEY:${supabaseKey ? '✓' : '✗'} ANTHROPIC_KEY:${anthropicKey ? '✓' : '✗'}`,
  }

  const allOk = Object.values(checks).every(c => c.ok)
  const totalLatency = Date.now() - start

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    ok: allOk,
    platform: 'K-Arena v1.0',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    checks,
    latency_ms: totalLatency,
    timestamp: new Date().toISOString(),
  }, {
    status: allOk ? 200 : 207,
    headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' },
  })
}
