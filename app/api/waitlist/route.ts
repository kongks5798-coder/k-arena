import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const SB  = () => (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
const KEY = () => (process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '').trim()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOTAL_SLOTS = 999

export async function GET() {
  const sb = SB(); const key = KEY()
  if (!sb || !key) return NextResponse.json({ ok: false, reason: 'no-db' })

  try {
    const res = await fetch(
      `${sb}/rest/v1/waitlist?select=id&order=joined_at.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(4000) }
    )
    const data: unknown[] = res.ok ? await res.json() : []
    const count = Array.isArray(data) ? data.length : 0
    return NextResponse.json({
      ok: true,
      count,
      remaining: Math.max(0, TOTAL_SLOTS - count),
      total: TOTAL_SLOTS,
    })
  } catch {
    return NextResponse.json({ ok: true, count: 0, remaining: TOTAL_SLOTS, total: TOTAL_SLOTS })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, role } = body

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, reason: '유효한 이메일을 입력하세요.' }, { status: 400 })
    }

    const sb = SB(); const key = KEY()
    if (!sb || !key) return NextResponse.json({ ok: false, reason: 'no-db' }, { status: 500 })

    const h = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }

    // 중복 체크
    const checkRes = await fetch(
      `${sb}/rest/v1/waitlist?email=eq.${encodeURIComponent(email)}&select=slot_number`,
      { headers: h, signal: AbortSignal.timeout(4000) }
    )
    if (checkRes.ok) {
      const existing: Array<{ slot_number: number }> = await checkRes.json()
      if (existing.length > 0) {
        return NextResponse.json({
          ok: false,
          reason: `이미 등록된 이메일입니다. (대기번호 #${existing[0].slot_number})`,
        }, { status: 409 })
      }
    }

    // 슬롯 초과 체크
    const countRes = await fetch(
      `${sb}/rest/v1/waitlist?select=id`,
      { headers: h, signal: AbortSignal.timeout(4000) }
    )
    const countData: unknown[] = countRes.ok ? await countRes.json() : []
    const currentCount = Array.isArray(countData) ? countData.length : 0
    if (currentCount >= TOTAL_SLOTS) {
      return NextResponse.json({ ok: false, reason: '모든 슬롯이 마감되었습니다.' }, { status: 400 })
    }

    // DB INSERT
    const insertRes = await fetch(`${sb}/rest/v1/waitlist`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        role: role || 'individual',
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      if (errText.includes('duplicate') || errText.includes('unique')) {
        return NextResponse.json({ ok: false, reason: '이미 등록된 이메일입니다.' }, { status: 409 })
      }
      return NextResponse.json({ ok: false, reason: '등록 실패. 다시 시도해주세요.' }, { status: 500 })
    }

    const inserted: Array<{ slot_number: number }> = await insertRes.json()
    const slotNumber = inserted[0]?.slot_number ?? currentCount + 1

    // Resend 이메일 발송 (RESEND_API_KEY 없으면 skip)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: 'K-Arena <noreply@karena.fieldnine.io>',
          to: email,
          subject: `K-Arena Genesis Waitlist #${slotNumber} 등록 완료`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0a0e27;color:#ffffff;font-family:'IBM Plex Mono',monospace;padding:40px 24px;max-width:520px;margin:0 auto;">
  <div style="border:1px solid rgba(0,255,136,0.3);padding:32px;">
    <div style="font-size:11px;color:#00ff88;letter-spacing:0.2em;margin-bottom:20px;">K-ARENA · GENESIS 999</div>
    <h1 style="font-size:28px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;">Waitlist Confirmed</h1>
    <div style="font-size:13px;color:#888;margin-bottom:32px;">대기번호 <span style="color:#00ff88;font-weight:700;">#${slotNumber}</span> · ${TOTAL_SLOTS - slotNumber}개 슬롯 남음</div>

    <div style="background:#111827;border:1px solid rgba(255,255,255,0.08);padding:20px;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px;">
        <span style="color:#666;">이메일</span>
        <span>${email}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px;">
        <span style="color:#666;">대기번호</span>
        <span style="color:#00ff88;">#${slotNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;">
        <span style="color:#666;">혜택</span>
        <span>Zero Fee · Governance · Airdrop</span>
      </div>
    </div>

    <div style="font-size:10px;color:#555;line-height:1.8;">
      런칭 시 이 이메일로 먼저 안내드립니다.<br>
      K-Arena는 AI 에이전트 시뮬레이션 플랫폼입니다. 실제 금융 서비스가 아닙니다.
    </div>
  </div>
</body>
</html>
          `,
        })
      } catch {
        // 이메일 실패해도 등록은 성공으로 처리
      }
    }

    return NextResponse.json({
      ok: true,
      slot_number: slotNumber,
      remaining: TOTAL_SLOTS - slotNumber,
      message: `Genesis Waitlist #${slotNumber} 등록 완료!`,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, reason: String(e) }, { status: 500 })
  }
}
