import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// One-time migration endpoint — protected by CRON_SECRET or hardcoded token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== 'k-arena-migrate-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      error: 'SUPABASE_SERVICE_ROLE_KEY not set in environment',
      hint: 'Add it in Vercel Dashboard → Settings → Environment Variables',
      get_key_from: 'https://supabase.com/dashboard/project/wolghzihgudmpukvcucp/settings/api → service_role (secret)',
    }, { status: 500 })
  }

  const h = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }

  const steps: { step: string; ok: boolean; detail?: string }[] = []

  // 1. Create agent_wallets table via rpc or direct SQL
  // Use supabase Management API
  const projectRef = 'wolghzihgudmpukvcucp'
  const managementRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          DROP TABLE IF EXISTS agent_wallets;
          CREATE TABLE agent_wallets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            agent_id UUID NOT NULL UNIQUE,
            kaus_balance DECIMAL(20,6) NOT NULL DEFAULT 100.0,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          ALTER TABLE agent_wallets DISABLE ROW LEVEL SECURITY;
          INSERT INTO agent_wallets (agent_id, kaus_balance)
          SELECT id::UUID, 100.0 FROM agents
          ON CONFLICT (agent_id) DO NOTHING;
        `
      }),
      signal: AbortSignal.timeout(15000),
    }
  ).catch(e => ({ ok: false, status: 500, text: async () => String(e) }))

  const mgmtText = await (managementRes as Response).text()
  const mgmtOk = (managementRes as Response).ok

  steps.push({ step: 'management_api', ok: mgmtOk, detail: mgmtText.slice(0, 300) })

  if (!mgmtOk) {
    // Fallback: try service role direct insert to verify key works at least
    const testRes = await fetch(`${supabaseUrl}/rest/v1/agent_wallets?limit=1`, {
      headers: h,
      signal: AbortSignal.timeout(3000),
    }).catch(() => null)
    if (testRes?.ok) {
      steps.push({ step: 'table_already_exists', ok: true })
    }
  }

  // 2. Verify table now exists
  const verifyRes = await fetch(`${supabaseUrl}/rest/v1/agent_wallets?limit=5&select=agent_id,kaus_balance`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    signal: AbortSignal.timeout(3000),
  }).catch(() => null)

  let rows: unknown[] = []
  if (verifyRes?.ok) {
    rows = await verifyRes.json()
    steps.push({ step: 'verify_table', ok: true, detail: `${rows.length} rows` })
  } else {
    const verifyText = verifyRes ? await verifyRes.text() : 'fetch failed'
    steps.push({ step: 'verify_table', ok: false, detail: verifyText.slice(0, 200) })
  }

  const allOk = steps.every(s => s.ok)
  return NextResponse.json({ ok: allOk, steps, rows }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
