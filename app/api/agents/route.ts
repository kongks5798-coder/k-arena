import { NextResponse } from 'next/server'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getDB() {
  if (!SB_URL || !SB_KEY) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(SB_URL, SB_KEY)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const db = getDB()

  if (!db) {
    return NextResponse.json({
      ok: true, mode: 'demo',
      agents: [
        { id: '1', name: 'GPT-5 Treasury',  type: 'AI Trading Agent',       is_genesis: true  },
        { id: '2', name: 'KR-GOV-001',       type: 'Government Institution', is_genesis: true  },
        { id: '3', name: 'DeepSeek R3',      type: 'Hedge Fund AI',          is_genesis: false },
      ], count: 3,
    })
  }

  const { data, error } = await db.from('agents').select('id,name,type,is_genesis,created_at').limit(limit)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, agents: data, count: data?.length ?? 0 })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, wallet_address } = body
    if (!name || !type) return NextResponse.json({ ok: false, error: 'name and type required' }, { status: 400 })

    const apiKey    = `ka_live_${crypto.randomUUID().replace(/-/g,'').slice(0,48)}`
    const secretKey = `sk_live_${crypto.randomUUID().replace(/-/g,'').slice(0,48)}`
    const db = getDB()

    if (!db) {
      return NextResponse.json({
        ok: true, mode: 'demo',
        agent: { id: crypto.randomUUID(), name, type, wallet_address, is_genesis: false },
        credentials: { api_key: apiKey, secret_key: secretKey, note: 'Demo — connect Supabase to persist' },
      }, { status: 201 })
    }

    const { data, error } = await db.from('agents').insert({
      name, type,
      wallet_address: wallet_address ?? `0x${crypto.randomUUID().replace(/-/g,'')}`,
      api_key: apiKey, secret_key_hash: secretKey, is_active: true,
    }).select().single()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, agent: data, credentials: { api_key: apiKey, secret_key: secretKey } }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }
}
