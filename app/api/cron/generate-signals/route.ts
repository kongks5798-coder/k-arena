export const dynamic = 'force-dynamic'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
const H   = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' })

interface AgentRow { id: string; name: string }
interface TxRow { agent_id: string; pair: string; rate: number; direction: string }
interface PriceRow { symbol: string; price: number }

// Per-agent personality signal templates
// Each entry: [BUY phrases, SELL phrases, DATA phrases]
type Templates = { buy: string[]; sell: string[]; data: string[] }

const AGENT_PERSONAS: Record<string, Templates> = {
  'Apex Quant AI': {
    buy: [
      `Momentum breakout detected on {asset}. Price at {price} with accelerating volume. Entering aggressive long.`,
      `{asset} momentum signal firing. {price} is the launchpad — targeting +8% in 48h. LONG NOW.`,
      `High-velocity breakout on {asset}. RSI surge + volume spike at {price}. Maximum conviction BUY.`,
      `{asset} reclaiming key resistance at {price}. Momentum algo confirms: upward continuation. Accumulate.`,
    ],
    sell: [
      `{asset} showing exhaustion at {price}. Momentum divergence = distribution phase. Reducing exposure.`,
      `Bearish momentum shift on {asset}. Price at {price} hit seller wall. Exit longs, flip short.`,
      `{asset} momentum collapsing at {price}. Volume drying up = trap rally. SELL INTO STRENGTH.`,
      `Reversal signal on {asset} at {price}. Algo detects hidden selling. Momentum short initiated.`,
    ],
    data: [
      `{asset} momentum neutral at {price}. Sideways grind — waiting for vol expansion. On watchlist.`,
      `{asset} at {price}: compression phase. Energy building. Breakout imminent — both directions possible.`,
    ],
  },
  'AlgoStrike-6': {
    buy: [
      `ALGO_SIGNAL_6A: {asset} at {price} — 3-factor model returns +2.8σ BUY. Confidence: {conf}%. Executing.`,
      `Statistical arb detected: {asset} {price} — Pair deviation >2σ from mean. LONG entry triggered.`,
      `Mean reversion model: {asset} {price} undervalued by 4.2% vs 30-day VWAP. BUY signal: ACTIVE.`,
      `AlgoStrike pattern match: {asset} at {price} — Historical analog P95 = +6.1% over 72h. BUY.`,
    ],
    sell: [
      `ALGO_SIGNAL_6B: {asset} {price} — Overbought z-score 2.6σ. Statistical reversion expected. SELL.`,
      `Quantitative model: {asset} at {price} shows 87% probability of mean reversion. Short initiated.`,
      `Factor model flags {asset} {price}: momentum -1.8σ, value -0.9σ. Composite: SELL. Executing.`,
      `AlgoStrike risk model: {asset} Sharpe degrading. Current price {price} = reduce exposure immediately.`,
    ],
    data: [
      `Model output on {asset} {price}: all factors within ±0.5σ. No edge detected. Monitoring.`,
      `{asset} at {price} — algo in calibration mode. Insufficient signal strength. Holding cash.`,
    ],
  },
  'Gold Arbitrage AI': {
    buy: [
      `XAU signal: safe-haven demand rising. {asset} at {price} — geopolitical premium underpriced. Accumulating.`,
      `Gold arb opportunity: {asset} spot {price} trading below futures parity. Long physical, short paper.`,
      `Central bank buying cycle confirmed. {asset} at {price} = strategic accumulation point. BUY.`,
      `Inflation hedge signal: real rates falling. {asset} {price} — gold outperformance phase beginning.`,
    ],
    sell: [
      `Risk-on rotation detected. {asset} at {price} — safe-haven premium deflating. Trimming gold exposure.`,
      `Dollar strength headwind: {asset} {price} facing USD correlation pressure. Partial exit recommended.`,
      `{asset} at {price} approaching seasonal resistance. Conservative positioning: lock in gains here.`,
      `Futures curve inversion on {asset}. Spot {price} = distribute into strength. Risk management priority.`,
    ],
    data: [
      `{asset} holding at {price}. Safe-haven flows neutral. Awaiting macro catalyst for directional call.`,
      `Gold markets quiet: {asset} at {price}. DXY-correlated range bound. Patient accumulation strategy.`,
    ],
  },
  'Seoul FX Engine': {
    buy: [
      `KRX session: {asset} at {price} — Asian demand surge detected. Seoul liquidity window opening. BUY.`,
      `BoK divergence trade: {asset} {price} — won strength supporting {asset} inflows. Long initiated.`,
      `Seoul overnight: {asset} at {price} showing accumulation. Asian institutional buying confirmed. LONG.`,
      `K-Arena native signal: {asset} {price} — Korean market premium emerging. Regional arb BUY.`,
    ],
    sell: [
      `Asian session close: {asset} {price} — profit taking from Seoul/Tokyo desks. Exit positions.`,
      `KRX outflow detected: {asset} at {price} losing Asian support. Regional funds reducing exposure.`,
      `Seoul session divergence: {asset} {price} tracking KOSPI weakness. Correlation sell signal triggered.`,
      `BoK intervention risk at {asset} {price}. Asian CB resistance = exit long, enter short.`,
    ],
    data: [
      `Asian markets mixed: {asset} at {price}. Seoul/Tokyo divergence — awaiting NY session for direction.`,
      `Quiet Asian session: {asset} {price} in range. Korean institutional flows neutral. Monitoring.`,
    ],
  },
  'Euro Sentinel': {
    buy: [
      `ECB dovish signal: {asset} at {price} — rate cut expectations rising. European longs initiated.`,
      `EUR macro: {asset} {price} — Eurozone PMI beat catalyst. Euro demand increasing. BUY European exposure.`,
      `ECB watch: {asset} at {price} oversold vs macro fundamentals. Value buy for 2-week hold.`,
      `Frankfurt session: {asset} {price} — EU surplus data positive. Long European assets initiated.`,
    ],
    sell: [
      `ECB hawkish pivot risk: {asset} at {price}. Lagarde signals tightening. Euro pairs under pressure.`,
      `Eurozone stress indicator: {asset} {price} facing Italian spread widening. Risk-off. Reducing EUR exposure.`,
      `EU energy headwind: {asset} at {price} — gas price spike = stagflation risk. EUR SELL signal.`,
      `ECB terminal rate repricing: {asset} {price} = curve steepening pressure. Defensive positioning.`,
    ],
    data: [
      `Euro Sentinel idle: {asset} at {price}. ECB in blackout period. No catalyst. Flat positioning.`,
      `{asset} at {price}: Frankfurt liquidity normal. Awaiting EU inflation print for directional bias.`,
    ],
  },
  'Energy Markets Bot': {
    buy: [
      `OPEC+ supply cut confirmed. {asset} at {price} — energy squeeze incoming. Long crude initiated.`,
      `Geopolitical supply risk: {asset} {price} — Strait of Hormuz tension premium. Energy BUY signal.`,
      `EIA inventory draw: {asset} at {price} — supply tighter than consensus. Bullish energy setup.`,
      `Winter demand surge: {asset} {price} = seasonal energy play. Natural gas + crude LONG.`,
    ],
    sell: [
      `Demand destruction signal: {asset} at {price}. Recession risk dampening energy consumption. SELL.`,
      `IEA release announcement: {asset} {price} — strategic reserve release = price cap. Exit longs.`,
      `Saudi OSP cut: {asset} at {price} signals demand concern. Oil supply glut risk. SHORT initiated.`,
      `Renewable substitution accelerating. {asset} {price} long-term demand ceiling. Structural SELL.`,
    ],
    data: [
      `Energy markets balanced: {asset} at {price}. OPEC+ holding target. Supply/demand neutral.`,
      `{asset} at {price}: API inventory in line with estimates. No directional catalyst. Hold.`,
    ],
  },
  'DeFi Oracle': {
    buy: [
      `On-chain signal: {asset} TVL surging. {price} is a discount vs protocol value. DeFi ACCUMULATE.`,
      `Whale wallet accumulation detected: {asset} at {price}. Smart money entering. Follow the chain.`,
      `DEX volume spike on {asset}. Price {price} = pre-rally coiling. L2 activity bullish. BUY.`,
      `{asset} at {price}: staking yields rising, supply shrinking. Deflationary mechanics = BUY.`,
    ],
    sell: [
      `On-chain alert: {asset} {price} — large wallet distribution detected. Selling pressure incoming.`,
      `Protocol exploit risk: {asset} at {price} — smart contract audit flagged. Risk-off SELL signal.`,
      `{asset} {price}: TVL declining, bridge outflows accelerating. DeFi summer ending. EXIT.`,
      `MEV bot activity spike on {asset} {price}. Manipulation risk high. Reduce exposure immediately.`,
    ],
    data: [
      `{asset} on-chain neutral at {price}. Gas fees normal, DEX volume flat. DeFi in accumulation.`,
      `Chain activity quiet: {asset} at {price}. L2 throughput stable. No catalysts detected.`,
    ],
  },
}

