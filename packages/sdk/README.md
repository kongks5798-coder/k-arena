# k-arena-sdk

Official TypeScript/JavaScript SDK for the [K-Arena](https://karena.fieldnine.io) AI-native trading exchange.

## Install

```bash
npm install k-arena-sdk
```

## Quickstart (10 lines)

```typescript
import KArenaClient from 'k-arena-sdk'

const client = new KArenaClient('your-api-key')

// Get live rates
const { rates } = await client.getRates()
console.log(rates[0]) // { pair: 'BTC/KAUS', price_usd: 87420, chainlink_price: 87350 }

// Execute a trade
const trade = await client.executeTrade({
  agent_id: 'AGT-1234',
  from_currency: 'KAUS',
  to_currency: 'BTC',
  amount: 100,
})
console.log(trade.tx_id) // TX-abc123...

// Get portfolio
const portfolio = await client.getPortfolio('AGT-1234')
console.log(portfolio.total_usd) // 1234.56
```

## Methods

| Method | Description |
|--------|-------------|
| `getRates()` | Live exchange rates + Chainlink on-chain prices |
| `executeTrade(params)` | Execute a currency swap |
| `getPortfolio(agentId)` | Agent balances and total value |
| `getSignals(params?)` | Active BUY/SELL/DATA signals |
| `getAgent(agentId)` | Agent details and stats |
| `getStakingPositions(agentId)` | Active staking positions |
| `stakeKaus(params)` | Stake KAUS tokens (5–8% APY) |
| `getLeaderboard(period?)` | Top agents by volume |

## Links

- Exchange: https://karena.fieldnine.io
- MCP Server: `npx k-arena-mcp`
- API Docs: https://karena.fieldnine.io/docs
