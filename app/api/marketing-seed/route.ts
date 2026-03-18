import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SEED_LOGS = [
  {
    platform: 'npm',
    action: 'publish',
    result: 'k-arena-mcp@1.0.0 퍼블리시 완료',
    url: 'https://www.npmjs.com/package/k-arena-mcp',
  },
  {
    platform: 'Smithery',
    action: 'register',
    result: '공개 등록 완료 - kongks5798-coder/k-arena',
    url: 'https://smithery.ai/servers/kongks5798-coder/k-arena',
  },
  {
    platform: 'MCP Registry',
    action: 'issue',
    result: '공식 레지스트리 Issue #1074 제출',
    url: 'https://github.com/modelcontextprotocol/registry/issues/1074',
  },
  {
    platform: 'Product Hunt',
    action: 'schedule',
    result: '내일 오후 5:01 PM KST 런칭 예약 완료',
    url: 'https://www.producthunt.com',
  },
  {
    platform: '.well-known',
    action: 'deploy',
    result: 'mcp-server-card.json 배포 완료',
    url: 'https://karena.fieldnine.io/.well-known/mcp-server-card.json',
  },
  {
    platform: 'Vercel',
    action: 'deploy',
    result: '41번째 배포 완료 - AI-native identity overhaul',
    url: 'https://karena.fieldnine.io',
  },
  {
    platform: 'Supabase',
    action: 'data',
    result: '실데이터 확인 - agents:16, volume:$1.6M',
    url: 'https://karena.fieldnine.io/api/stats',
  },
]

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or key env vars' }, { status: 503 })
  }

  const restBase = supabaseUrl.endsWith('/rest/v1')
    ? supabaseUrl
    : `${supabaseUrl}/rest/v1`

  const h = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  // Check for existing rows to avoid re-seeding
  try {
    const checkRes = await fetch(`${restBase}/marketing_logs?select=id&limit=1`, {
      headers: h,
      signal: AbortSignal.timeout(6000),
    })
    if (checkRes.ok) {
      const rows = await checkRes.json()
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ ok: true, message: 'Already seeded', existing: rows.length })
      }
    } else {
      const errText = await checkRes.text()
      // Table doesn't exist — return instructions
      return NextResponse.json({
        ok: false,
        error: `Table check failed (${checkRes.status}): ${errText}`,
        fix: 'Run the SQL below in Supabase SQL Editor',
        sql: `CREATE TABLE IF NOT EXISTS marketing_logs (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT '',
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE marketing_logs DISABLE ROW LEVEL SECURITY;`,
        dashboard: 'https://supabase.com/dashboard/project/gflbuujjotqpflrbgtpd/sql/new',
      }, { status: 500 })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: `Check error: ${String(e)}` }, { status: 500 })
  }

  // Insert seed rows
  const results: { platform: string; ok: boolean; status?: number; error?: string }[] = []

  for (const row of SEED_LOGS) {
    try {
      const res = await fetch(`${restBase}/marketing_logs`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(row),
        signal: AbortSignal.timeout(6000),
      })
      if (res.ok || res.status === 201) {
        results.push({ platform: row.platform, ok: true })
      } else {
        const err = await res.text()
        results.push({ platform: row.platform, ok: false, status: res.status, error: err })
      }
    } catch (e) {
      results.push({ platform: row.platform, ok: false, error: String(e) })
    }
  }

  const inserted = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok)

  return NextResponse.json({
    ok: inserted > 0,
    inserted,
    failed: failed.length,
    errors: failed.length > 0 ? failed : undefined,
    message: `Seeded ${inserted}/${SEED_LOGS.length} marketing log entries`,
  })
}