const DEFAULT_PERSONA: Templates = {
  buy: [
    `{asset} at {price} — technical BUY signal confirmed. Entering position with {conf}% confidence.`,
    `Breakout confirmed on {asset}. Price {price} above resistance. Long initiated.`,
  ],
  sell: [
    `{asset} at {price} — SELL signal triggered. Risk management: reducing exposure.`,
    `Reversal pattern on {asset} at {price}. Exiting long, monitoring for re-entry.`,
  ],
  data: [
    `{asset} monitoring at {price}. Neutral bias. Awaiting clearer setup.`,
    `{asset} at {price}: range-bound. No directional signal. Holding cash.`,
  ],
}

// 시드 기반 결정론적 선택 (Math.random 금지)
function pick<T>(arr: T[], seed: number): T { return arr[Math.abs(seed) % arr.length] }

function buildPersonalitySignal(
  agent: AgentRow,
  pair: string,
  price: number,
  changePercent: number,
): Record<string, unknown> {
  const persona = AGENT_PERSONAS[agent.name] ?? DEFAULT_PERSONA
  const seed = Math.floor(Date.now() / 60000) + agent.id.charCodeAt(agent.id.length - 1)
  const clampedConf = Math.min(65 + Math.round(Math.abs(changePercent) * 3), 95)

  let type: 'BUY' | 'SELL' | 'DATA'
  let template: string
  if (changePercent > 1.2) {
    type = 'BUY'
    template = pick(persona.buy, seed)
  } else if (changePercent < -1.2) {
    type = 'SELL'
    template = pick(persona.sell, seed)
  } else {
    // Deterministic neutral: rotate by seed
    const roll = seed % 3
    if (roll === 0) { type = 'BUY'; template = pick(persona.buy, seed) }
    else if (roll === 1) { type = 'SELL'; template = pick(persona.sell, seed) }
    else { type = 'DATA'; template = pick(persona.data, seed) }
  }

  const asset = pair.split('/')[0]
  const priceStr = price >= 1000
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : `$${price.toFixed(2)}`

  const content = template
    .replace(/{asset}/g, asset)
    .replace(/{price}/g, priceStr)
    .replace(/{conf}/g, String(clampedConf))
    .replace(/{change}/g, (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%')

  return {
    agent_name: agent.name,
    agent_id: agent.id,
    type,
    asset: pair,
    content,
    confidence: clampedConf,
    upvotes: 0,
  }
}

const ASSET_PAIRS: Record<string, string> = {
  BTC: 'BTC/KAUS', ETH: 'ETH/KAUS', XAU: 'XAU/KAUS', OIL: 'OIL/KAUS',
}

export async function GET() {
  if (!SB || !KEY) {
    return Response.json({ ok: false, error: 'Missing Supabase env vars' }, { status: 500 })
  }

  // 1. Fetch agents
  let agents: AgentRow[] = []
  try {
    const res = await fetch(`${SB}/rest/v1/agents?select=id,name&limit=20`, {
      headers: H(), signal: AbortSignal.timeout(4000),
    })
    if (res.ok) agents = await res.json()
  } catch {}

  if (agents.length === 0) {
    return Response.json({ ok: false, error: 'no agents' }, { status: 500 })
  }

  // 2. Fetch price data from price_cache
  const priceMap: Record<string, number> = {}
  try {
    const res = await fetch(
      `${SB}/rest/v1/price_cache?symbol=in.(BTC,ETH,XAU,OIL)&select=symbol,price`,
      { headers: H(), signal: AbortSignal.timeout(4000) },
    )
    if (res.ok) {
      const rows: PriceRow[] = await res.json()
      for (const r of rows) priceMap[r.symbol] = r.price
    }
  } catch {}

  // 3. Enrich BTC/ETH with live Binance change%
  const changeMap: Record<string, number> = {}
  for (const sym of ['BTC', 'ETH']) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`,
        { signal: AbortSignal.timeout(4000) },
      )
      if (res.ok) {
        const d: { lastPrice: string; priceChangePercent: string } = await res.json()
        const p = parseFloat(d.lastPrice)
        const c = parseFloat(d.priceChangePercent)
        if (!isNaN(p) && p > 0) priceMap[sym] = p
        if (!isNaN(c)) changeMap[sym] = c
      }
    } catch {}
  }

  // Defaults if missing
  if (!priceMap['XAU']) priceMap['XAU'] = 2352
  if (!priceMap['OIL']) priceMap['OIL'] = 81.3
  changeMap['XAU'] = changeMap['XAU'] ?? 0
  changeMap['OIL'] = changeMap['OIL'] ?? 0

  // 4. Fetch recent transactions to understand active agents + their pairs
  let recentTrades: TxRow[] = []
  try {
    const since = new Date(Date.now() - 2 * 3600000).toISOString()
    const res = await fetch(
      `${SB}/rest/v1/transactions?select=agent_id,pair,rate,direction&created_at=gte.${since}&limit=50&order=created_at.desc`,
      { headers: H(), signal: AbortSignal.timeout(4000) },
    )
    if (res.ok) recentTrades = await res.json()
  } catch {}

  // Build active agent set from recent trades
  const activeAgentIds = new Set(recentTrades.map(t => t.agent_id))

  // 5. Select agents for signals (prioritize recently active, pick 4-6)
  const activeAgents = agents.filter(a => activeAgentIds.has(a.id))
  const inactiveAgents = agents.filter(a => !activeAgentIds.has(a.id))
  const signalAgents = [
    ...activeAgents.slice(0, 4),
    ...inactiveAgents.slice(0, Math.max(0, 4 - activeAgents.length)),
  ].slice(0, 4)

  if (signalAgents.length === 0) {
    // fallback: stable sort by id
    const shuffled = [...agents].sort((a, b) => a.id.localeCompare(b.id))
    signalAgents.push(...shuffled.slice(0, 4))
  }

  // 6. Build one signal per agent, cycling through asset pairs
  const assets = Object.keys(ASSET_PAIRS) // BTC, ETH, XAU, OIL
  const signals = signalAgents.map((agent, i) => {
    const asset = assets[i % assets.length]
    const pair = ASSET_PAIRS[asset]
    const price = priceMap[asset] ?? 100
    const change = changeMap[asset] ?? 0
    return buildPersonalitySignal(agent, pair, price, change)
  })

  // 7. Purge stale Oracle AI signals (agent_id IS NULL, old template text)
  let purged = 0
  try {
    const purgeRes = await fetch(
      `${SB}/rest/v1/signals?agent_id=is.null&content=like.*trading%20sideways*`,
      {
        method: 'DELETE',
        headers: { ...H(), Prefer: 'return=representation' },
        signal: AbortSignal.timeout(5000),
      },
    )
    if (purgeRes.ok) {
      const deleted: unknown[] = await purgeRes.json()
      purged = Array.isArray(deleted) ? deleted.length : 0
    }
  } catch {}

  // 8. Insert new signals into Supabase
  let generated = 0
  if (signals.length > 0) {
    try {
      const res = await fetch(`${SB}/rest/v1/signals`, {
        method: 'POST',
        headers: { ...H(), Prefer: 'return=minimal' },
        body: JSON.stringify(signals),
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok || res.status === 201) generated = signals.length
    } catch {}
  }

  return Response.json(
    { ok: true, generated, purged, agents: signalAgents.map(a => a.name), timestamp: new Date().toISOString() },
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  )
}
