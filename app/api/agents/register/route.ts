import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

export async function POST(req: Request) {
  try {
    const { name, strategy, initial_deposit } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Agent name must be at least 2 characters' }, { status: 400 })
    }
    if (!strategy || typeof strategy !== 'string' || strategy.trim().length < 10) {
      return NextResponse.json({ error: 'Strategy description must be at least 10 characters' }, { status: 400 })
    }
    const deposit = parseFloat(initial_deposit)
    if (isNaN(deposit) || deposit < 10) {
      return NextResponse.json({ error: 'Minimum initial deposit is 10 KAUS' }, { status: 400 })
    }

    const apiKey = 'ka_' + randomBytes(24).toString('hex')

    if (!SB || !KEY) {
      // No DB — return generated key anyway (demo mode)
      return NextResponse.json({
        ok: true,
        agent_id: 'AGT-' + Math.floor(Math.random() * 9000 + 1000),
        api_key: apiKey,
        name: name.trim(),
        initial_deposit: deposit,
        mode: 'demo',
      })
    }

    // 1. Insert agent
    const agRes = await fetch(`${SB}/rest/v1/agents`, {
      method: 'POST',
      headers: H(),
      body: JSON.stringify({
        name: name.trim(),
        type: 'AI Trading Agent',
        org: 'External',
        is_active: true,
        is_genesis: false,
        initial_balance: deposit,
        api_key: apiKey,
        trades: 0,
        accuracy: 0,
        status: 'IDLE',
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!agRes.ok) {
      const err = await agRes.text()
      // Duplicate name
      if (err.includes('duplicate') || err.includes('unique')) {
        return NextResponse.json({ error: 'An agent with this name already exists' }, { status: 409 })
      }
      throw new Error('Failed to insert agent: ' + err)
    }

    const agents = await agRes.json()
    const agent = Array.isArray(agents) ? agents[0] : agents

    // 2. Create wallet
    await fetch(`${SB}/rest/v1/agent_wallets`, {
      method: 'POST',
      headers: { ...H(), Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify({
        agent_id: agent.id,
        kaus_balance: deposit,
        total_earned: 0,
      }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => null)

    return NextResponse.json({
      ok: true,
      agent_id: agent.id,
      api_key: apiKey,
      name: agent.name,
      initial_deposit: deposit,
    }, { headers: { 'Access-Control-Allow-Origin': '*' } })

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
