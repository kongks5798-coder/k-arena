import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SK = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H = () => ({ apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')

  if (!SB || !SK) return NextResponse.json({ error: 'db_not_configured' }, { status: 500 })

  const url = name
    ? `${SB}/rest/v1/api_key_registry?name=eq.${encodeURIComponent(name)}&order=created_at.desc&limit=20`
    : `${SB}/rest/v1/api_key_registry?order=created_at.desc&limit=50`

  const res = await fetch(url, { headers: H(), signal: AbortSignal.timeout(3000) }).catch(() => null)
  if (!res?.ok) return NextResponse.json({ keys: [] })
  const keys = await res.json().catch(() => [])
  // Never return the actual key value — mask it
  const masked = keys.map((k: Record<string, unknown>) => ({
    ...k,
    api_key: String(k.api_key ?? '').slice(0, 8) + '••••••••••••••••••••••••',
  }))
  return NextResponse.json({ keys: masked })
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string } = {}
  try { body = await req.json() } catch {}

  const { name, email } = body
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const apiKey = `karena_${randomUUID().replace(/-/g, '').slice(0, 32)}`

  if (SB && SK) {
    const res = await fetch(`${SB}/rest/v1/api_key_registry`, {
      method: 'POST',
      headers: H(),
      body: JSON.stringify({ name, email: email ?? null, api_key: apiKey, calls_today: 0, calls_total: 0 }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => null)
    // If table doesn't exist, still return the key so the page works
    if (!res?.ok) {
      return NextResponse.json({
        api_key: apiKey,
        name,
        note: 'DB table not yet created. Run /api/tournament/create Supabase SQL to set up api_key_registry table.',
      })
    }
  }

  return NextResponse.json({
    api_key: apiKey,
    name,
    created_at: new Date().toISOString(),
    rate_limit: '60 requests/min',
    docs: 'https://karena.fieldnine.io/docs',
  })
}
