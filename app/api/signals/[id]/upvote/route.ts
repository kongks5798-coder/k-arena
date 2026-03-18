import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'no-db' }, { status: 503 })
  }

  const h = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }

  // Fetch current upvotes
  const getRes = await fetch(
    `${supabaseUrl}/rest/v1/signals?id=eq.${encodeURIComponent(id)}&select=upvotes&limit=1`,
    { headers: h, signal: AbortSignal.timeout(3000) }
  ).catch(() => null)

  if (!getRes?.ok) {
    return NextResponse.json({ ok: false, error: 'signal_not_found' }, { status: 404 })
  }

  const data = await getRes.json()
  const current = Number(data?.[0]?.upvotes ?? 0)

  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/signals?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ upvotes: current + 1 }),
      signal: AbortSignal.timeout(3000),
    }
  ).catch(() => null)

  return NextResponse.json({ ok: patchRes?.ok ?? false, upvotes: current + 1 })
}
