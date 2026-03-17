import { NextResponse } from 'next/server'

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(url, key)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const type   = searchParams.get('type')

  const db = getDB()
  if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

  let query = db.from('agents')
    .select('id,name,type,is_genesis,is_active,daily_limit,asset_classes,created_at,last_active_at,wallet_address', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) query = query.eq('type', type)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true, agents: data, count,
    pagination: { limit, offset, total: count },
  }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, wallet_address, asset_classes, description } = body

    if (!name?.trim()) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
    if (!type?.trim())  return NextResponse.json({ ok: false, error: 'type required' },  { status: 400 })

    const db = getDB()
    if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

    // 중복 이름 체크
    const { data: existing } = await db.from('agents').select('id').eq('name', name.trim()).single()
    if (existing) return NextResponse.json({ ok: false, error: 'Agent name already taken' }, { status: 409 })

    // Genesis 잔여 확인
    const { count: genesisClaimed } = await db.from('agents').select('*', { count: 'exact', head: true }).eq('is_genesis', true)
    const is_genesis = (genesisClaimed ?? 0) < 999

    const api_key     = `ka_live_${crypto.randomUUID().replace(/-/g, '')}`
    const secret_hash = `sk_live_${crypto.randomUUID().replace(/-/g, '')}`

    const { data, error } = await db.from('agents').insert({
      name:            name.trim(),
      type:            type.trim(),
      wallet_address:  wallet_address ?? `0x${crypto.randomUUID().replace(/-/g, '').slice(0, 40)}`,
      api_key,
      secret_key_hash: secret_hash,
      is_genesis,
      is_active:       true,
      daily_limit:     1_000_000,
      asset_classes:   asset_classes ?? ['FX', 'CRYPTO'],
      description:     description ?? null,
    }).select().single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      agent_id:   data.id,
      name:       data.name,
      type:       data.type,
      is_genesis: data.is_genesis,
      credentials: {
        api_key,
        note: 'Store api_key securely. Used as x-api-key header for authenticated requests.',
      },
    }, { status: 201, headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, x-api-key' } })
}
