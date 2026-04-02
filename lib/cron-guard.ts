/**
 * 크론 실행 전 활성 에이전트 존재 여부 확인
 * 에이전트가 없으면 크론을 즉시 skip — 불필요한 Vercel 비용 방지
 */
export async function hasActiveAgents(): Promise<boolean> {
  const sb  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_KEY  ?? '').trim()
  if (!sb || !key) return false

  try {
    const res = await fetch(
      `${sb}/rest/v1/agents?select=id&is_active=eq.true&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(3000),
      }
    )
    if (!res.ok) return false
    const data: unknown[] = await res.json()
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

/** CRON_SECRET 헤더 검증 */
export function verifyCronSecret(req: Request): boolean {
  const auth = req.headers.get('authorization')
  if (process.env.NODE_ENV !== 'production') return true
  return auth === `Bearer ${process.env.CRON_SECRET}`
}
