import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // 시뮬레이션 비활성화 — 가짜 트랜잭션/통계 생성 금지
  // 실제 AI 에이전트가 /api/exchange POST로 거래해야 데이터가 쌓임
  return NextResponse.json({
    status: 'disabled',
    reason: 'Simulation mode disabled. Real transactions only via /api/exchange.',
    timestamp: new Date().toISOString(),
  })
}
