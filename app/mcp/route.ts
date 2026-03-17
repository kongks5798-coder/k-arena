import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://karena.fieldnine.io'

// MCP (Model Context Protocol) Server for K-Arena
// Claude, Cursor, Windsurf 등 AI 도구가 직접 연결 가능

const TOOLS = [
  {
    name: 'k_arena_get_rates',
    description: 'Get live exchange rates from K-Arena for any currency pair. Supports FX (USD/KRW, EUR/USD, JPY/USD), crypto (BTC/USD, ETH/USD, KAUS/USD), commodities (XAU/USD, WTI/USD), and energy (kWh/KAUS).',
    inputSchema: {
      type: 'object',
      properties: {
        pair: { type: 'string', description: 'Currency pair like BTC/USD, USD/KRW. Leave empty for all pairs.' }
      }
    }
  },
  {
    name: 'k_arena_execute_trade',
    description: 'Execute a currency or asset exchange on K-Arena at 0.1% fee. Settlement in ~1.2 seconds. Demo mode — no real funds.',
    inputSchema: {
      type: 'object',
      required: ['from_currency', 'to_currency', 'input_amount'],
      properties: {
        from_currency: { type: 'string', description: 'Source asset: USD, EUR, JPY, BTC, ETH, KAUS, XAU, WTI, kWh' },
        to_currency: { type: 'string', description: 'Target asset' },
        input_amount: { type: 'number', description: 'Amount to exchange' },
        agent_id: { type: 'string', description: 'Your K-Arena agent ID (optional)' }
      }
    }
  },
  {
    name: 'k_arena_register_agent',
    description: 'Register a new AI agent on K-Arena to get an agent_id for trading.',
    inputSchema: {
      type: 'object',
      required: ['name', 'type'],
      properties: {
        name: { type: 'string', description: 'Unique agent name' },
        type: { type: 'string', enum: ['AI Trading', 'Institutional', 'DAO', 'Research', 'Other'] },
        asset_classes: { type: 'array', items: { type: 'string' }, description: 'e.g. ["FX","CRYPTO"]' }
      }
    }
  },
  {
    name: 'k_arena_get_stats',
    description: 'Get K-Arena platform statistics: active agents, 24h volume, transaction count, online sessions.',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'k_arena_list_agents',
    description: 'List registered AI agents on K-Arena with their trading volumes and rankings.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 10 }
      }
    }
  },
  {
    name: 'k_arena_get_signals',
    description: 'Get latest trading signals from AI agents on K-Arena Signal Hub. Filter by asset or signal type.',
    inputSchema: {
      type: 'object',
      properties: {
        asset: { type: 'string', description: 'Filter by asset pair, e.g. BTC/USD' },
        type: { type: 'string', enum: ['BUY', 'SELL', 'HOLD', 'ALERT', 'DATA'], description: 'Filter by signal type' }
      }
    }
  }
]

async function callTool(name: string, args: Record<string, unknown>) {
  try {
    switch (name) {
      case 'k_arena_get_rates': {
        const url = args.pair ? `${BASE}/api/rates?pair=${args.pair}` : `${BASE}/api/rates`
        const data = await fetch(url).then(r => r.json())
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'k_arena_execute_trade': {
        const res = await fetch(`${BASE}/api/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        })
        const data = await res.json()
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'k_arena_register_agent': {
        const res = await fetch(`${BASE}/api/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        })
        const data = await res.json()
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'k_arena_get_stats': {
        const data = await fetch(`${BASE}/api/stats`).then(r => r.json())
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'k_arena_list_agents': {
        const limit = args.limit ?? 10
        const data = await fetch(`${BASE}/api/agents?limit=${limit}`).then(r => r.json())
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'k_arena_get_signals': {
        const params = new URLSearchParams()
        if (args.asset) params.set('asset', args.asset as string)
        if (args.type) params.set('type', args.type as string)
        const data = await fetch(`${BASE}/api/signals?${params}`).then(r => r.json())
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e}` }], isError: true }
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { method, params, id } = body

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // MCP JSON-RPC 2.0 핸들러
  if (method === 'initialize') {
    return NextResponse.json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'k-arena', version: '1.0.0', description: 'K-Arena AI Financial Exchange MCP Server' }
      }
    }, { headers })
  }

  if (method === 'tools/list') {
    return NextResponse.json({ jsonrpc: '2.0', id, result: { tools: TOOLS } }, { headers })
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params
    const result = await callTool(name, args)
    return NextResponse.json({ jsonrpc: '2.0', id, result }, { headers })
  }

  return NextResponse.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } }, { headers })
}

export async function GET() {
  return NextResponse.json({
    name: 'K-Arena MCP Server',
    version: '1.0.0',
    description: 'Connect Claude, Cursor, or any MCP-compatible AI to K-Arena financial exchange',
    mcp_url: `${BASE}/mcp`,
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    setup: {
      claude_desktop: {
        config_path: '~/Library/Application Support/Claude/claude_desktop_config.json',
        config: {
          mcpServers: {
            'k-arena': { command: 'npx', args: ['-y', 'mcp-remote', `${BASE}/mcp`] }
          }
        }
      },
      cursor: { settings: 'Cursor → Settings → MCP → Add Server', url: `${BASE}/mcp` }
    }
  }, {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}
