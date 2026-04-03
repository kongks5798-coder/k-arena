'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

const TOTAL = 999

const BENEFITS = [
  { icon: '◈', title: 'Zero Platform Fee',      desc: '플랫폼 수수료 면제 · 시뮬레이션 전 거래 적용' },
  { icon: '◎', title: 'Priority Order Routing', desc: '우선 주문 처리 · 평균 응답 목표 < 0.8s' },
  { icon: '▦', title: 'Governance Voting',       desc: '1 Genesis = 100x 의결권 · 프로토콜 의사결정 참여' },
  { icon: '◉', title: 'Fee Pool Participation', desc: '수수료 배분 풀 참여 자격 · 약관 적용' },
  { icon: '◑', title: 'KAUS Airdrop',            desc: '런칭 시 10,000 KAUS 에어드랍 우선 배정' },
]

const ROLES = [
  { value: 'individual',   label: 'Individual Investor' },
  { value: 'institution',  label: 'Institutional' },
  { value: 'developer',    label: 'Developer / Builder' },
  { value: 'dao',          label: 'DAO / Protocol' },
  { value: 'researcher',   label: 'Researcher' },
]

export default function GenesisPage() {
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [role, setRole]     = useState('individual')
  const [count, setCount]   = useState<number | null>(null)
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string; slot?: number } | null>(null)

  useEffect(() => {
    fetch('/api/waitlist')
      .then(r => r.json())
      .then(d => { if (d.ok) setCount(d.count ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const joined = count ?? 0
  const remaining = TOTAL - joined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role }),
      })
      const d = await res.json()
      if (d.ok) {
        setResult({ ok: true, msg: d.message, slot: d.slot_number })
        setCount(c => (c ?? 0) + 1)
        setEmail('')
        setName('')
      } else {
        setResult({ ok: false, msg: d.reason ?? '등록 실패. 다시 시도해주세요.' })
      }
    } catch {
      setResult({ ok: false, msg: '서버 오류가 발생했습니다.' })
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', flexDirection: 'column' }}>
      <Topbar rightContent={
        <div style={{ fontSize: 9, fontFamily: 'IBM Plex Mono', color: remaining > 100 ? 'var(--amber)' : 'var(--red)', border: '1px solid currentColor', padding: '3px 12px' }}>
          {loading ? '...' : `● ${remaining} SLOTS LEFT`}
        </div>
      }/>

      {/* Hero */}
      <div style={{ background: 'var(--surface)', padding: '48px 28px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.25em', marginBottom: 14 }}>FOUNDING MEMBERSHIP · LIMITED TO 999</div>
        <h1 style={{ fontSize: 48, fontWeight: 600, color: 'var(--white)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>GENESIS 999</h1>
        <p style={{ fontSize: 13, color: 'var(--dimmer)', marginTop: 12, maxWidth: 420, margin: '12px auto 0' }}>
          K-Arena 런칭 전 얼리 액세스 대기자 명단.<br/>이메일 등록만으로 Genesis 멤버십 확보.
        </p>
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          {[
            { val: loading ? '...' : joined.toString(),                              lbl: 'REGISTERED' },
            { val: loading ? '...' : remaining.toString(),                           lbl: 'REMAINING' },
            { val: loading ? '...' : ((joined / TOTAL) * 100).toFixed(1) + '%',     lbl: 'FILLED' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '14px 28px', border: '1px solid var(--border-mid)', borderLeft: i > 0 ? 'none' : undefined }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--white)', lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.2em', marginTop: 4 }}>{item.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, maxWidth: 1100 }}>

            {/* Left: progress bar + benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Progress */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.18em', marginBottom: 14 }}>WAITLIST PROGRESS · {TOTAL} TOTAL</div>
                <div style={{ background: 'var(--surface-3)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', background: 'var(--green)', width: `${(joined / TOTAL) * 100}%`, transition: 'width 0.6s ease', borderRadius: 3 }}/>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {Array.from({ length: 100 }, (_, i) => {
                    const filled = i < Math.floor((joined / TOTAL) * 100)
                    const isNext = i === Math.floor((joined / TOTAL) * 100)
                    return <div key={i} style={{ width: 9, height: 9, background: filled ? 'var(--white)' : isNext ? 'var(--green)' : 'var(--surface-3)', borderRadius: 1 }}/>
                  })}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  {[['var(--white)', 'Registered'], ['var(--green)', 'Next'], ['var(--surface-3)', 'Available']].map(([color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'var(--dimmer)' }}>
                      <div style={{ width: 9, height: 9, background: color, borderRadius: 1 }}/>{label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.18em', marginBottom: 14 }}>GENESIS BENEFITS</div>
                {BENEFITS.map(b => (
                  <div key={b.title} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 14, flexShrink: 0, width: 24 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--white)', marginBottom: 2 }}>{b.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.5 }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12, fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.7 }}>
                  * 시뮬레이션 플랫폼입니다. 실제 금융 서비스가 아닙니다. 혜택은 약관에 따릅니다.
                </div>
              </div>
            </div>

            {/* Right: waitlist form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ background: 'var(--surface-3)', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>Join Genesis Waitlist</div>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 4 }}>
                    SLOT #{joined + 1} · {remaining} REMAINING
                  </div>
                </div>

                {result?.ok ? (
                  // 성공 화면
                  <div style={{ padding: 28, textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>
                      Genesis #{result.slot} 확보!
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--dimmer)', lineHeight: 1.7, marginBottom: 20 }}>
                      확인 이메일이 발송되었습니다.<br/>
                      런칭 시 먼저 안내드리겠습니다.
                    </div>
                    <div style={{ padding: '10px 16px', border: '1px solid rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.04)', fontSize: 10, color: 'var(--dimmer)' }}>
                      대기번호 <span style={{ color: 'var(--green)', fontWeight: 700 }}>#{result.slot}</span> / {TOTAL}
                    </div>
                  </div>
                ) : (
                  // 폼
                  <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 6 }}>이메일 *</div>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 6 }}>이름 (선택)</div>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Hong Gildong"
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11, boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.12em', marginBottom: 6 }}>역할</div>
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                      >
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>

                    <div style={{ padding: '10px 12px', border: '1px solid rgba(0,255,136,0.2)', background: 'rgba(0,255,136,0.04)' }}>
                      <div style={{ fontSize: 9, color: 'var(--green)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4 }}>무료 등록 · 카드 불필요</div>
                      <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.6 }}>
                        이메일만으로 Genesis 슬롯 확보.<br/>런칭 시 먼저 초대장을 보내드립니다.
                      </div>
                    </div>

                    {result && !result.ok && (
                      <div style={{ border: '1px solid var(--red)', padding: '10px 12px', background: 'var(--red-dim)', fontSize: 10, color: 'var(--red)' }}>
                        ✗ {result.msg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || remaining === 0}
                      style={{ width: '100%', padding: 13, background: submitting || remaining === 0 ? 'var(--surface-3)' : 'var(--white)', color: submitting || remaining === 0 ? 'var(--dimmer)' : 'var(--black)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: submitting || remaining === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {submitting ? 'REGISTERING...' : remaining === 0 ? 'SOLD OUT' : `JOIN WAITLIST #${joined + 1} →`}
                    </button>

                    <div style={{ fontSize: 9, color: 'var(--dimmer)', textAlign: 'center', lineHeight: 1.7 }}>
                      스팸 없음 · 언제든 취소 가능 · 실제 결제 없음
                    </div>
                  </form>
                )}
              </div>

              {/* 왜 지금? */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 16 }}>
                <div style={{ fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.15em', marginBottom: 12 }}>WHY JOIN NOW</div>
                {[
                  ['#1', '999개 한정 슬롯 — 선착순 마감'],
                  ['#2', '런칭 즉시 Zero Fee 적용'],
                  ['#3', 'KAUS 토큰 에어드랍 우선 배정'],
                  ['#4', 'AI 에이전트 베타 테스트 우선 접근'],
                ].map(([num, desc]) => (
                  <div key={num} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: 'IBM Plex Mono', flexShrink: 0, paddingTop: 1 }}>{num}</span>
                    <span style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
