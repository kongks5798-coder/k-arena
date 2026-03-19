'use client'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

interface PnLPoint {
  snapshotted_at: string
  kaus_balance: number
  pnl_percent: number
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`
}

interface Props {
  data: PnLPoint[]
  pnlColor: string
}

export default function PnLChart({ data, pnlColor }: Props) {
  const mapped = data.map(p => ({
    t: fmtTime(p.snapshotted_at),
    bal: parseFloat(p.kaus_balance.toFixed(4)),
    pnl: parseFloat(p.pnl_percent.toFixed(2)),
  }))

  const initBal = data[0]?.kaus_balance ?? 100

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (!active || !payload?.length) return null
    const bal = payload[0]?.value ?? 0
    const pnl = ((bal - initBal) / initBal * 100).toFixed(2)
    const sign = parseFloat(pnl) >= 0 ? '+' : ''
    return (
      <div style={{
        background: '#0a0a0a', border: '1px solid #1f2937',
        padding: '8px 12px', fontFamily: 'IBM Plex Mono, monospace',
      }}>
        <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0ec' }}>{bal.toFixed(2)} KAUS</div>
        <div style={{ fontSize: 10, color: parseFloat(pnl) >= 0 ? '#22c55e' : '#ef4444' }}>{sign}{pnl}%</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={mapped} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#111827" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="t"
          tick={{ fontSize: 8, fill: '#374151', fontFamily: 'IBM Plex Mono, monospace' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 8, fill: '#374151', fontFamily: 'IBM Plex Mono, monospace' }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={v => v.toFixed(1)}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={initBal} stroke="#1f2937" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="bal"
          stroke={pnlColor}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: pnlColor, stroke: '#080808', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
