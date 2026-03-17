import { NextResponse, NextRequest } from 'next/server'

// 메모리 기반 알림 저장 (실제로는 Supabase 저장)
const alertsStore: Record<string, unknown>[] = []

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agent_id')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

  if (url && key) {
    try {
      let endpoint = `${url}/rest/v1/alerts?select=*&order=created_at.desc&limit=50`
      if (agentId) endpoint += `&agent_id=eq.${agentId}`
      const r = await fetch(endpoint, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      })
      if (r.ok) {
        const data = await r.json()
        if (Array.isArray(data)) {
          return NextResponse.json({ alerts: data, count: data.length, source: 'supabase' }, {
            headers: { 'Access-Control-Allow-Origin': '*' },
          })
        }
      }
    } catch { /* fallback */ }
  }

  // 메모리 폴백
  const filtered = agentId ? alertsStore.filter(a => a.agent_id === agentId) : alertsStore
  return NextResponse.json({ alerts: filtered, count: filtered.length, source: 'memory' }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, pair, condition, target_price, notification_type = 'once' } = body

    if (!pair || !condition || !target_price) {
      return NextResponse.json({ error: 'Required: pair, condition (above|below), target_price' }, { status: 400 })
    }

    const alert = {
      id: `ALT-${Date.now()}`,
      agent_id: agent_id || 'anonymous',
      pair,
      condition, // 'above' | 'below'
      target_price: parseFloat(target_price),
      notification_type, // 'once' | 'always'
      status: 'active',
      triggered: false,
      created_at: new Date().toISOString(),
    }

    // Supabase 저장 시도
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
    if (url && key) {
      await fetch(`${url}/rest/v1/alerts`, {
        method: 'POST',
        headers: {
          apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal',
        },
        body: JSON.stringify(alert),
        signal: AbortSignal.timeout(3000),
      }).catch(() => alertsStore.unshift(alert))
    } else {
      alertsStore.unshift(alert)
    }

    return NextResponse.json({ ok: true, alert }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (url && key) {
    await fetch(`${url}/rest/v1/alerts?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    }).catch(() => {})
  }

  const idx = alertsStore.findIndex(a => a.id === id)
  if (idx > -1) alertsStore.splice(idx, 1)

  return NextResponse.json({ ok: true, deleted_id: id }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
