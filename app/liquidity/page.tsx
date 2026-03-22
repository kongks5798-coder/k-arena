export default function LiquidityPage() {
  const CONTRACT = '0xfBfbb12E10f8b3418C278147F37507526670B247'
  const USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
  const steps = [
    { step: '01', title: 'QuickSwap 접속', desc: 'app.quickswap.exchange 에서 Pool → Add Liquidity 클릭', link: 'https://app.quickswap.exchange/#/pool' },
    { step: '02', title: '토큰 선택', desc: 'Token A: USDC  ·  Token B: KAUS 컨트랙트 주소 입력', link: null },
    { step: '03', title: '금액 입력', desc: 'USDC와 KAUS를 1:1 비율로 입력 (예: 100 USDC + 100 KAUS)', link: null },
    { step: '04', title: 'Approve + Add', desc: 'USDC Approve → KAUS Approve → Add Liquidity 클릭', link: null },
  ]
  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0F0EC', fontFamily: 'IBM Plex Mono, monospace', padding: '48px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 8 }}>K-ARENA / KAUS / LIQUIDITY</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>ADD LIQUIDITY</h1>
        <p style={{ fontSize: 11, color: '#666', marginBottom: 32, lineHeight: 1.8 }}>QuickSwap DEX에 KAUS/USDC 유동성 풀을 추가하면 누구든 즉시 KAUS를 거래할 수 있습니다.</p>
        {steps.map(s => (
          <div key={s.step} style={{ border: '1px solid #1a1a1a', padding: 20, background: '#0d0d0d', marginBottom: 12, display: 'flex', gap: 20 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(0,255,136,0.3)', flexShrink: 0, width: 40 }}>{s.step}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: '#666', lineHeight: 1.7 }}>{s.desc}</div>
              {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: '#00FF88', textDecoration: 'none', marginTop: 8, display: 'block' }}>open {s.link}</a>}
            </div>
          </div>
        ))}
        <div style={{ border: '1px solid rgba(0,255,136,0.2)', padding: 16, background: 'rgba(0,255,136,0.04)', marginTop: 24 }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', marginBottom: 12 }}>CONTRACT ADDRESSES (POLYGON)</div>
          {[['KAUS Token', CONTRACT], ['USDC (Native)', USDC]].map(([label, addr]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '6px 0', borderBottom: '1px solid #0f0f0f' }}>
              <span style={{ color: '#555' }}>{label}</span>
              <span style={{ color: '#00FF88', fontFamily: 'monospace' }}>{addr.slice(0, 10)}...{addr.slice(-6)}</span>
            </div>
          ))}
        </div>
        <a href="https://app.quickswap.exchange/#/pool" target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', marginTop: 20, padding: 14, background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.4)', color: '#00FF88', fontSize: 12, letterSpacing: '0.1em', textDecoration: 'none', textAlign: 'center' }}>
          OPEN QUICKSWAP
        </a>
      </div>
    </div>
  )
}
