import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface LogEntry {
  platform: string
  action: string
  result: string
  url?: string
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'No DB', logs: [] })
  }

  const h = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/marketing_logs?select=*&order=created_at.desc&limit=100`,
      { headers: h, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, error: err, logs: [] })
    }
    const logs = await res.json()
    return NextResponse.json({ ok: true, logs, count: logs.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), logs: [] })
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'No DB' }, { status: 503 })
  }

  let body: LogEntry
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { platform, action, result, url } = body
  if (!platform || !action) {
    return NextResponse.json({ ok: false, error: 'platform and action required' }, { status: 400 })
  }

  const h = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/marketing_logs`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ platform, action, result: result ?? '', url: url ?? null }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, error: err }, { status: 500 })
    }
    const data = await res.json()
    return NextResponse.json({ ok: true, log: data[0] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
