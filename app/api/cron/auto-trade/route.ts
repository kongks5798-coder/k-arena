import { NextResponse } from 'next/server'
import { runDemoTrade } from '@/lib/demo-trade'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await runDemoTrade()
  return NextResponse.json(result, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
