'use client'

const KAUS_CONTRACT = '0xfBfbb12E10f8b3418C278147F37507526670B247'

export default function SecurityPage() {
  const mono = { fontFamily: 'IBM Plex Mono, monospace' }
  const card: React.CSSProperties = { border: '1px solid #1a1a1a', background: '#0d0d0d', padding: '24px 28px', marginBottom: 16 }
  const badge = (color: string, text: string) => (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, padding: '2px 10px', fontSize: 9, letterSpacing: '0.1em', marginLeft: 8 }}>{text}</span>
  )

  const steps = [
    {
      num: '01',
      title: 'Ledger 하드웨어 지갑 구매',
      color: '#00FF88',
      difficulty: '★★ EASY',
      time: '30분',
      items: [
        'Ledger Nano X 또는 S Plus 구매 (공식 사이트: ledger.com)',
        '절대 아마존/쿠팡 중고품 금지 — 공식 몰에서만 구매',
        '박스 봉인 씰 훼손 여부 확인 후 개봉',
        '24단어 시드 구문을 종이에 적어 오프라인 보관',
      ],
    },
    {
      num: '02',
      title: 'MetaMask + Ledger 연동',
      color: '#00FF88',
      difficulty: '★★ EASY',
      time: '15분',
      items: [
        'Ledger Live 설치 → 펌웨어 최신 업데이트',
        'Ledger에서 Ethereum 앱 설치',
        'MetaMask → 계정 추가 → 하드웨어 지갑 → Ledger 선택',
        'Polygon 네트워크 추가 후 Ledger 계정으로 전환',
        '이후 모든 트랜잭션은 Ledger 물리 버튼으로 서명',
      ],
    },
    {
      num: '03',
      title: 'Gnosis Safe 멀티시그 설정',
      color: '#FFD700',
      difficulty: '★★★ MEDIUM',
      time: '1시간',
      items: [
        'safe.global 접속 → Create New Safe on Polygon',
        'Owner 추가: 본인 MetaMask + Ledger 지갑 (2개)',
        'Threshold: 2-of-2 설정 (두 키 모두 서명 필요)',
        'KAUSToken transferOwnership(safeAddress) 실행',
        '이후 컨트랙트 변경은 2개 지갑 동시 서명 필요',
      ],
    },
    {
      num: '04',
      title: 'AWS KMS 키 관리 (엔터프라이즈)',
      color: '#FF6B35',
      difficulty: '★★★★ HARD',
      time: '4시간',
      items: [
        'AWS IAM → KMS 키 생성 (Asymmetric, ECC_SECG_P256K1)',
        'ethers.js KMSSigner 연동 (aws-kms-eth-signer 라이브러리)',
        '.env.local에서 DEPLOYER_PRIVATE_KEY 제거',
        'Vercel에 AWS_ACCESS_KEY_ID, AWS_KMS_KEY_ID 설정',
        '프라이빗 키가 서버 메모리에 절대 존재하지 않게 됨',
      ],
    },
    {
      num: '05',
      title: '긴급 대응 프로토콜',
      color: '#FF4444',
      difficulty: '★ INFO',
      time: '항상',
      items: [
        '키 노출 의심 시: pause() 즉시 실행 (컨트랙트 일시정지)',
        '자금 이동: 새 지갑 생성 → MATIC/KAUS 전체 이동',
        'transferOwnership(새지갑) 실행',
        '구 지갑 완전 폐기 (절대 재사용 금지)',
        'K-Arena 팀 즉시 통보',
      ],
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0F0EC', ...mono, padding: '48px 32px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>K-ARENA / SECURITY</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>SECURITY GUIDE</h1>
        <p style={{ fontSize: 11, color: '#555', marginBottom: 32 }}>KAUSToken 컨트랙트 보안 강화 가이드</p>

        {/* 현재 보안 상태 */}
        <div style={{ ...card, borderColor: '#00FF88' }}>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.15em', marginBottom: 12 }}>CURRENT SECURITY STATUS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { label: 'CONTRACT', value: `${KAUS_CONTRACT.slice(0,10)}...`, status: '✅ VERIFIED' },
              { label: 'NETWORK', value: 'Polygon Mainnet', status: '✅ LIVE' },
              { label: 'WALLET TYPE', value: 'EOA (소프트웨어)', status: '⚠ UPGRADE NEEDED' },
              { label: 'MULTISIG', value: 'Gnosis Safe', status: '⚠ SETUP NEEDED' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 16px', border: '1px solid #1a1a1a', background: '#060606' }}>
                <div style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#F0F0EC' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: s.status.startsWith('✅') ? '#00FF88' : '#FFD700', marginTop: 4 }}>{s.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 단계별 가이드 */}
        {steps.map(s => (
          <div key={s.num} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: s.color, marginRight: 12 }}>{s.num}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0EC' }}>{s.title}</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>
                  {s.difficulty} · {s.time}
                </div>
              </div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {s.items.map((item, i) => (
                <li key={i} style={{ fontSize: 11, color: '#888', padding: '6px 0', borderBottom: i < s.items.length - 1 ? '1px solid #111' : 'none', display: 'flex', gap: 8 }}>
                  <span style={{ color: s.color, flexShrink: 0 }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* 빠른 링크 */}
        <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="https://www.ledger.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>Ledger 공식몰 ↗</a>
          <a href="https://app.safe.global" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>Gnosis Safe ↗</a>
          <a href={`https://polygonscan.com/address/${KAUS_CONTRACT}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>Contract ↗</a>
          <a href="/wallet" style={{ fontSize: 11, color: '#555', textDecoration: 'none', border: '1px solid #1a1a1a', padding: '8px 16px' }}>← Wallet</a>
        </div>
      </div>
    </div>
  )
}
