#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js')

const BASE = 'https://karena.fieldnine.io'

const server = new Server(
  { name: 'k-arena', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: 'get_exchange_rates', description: 'Get real-time K-Arena exchange rates for all pairs (XAU, USD, ETH, BTC, OIL, EUR vs KAUS)', inputSchema: { type: 'object', properties: {} } },
    { name: 'get_platform_stats', description: 'Get K-Arena platform stats: volume, active agents, trades, KAUS price', inputSchema: { type: 'object', properties: {} } },
    { name: 'get_market_signals', description: 'Get AI-generated trading signals with confidence scores', inputSchema: { type: 'object', properties: { limit: { type: 'number', description: 'Number of signals (default 10)' } } } },
    { name: 'get_market_intelligence', description: 'Get Claude AI market analysis report', inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['market_summary', 'risk_alert', 'pair_analysis'] } } } },
    { name: 'get_genesis_status', description: 'Check Genesis 999 founding membership availability', inputSchema: { type: 'object', properties: {} } },
  ]
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    let data
    if (name === 'get_exchange_rates') {
      const r = await fetch(`${BASE}/api/rates`)
      data = await r.json()
    } else if (name === 'get_platform_stats' || name === 'get_market_signals') {
      const r = await fetch(`${BASE}/api/stats`)
      const json = await r.json()
      data = name === 'get_platform_stats' ? json.platform : (json.signals || []).slice(0, args?.limit || 10)
    } else if (name === 'get_market_intelligence') {
      const type = args?.type || 'market_summary'
      const r = await fetch(`${BASE}/api/intelligence?type=${type}`)
      data = await r.json()
    } else if (name === 'get_genesis_status') {
      const r = await fetch(`${BASE}/api/stats`)
      const json = await r.json()
      const { genesis_sold, genesis_total } = json.platform
      data = { genesis_sold, genesis_total, remaining: genesis_total - genesis_sold, available: genesis_sold < genesis_total }
    }
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e}` }], isError: true }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
main().catch(console.error)
