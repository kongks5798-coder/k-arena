import { NextResponse } from 'next/server'

// 간단한 메모리 카운터 (Supabase 없을 때 fallback)
let memoryViews = 0

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/platform_stats?key=eq.deck_views&select=value`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      })
      const d = await r.json()
      return NextResponse.json({ views: d[0]?.value || memoryViews }, { headers: { 'Access-Control-Allow-Origin': '*' } })
    } catch {}
  }
  return NextResponse.json({ views: memoryViews }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function POST() {
  memoryViews++
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      // upsert deck view count
      await fetch(`${supabaseUrl}/rest/v1/platform_stats`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ key: 'deck_views', value: memoryViews })
      })
    } catch {}
  }
  return NextResponse.json({ ok: true, views: memoryViews })
}
