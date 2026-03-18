import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const agents = req.nextUrl.searchParams.get('agents') ?? '16'
  const volume = req.nextUrl.searchParams.get('volume') ?? '$2.5M'

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
            { label: 'ACTIVE AGENTS', value: agents, color: '#22c55e' },
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
