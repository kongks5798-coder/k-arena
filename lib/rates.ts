// K-Arena Real-time Rate Oracle
// Sources: Binance (crypto), ExchangeRate-API (FX), derived (commodities)

export interface RateData {
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
  source: string
  ts: number
}

export const ASSET_META: Record<string, { label: string; type: string }> = {
  USD:  { label: 'US Dollar',       type: 'FIAT' },
  KRW:  { label: 'Korean Won',      type: 'FIAT' },
  EUR:  { label: 'Euro',            type: 'FIAT' },
  JPY:  { label: 'Japanese Yen',    type: 'FIAT' },
  GBP:  { label: 'British Pound',   type: 'FIAT' },
  CNY:  { label: 'Chinese Yuan',    type: 'FIAT' },
  KAUS: { label: 'KAUS Token',      type: 'NATIVE' },
  XAU:  { label: 'Gold (troy oz)',  type: 'COMMODITY' },
  BTC:  { label: 'Bitcoin',         type: 'CRYPTO' },
  ETH:  { label: 'Ethereum',        type: 'CRYPTO' },
  WTI:  { label: 'Crude Oil (WTI)', type: 'COMMODITY' },
  kWh:  { label: 'Kilowatt-hour',   type: 'ENERGY' },
}

// Client-side: static fallback for initial render (갱신은 /api/rates에서)
export const LIVE_RATES = [
  { pair: 'USD/KRW', type: 'FX',       price: '—',      change: '—',     up: true },
  { pair: 'EUR/USD', type: 'FX',       price: '—',      change: '—',     up: true },
  { pair: 'BTC/USD', type: 'CRYPTO',   price: '—',      change: '—',     up: true },
  { pair: 'ETH/USD', type: 'CRYPTO',   price: '—',      change: '—',     up: true },
  { pair: 'XAU/USD', type: 'GOLD',     price: '—',      change: '—',     up: true },
  { pair: 'KAUS/USD',type: 'NATIVE',   price: '—',      change: '—',     up: true },
  { pair: 'WTI/USD', type: 'OIL',      price: '—',      change: '—',     up: true },
]

export function getRate(from: string, to: string): number {
  if (from === to) return 1
  return 1 // 실제 환율은 /api/rates에서 fetch
}

export function formatAmount(value: number, decimals = 2): string {
  if (!isFinite(value)) return '—'
  if (value >= 1e9)  return (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6)  return (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3)  return value.toLocaleString(undefined, { maximumFractionDigits: decimals })
  return value.toFixed(decimals)
}
