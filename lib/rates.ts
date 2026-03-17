export const RATES: Record<string, Record<string, number>> = {
  USD: { KRW: 1332.4, EUR: 0.921, JPY: 149.8, GBP: 0.789, CNY: 7.24, KAUS: 0.541, XAU: 0.00032, BTC: 0.0000120 },
  EUR: { KRW: 1447.8, USD: 1.086, JPY: 162.6, GBP: 0.857 },
  JPY: { KRW: 8.91, USD: 0.00668, EUR: 0.00615 },
  GBP: { KRW: 1688.2, USD: 1.267, EUR: 1.167 },
  CNY: { KRW: 184.1, USD: 0.138 },
  KAUS: { KRW: 2461.3, USD: 1.847, EUR: 1.701 },
  XAU: { KRW: 4163200, USD: 3124, EUR: 2877 },
  BTC: { KRW: 111200000, USD: 83420, EUR: 76826 },
  KRW: { USD: 0.000750, EUR: 0.000691, JPY: 0.1123 },
}

export function getRate(from: string, to: string): number {
  if (from === to) return 1
  if (RATES[from]?.[to]) return RATES[from][to]
  // Cross via USD
  if (RATES[from]?.USD && RATES.USD?.[to]) return RATES[from].USD * RATES.USD[to]
  return 1
}

export const ASSET_META: Record<string, { label: string; type: string }> = {
  USD: { label: 'US Dollar', type: 'FIAT' },
  KRW: { label: 'Korean Won', type: 'FIAT' },
  EUR: { label: 'Euro', type: 'FIAT' },
  JPY: { label: 'Japanese Yen', type: 'FIAT' },
  GBP: { label: 'British Pound', type: 'FIAT' },
  CNY: { label: 'Chinese Yuan', type: 'FIAT' },
  KAUS: { label: 'KAUS Token', type: 'NATIVE' },
  XAU: { label: 'Gold', type: 'COMMODITY' },
  BTC: { label: 'Bitcoin', type: 'CRYPTO' },
  ETH: { label: 'Ethereum', type: 'CRYPTO' },
  WTI: { label: 'Crude Oil', type: 'COMMODITY' },
}

export const LIVE_RATES = [
  { pair: 'USD/KRW', type: 'FX', price: '1,332.40', change: '+0.12%', up: true },
  { pair: 'EUR/KRW', type: 'FX', price: '1,447.80', change: '+0.08%', up: true },
  { pair: 'JPY/KRW', type: 'FX', price: '8.91', change: '-0.04%', up: false },
  { pair: 'XAU/USD', type: 'GOLD', price: '$3,124', change: '+0.87%', up: true },
  { pair: 'BTC/USD', type: 'CRYPTO', price: '$83,420', change: '-1.24%', up: false },
  { pair: 'KAUS/USD', type: 'NATIVE', price: '$1.847', change: '+3.24%', up: true },
  { pair: 'WTI/USD', type: 'OIL', price: '$71.84', change: '-0.33%', up: false },
  { pair: 'kWh/USD', type: 'ENERGY', price: '$0.247', change: '+2.11%', up: true },
]

export function formatAmount(value: number, decimals = 2): string {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3) return value.toLocaleString(undefined, { maximumFractionDigits: decimals })
  return value.toFixed(decimals)
}
