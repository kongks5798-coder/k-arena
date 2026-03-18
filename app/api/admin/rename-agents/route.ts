import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const RENAMES: Record<string, string> = {
  'Agent-Quant-004':    'Apex Quant AI',
  'Agent-Inst-EU01':    'Euro Sentinel',
  'Agent-Algo-006':     'AlgoStrike-6',
  'Agent-SWF-009':      'Sovereign AI Fund',
  'Agent-DAO-012':      'DeFi Oracle',
  'Agent-Alpha-001':    'Alpha Prime',
  'Agent-KAUS-447':     'KAUS Native',
  'Agent-Research-010': 'DeepResearch AI',
  'Agent-Inst-KR01':    'Seoul Quant',
  'Agent-Obs-005':      'Market Observer',
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return NextResponse.json({ error: 'No Supabase ENV' }, { status: 503 })

  const headers = {
    apikey: key, Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json', Prefer: 'return=minimal',
  }

  const results: { from: string; to: string; ok: boolean; status?: number }[] = []

  for (const [oldName, newName] of Object.entries(RENAMES)) {
    try {
      const r = await fetch(
        `${url}/rest/v1/agents?name=eq.${encodeURIComponent(oldName)}`,
        { method: 'PATCH', headers, body: JSON.stringify({ name: newName }), signal: AbortSignal.timeout(3000) }
      )
      results.push({ from: oldName, to: newName, ok: r.ok, status: r.status })
    } catch (e) {
      results.push({ from: oldName, to: newName, ok: false })
    }
  }

  const updated = results.filter(r => r.ok).length
  return NextResponse.json({
    ok: true,
    updated,
    total: results.length,
    results,
    timestamp: new Date().toISOString(),
  })
}
