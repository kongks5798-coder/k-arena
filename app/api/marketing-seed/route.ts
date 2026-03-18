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

async function ensureTable(supabaseUrl: string, serviceKey: string): Promise<{ ok: boolean; method: string; error?: string }> {
  // Try Supabase pg-meta SQL API (requires service role key)
  const pgMetaUrl = supabaseUrl.replace('/rest/v1', '') + '/pg-meta/v0/query'
  const createSQL = `
    CREATE TABLE IF NOT EXISTS marketing_logs (
      id BIGSERIAL PRIMARY KEY,
      platform TEXT NOT NULL,
      action TEXT NOT NULL,
      result TEXT NOT NULL DEFAULT '',
      url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE marketing_logs DISABLE ROW LEVEL SECURITY;
  `
  try {
    const res = await fetch(pgMetaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: createSQL }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) return { ok: true, method: 'pg-meta' }
    const err = await res.text()
    return { ok: false, method: 'pg-meta', error: err }
  } catch (e) {
    return { ok: false, method: 'pg-meta', error: String(e) }
  }
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'No DB config' }, { status: 503 })
  }

  const h = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  // Check if table exists — if not, try to create it
  let tableReady = false
  try {
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/marketing_logs?select=id&limit=1`,
      { headers: h, signal: AbortSignal.timeout(5000) }
    )
    if (checkRes.ok) {
      tableReady = true
      const existing = await checkRes.json()
      if (existing.length > 0) {
        return NextResponse.json({
          ok: true,
          message: 'Already seeded — marketing_logs has existing data',
          existing_count: existing.length,
        })
      }
    } else {
      // Table likely doesn't exist — try to create it
      if (serviceKey) {
        const createResult = await ensureTable(supabaseUrl, serviceKey)
        if (createResult.ok) {
          tableReady = true
        } else {
          return NextResponse.json({
            ok: false,
            error: 'Table does not exist and auto-create failed',
            create_error: createResult.error,
            manual_sql: `CREATE TABLE IF NOT EXISTS marketing_logs (
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
      }
    }
  } catch {}

  if (!tableReady) {
    return NextResponse.json({ ok: false, error: 'Could not verify table state' }, { status: 500 })
  }

  // Insert seed rows
  const results: { platform: string; ok: boolean; error?: string }[] = []

  for (const row of SEED_LOGS) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/marketing_logs`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(row),
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        results.push({ platform: row.platform, ok: true })
      } else {
        const err = await res.text()
        results.push({ platform: row.platform, ok: false, error: err })
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
