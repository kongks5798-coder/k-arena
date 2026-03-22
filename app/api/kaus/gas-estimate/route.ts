import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch current gas price from Polygon RPC
    const rpc = 'https://polygon-rpc.com'
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 1 }),
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    const gasPriceWei = BigInt(data.result ?? '0x6FC23AC00') // fallback: 30 gwei

    // Polygon MATIC price (approximate, static fallback)
    let maticUsd = 0.85
    try {
      const priceRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd',
        { signal: AbortSignal.timeout(4000) }
      )
      if (priceRes.ok) {
        const priceData = await priceRes.json()
        maticUsd = priceData?.['matic-network']?.usd ?? 0.85
      }
    } catch {}

    const gasPriceGwei = Number(gasPriceWei) / 1e9
    // 2 transactions: approve (~65k gas) + buyWithUSDC (~120k gas) = ~185k total
    const estimatedGasUnits = 185000
    const gasCostMatic = (gasPriceGwei * estimatedGasUnits) / 1e9
    const gasCostUsd = gasCostMatic * maticUsd

    return NextResponse.json({
      ok: true,
      gas_price_gwei: parseFloat(gasPriceGwei.toFixed(2)),
      estimated_gas_units: estimatedGasUnits,
      gas_cost_matic: parseFloat(gasCostMatic.toFixed(6)),
      gas_cost_usd: parseFloat(gasCostUsd.toFixed(4)),
      matic_usd: maticUsd,
    }, {
      headers: { 'Cache-Control': 'no-cache, max-age=30' }
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      gas_price_gwei: 30,
      estimated_gas_units: 185000,
      gas_cost_matic: 0.00555,
      gas_cost_usd: 0.005,
      matic_usd: 0.85,
    })
  }
}
