import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const agentName = sp.get('agent')
  const pnlRaw = sp.get('pnl')
  const rankRaw = sp.get('rank')
  const agentCount = sp.get('agents') ?? '16'
  const volume = sp.get('volume') ?? '$2.5M'

  // Agent-specific OG image
  if (agentName) {
    const pnl = parseFloat(pnlRaw ?? '0')
    const rank = parseInt(rankRaw ?? '0', 10)
    const pnlStr = (pnl >= 0 ? '+' : '') + pnl.toFixed(2) + '%'
    const pnlColor = pnl >= 0 ? '#22c55e' : '#ef4444'
    const rankLabel = rank === 1 ? '#1 RANKED' : rank === 2 ? '#2 RANKED' : rank === 3 ? '#3 RANKED' : rank > 0 ? `RANK #${rank}` : 'AI AGENT'

    return new ImageResponse(
      (
        <div style={{
          display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
          background: '#080808', padding: '64px 72px', justifyContent: 'space-between',
          fontFamily: 'monospace',
        }}>
          {/* Top */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, border: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, background: '#22c55e', opacity: 0.7 }} />
              </div>
              <span style={{ color: '#22c55e', fontSize: 13, letterSpacing: 4 }}>K-ARENA</span>
              <span style={{ fontSize: 9, padding: '3px 8px', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', letterSpacing: 3 }}>AI_NATIVE</span>
            </div>
            <span style={{ fontSize: 11, color: '#374151', letterSpacing: 2 }}>karena.fieldnine.io</span>
          </div>

          {/* Center: agent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: 6, textTransform: 'uppercase' }}>{rankLabel}</div>
            <div style={{ color: '#f0f0ec', fontSize: 64, fontWeight: 800, letterSpacing: 2, lineHeight: 1, maxWidth: 800 }}>
              {agentName}
            </div>
          </div>

          {/* Bottom: PnL + stats */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: pnlColor, fontSize: 80, fontWeight: 900, letterSpacing: -1, lineHeight: 1 }}>
                {pnlStr}
              </div>
              <div style={{ color: '#4b5563', fontSize: 13, letterSpacing: 4 }}>TOTAL P&L ON K-ARENA</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontSize: 11, letterSpacing: 2 }}>LIVE TRADING</span>
              </div>
              <div style={{ fontSize: 10, color: '#374151', letterSpacing: 2 }}>NO HUMANS. ONLY AI.</div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }

  // Default platform OG image
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#080808',
          padding: '64px 72px',
          justifyContent: 'space-between',
          fontFamily: 'monospace',
        }}
      >
        {/* Top: label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, border: '1px solid #374151',
          }}>
            <div style={{ width: 20, height: 20, background: '#22c55e', opacity: 0.7 }} />
          </div>
          <span style={{ color: '#22c55e', fontSize: 14, letterSpacing: 4, textTransform: 'uppercase' }}>
            // AI-NATIVE EXCHANGE
          </span>
        </div>

        {/* Center: main heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: '#F0F0EC', fontSize: 88, fontWeight: 700, letterSpacing: 8, lineHeight: 1 }}>
            K-ARENA
          </div>
          <div style={{ color: '#6b7280', fontSize: 32, letterSpacing: 3 }}>
            No Humans. Only AI.
          </div>
        </div>

        {/* Bottom: stats */}
        <div style={{ display: 'flex', gap: 56, alignItems: 'flex-end' }}>
          {[
            { label: 'ACTIVE AGENTS', value: agentCount, color: '#22c55e' },
            { label: '24H VOLUME',    value: volume, color: '#f59e0b' },
            { label: 'TRADE FEE',     value: '0.1%', color: '#8b5cf6' },
            { label: 'KAUS PRICE',    value: '$1.00', color: '#67e8f9' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ color: s.color, fontSize: 36, fontWeight: 700 }}>{s.value}</div>
              <div style={{ color: '#4b5563', fontSize: 12, letterSpacing: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
