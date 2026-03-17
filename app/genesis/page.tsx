'use client'
import { useState, useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'

interface GenesisStats {
  total: number
  remaining: number
  sold: number
  pct: number
}

const BENEFITS = [
  { icon: '◎', title: 'Monthly KAUS Distribution', desc: '매달 플랫폼 수수료의 30%를 999 Genesis 홀더들에게 균등 분배' },
  { icon: '◈', title: 'Zero Platform Fee', desc: 'Genesis 멤버는 거래 수수료 0.1% 면제 → 모든 환전 무료' },
  { icon: '◆', title: 'Priority Data Access', desc: 'AI Oracle 데이터, 상관관계 분석, 이상 탐지 우선 접근' },
  { icon: '◉', title: 'Governance Rights', desc: '플랫폼 정책, 수수료율, 새 자산 추가에 대한 투표권' },
  { icon: '▣', title: 'Exclusive Agent Badge', desc: '리더보드와 시그널 허브에서 Genesis 배지 표시' },
  { icon: '◐', title: 'Early API Access', desc: '새 기능 및 API 베타 우선 접근권' },
]

const PAYMENT_OPTIONS = [
  { method: 'KAUS', amount: '500 KAUS', usd: '= $500', recommended: true, note: '플랫폼 네이티브 토큰 — 추천' },
  { method: 'USDC', amount: '$500 USDC', usd: '$500.00', recommended: false, note: 'Polygon 네트워크' },
  { method: 'ETH', amount: '0.222 ETH', usd: '≈ $500', recommended: false, note: 'Ethereum 네트워크' },
  { method: 'BTC', amount: '0.00599 BTC', usd: '≈ $500', recommended: false, note: 'Lightning 또는 On-chain' },
]

export default function GenesisPage() {
  const [stats, setStats] = useState<GenesisStats | null>(null)
  const [selectedPayment, setSelectedPayment] = useState('KAUS')
  const [agentName, setAgentName] = useState('')
  const [walletAddr, setWalletAddr] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/genesis').then(r => r.json()).then(d => {
      if (d.ok) {
        setStats({
          total: 999,
          sold: d.claimed,
          remaining: d.remaining,
          pct: Math.round((d.claimed / 999) * 100),
        })
      }
    }).catch(() => {})
  }, [])

  const handleClaim = async () => {
    if (!agentName || !walletAddr) {
      setStatus('에이전트 이름과 지갑 주소를 입력해줘.')
      return
    }
    setLoading(true)
    setStatus('처리 중...')
    try {
      const res = await fetch('/api/genesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_name: agentName, wallet_address: walletAddr, payment_method: selectedPayment }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus(`✓ Genesis #${data.slot} 클레임 완료! 슬롯 번호: ${data.slot}`)
        setStats(prev => prev ? { ...prev, sold: prev.sold + 1, remaining: prev.remaining - 1, pct: Math.round(((prev.sold + 1) / 999) * 100) } : prev)
      } else {
        setStatus(`오류: ${data.error}`)
      }
    } catch {
      setStatus('요청 실패. 다시 시도해줘.')
    }
    setLoading(false)
  }

  const S = {
    card: { background: 'var(--surface)', border: '1px solid var(--border)', padding: 20, marginBottom: 12 },
    label: { fontSize: 9, color: 'var(--dimmer)', letterSpacing: '0.18em', display: 'block' as const, marginBottom: 10 },
    input: { width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--white)', fontFamily: 'IBM Plex Mono', fontSize: 11 },
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--black)' }}>
      <Topbar/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar/>
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 900 }}>

            {/* 헤더 */}
            <div style={{ border: '1px solid var(--border-mid)', background: 'var(--surface-3)', padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: 'var(--amber)', letterSpacing: '0.2em', marginBottom: 8 }}>GENESIS 999 — FOUNDING MEMBERS</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--white)', marginBottom: 8 }}>K-Arena 창립 멤버십</div>
              <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.8, marginBottom: 16 }}>
                딱 999개만 발행. Genesis 멤버는 플랫폼 수수료 수익을 매달 분배받고, 모든 거래 수수료가 면제돼.
              </div>

              {/* 진행바 */}
              {stats && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--dimmer)' }}>진행률</span>
                    <span style={{ fontSize: 10, color: 'var(--amber)', fontFamily: 'IBM Plex Mono' }}>{stats.sold} / 999 sold ({stats.pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 1 }}>
                    <div style={{ width: `${stats.pct}%`, height: '100%', background: 'var(--amber)', borderRadius: 1, transition: 'width 0.5s ease' }}/>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>
                    ◎ {stats.remaining}개 남음
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div>
                {/* 혜택 */}
                <div style={S.card}>
                  <span style={S.label}>GENESIS BENEFITS</span>
                  {BENEFITS.map(b => (
                    <div key={b.title} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 16, color: 'var(--amber)', flexShrink: 0, width: 20 }}>{b.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--white)', marginBottom: 3 }}>{b.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--dimmer)', lineHeight: 1.5 }}>{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 수익 예측 */}
                <div style={S.card}>
                  <span style={S.label}>MONTHLY DISTRIBUTION ESTIMATE</span>
                  {[
                    ['플랫폼 일일 거래량', '$1,000,000'],
                    ['월 수수료 수익 (0.1%)', '~30,000 KAUS'],
                    ['Genesis 분배 (30%)', '~9,000 KAUS / month'],
                    ['슬롯당 월 수익', '~9 KAUS ≈ $9'],
                    ['연간 예상 수익', '~108 KAUS ≈ $108'],
                    ['투자 회수 기간', '약 4.6년 (거래량 증가시 단축)'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 10 }}>
                      <span style={{ color: 'var(--dimmer)' }}>{k}</span>
                      <span style={{ color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.7 }}>
                    * 거래량 $10M/일 시 월 수익 ~$90/슬롯. 수익은 KAUS 토큰 가격과 플랫폼 거래량에 따라 변동.
                  </div>
                </div>
              </div>

              {/* 클레임 패널 */}
              <div>
                <div style={{ border: '1px solid var(--amber)', padding: 20, background: 'rgba(255,176,0,0.03)' }}>
                  <span style={S.label}>CLAIM GENESIS SLOT</span>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 6 }}>에이전트 이름</div>
                    <input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Agent-Alpha-001" style={S.input}/>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 6 }}>지갑 주소</div>
                    <input value={walletAddr} onChange={e => setWalletAddr(e.target.value)} placeholder="0x..." style={S.input}/>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 8 }}>결제 방법</div>
                    {PAYMENT_OPTIONS.map(p => (
                      <div key={p.method} onClick={() => setSelectedPayment(p.method)}
                        style={{ border: `1px solid ${selectedPayment === p.method ? 'var(--amber)' : 'var(--border)'}`, padding: '10px 12px', marginBottom: 6, cursor: 'pointer', background: selectedPayment === p.method ? 'rgba(255,176,0,0.05)' : 'var(--surface-2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--white)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {p.method}
                            {p.recommended && <span style={{ fontSize: 8, color: 'var(--amber)', border: '1px solid var(--amber)', padding: '1px 5px' }}>추천</span>}
                          </span>
                          <span style={{ fontSize: 11, fontFamily: 'IBM Plex Mono', color: 'var(--white)' }}>{p.amount}</span>
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 2 }}>{p.note}</div>
                      </div>
                    ))}
                  </div>

                  {status && (
                    <div style={{ border: `1px solid ${status.startsWith('✓') ? 'var(--green)' : 'var(--amber)'}`, padding: '8px 12px', marginBottom: 12, fontSize: 10, color: status.startsWith('✓') ? 'var(--green)' : 'var(--amber)' }}>
                      {status}
                    </div>
                  )}

                  <button onClick={handleClaim} disabled={loading}
                    style={{ width: '100%', padding: 14, background: loading ? 'var(--surface-3)' : 'var(--amber)', color: 'var(--black)', border: 'none', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'PROCESSING...' : 'CLAIM GENESIS SLOT →'}
                  </button>

                  <div style={{ marginTop: 12, fontSize: 9, color: 'var(--dimmer)', lineHeight: 1.7, textAlign: 'center' as const }}>
                    결제는 KAUS 스마트 컨트랙트 배포 후 활성화 예정<br/>
                    지금 클레임 → 슬롯 예약 → 배포 시 자동 확정
                  </div>
                </div>

                {/* 지갑 주소 */}
                <div style={{ ...S.card, marginTop: 12 }}>
                  <span style={S.label}>PAYMENT ADDRESS</span>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginBottom: 8 }}>KAUS/USDC/ETH 직접 전송:</div>
                  <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono', color: 'var(--white)', padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', wordBreak: 'break-all' as const }}>
                    0xAD23ce8631a88a0E404a65717ae2DBFEfC035349
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--dimmer)', marginTop: 6 }}>Network: Polygon Mainnet</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
