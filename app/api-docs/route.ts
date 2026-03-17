import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'K-Arena AI Financial Exchange API',
    version: '1.0.0',
    description: 'The global AI-native financial exchange. FX, commodities, crypto, energy — 0.1% fee. Built exclusively for AI agents and autonomous systems.',
    contact: { name: 'K-Arena', url: 'https://karena.fieldnine.io' },
    'x-llm-description': 'K-Arena is a financial exchange platform designed for AI agents. Agents can exchange currencies, commodities, crypto, and energy tokens at 0.1% fee. Use the /api/exchange endpoint to execute trades, /api/rates for live prices, and /api/agents to register your agent identity.',
  },
  servers: [{ url: 'https://karena.fieldnine.io', description: 'Production' }],
  paths: {
    '/api/rates': {
      get: {
        operationId: 'getLiveRates',
        summary: 'Get live exchange rates for all supported asset pairs',
        description: 'Returns real-time exchange rates for FX, crypto, commodities, and energy pairs. Updated every 5 seconds from multi-source oracle.',
        parameters: [{ name: 'pair', in: 'query', required: false, schema: { type: 'string', example: 'BTC/USD' }, description: 'Filter by specific pair. If omitted, returns all pairs.' }],
        responses: {
          '200': {
            description: 'Live rates',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                ok: { type: 'boolean' },
                ts: { type: 'string', format: 'date-time' },
                rates: { type: 'object', additionalProperties: { type: 'object', properties: {
                  price: { type: 'number' }, change24h: { type: 'number' }, high24h: { type: 'number' }, low24h: { type: 'number' }, volume24h: { type: 'string' }
                }}}
              }
            }}}
          }
        },
        'x-llm-hint': 'Call this before executing any trade to get the current exchange rate.'
      }
    },
    '/api/exchange': {
      get: {
        operationId: 'getTransactionHistory',
        summary: 'Get recent transaction history',
        parameters: [
          { name: 'agent_id', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { '200': { description: 'Transaction list' } }
      },
      post: {
        operationId: 'executeExchange',
        summary: 'Execute a currency/asset exchange',
        description: 'Execute a trade between any two supported assets. Fee is 0.1% of input amount, charged in KAUS. Settlement typically < 1.5s.',
        'x-llm-hint': 'This is the core trading endpoint. Always fetch /api/rates first to confirm the current rate before executing.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['agent_id', 'from_currency', 'to_currency', 'input_amount'],
            properties: {
              agent_id: { type: 'string', description: 'Your registered agent UUID or wallet address' },
              from_currency: { type: 'string', example: 'USD', description: 'Source asset: USD, EUR, JPY, GBP, BTC, ETH, KAUS, XAU, WTI, kWh' },
              to_currency: { type: 'string', example: 'KRW' },
              input_amount: { type: 'number', example: 1000000, description: 'Amount of from_currency to exchange' },
              slippage_tolerance: { type: 'number', default: 0.005, description: 'Max acceptable slippage (0.005 = 0.5%)' }
            }
          }}}
        },
        responses: {
          '200': { description: 'Trade executed', content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              tx_id: { type: 'string' },
              from_currency: { type: 'string' }, to_currency: { type: 'string' },
              input_amount: { type: 'number' }, output_amount: { type: 'number' },
              rate: { type: 'number' }, fee_kaus: { type: 'number' },
              settlement_ms: { type: 'integer' }, status: { type: 'string', enum: ['settled', 'pending', 'failed'] }
            }
          }}}}
        }
      }
    },
    '/api/agents': {
      get: {
        operationId: 'listAgents',
        summary: 'List registered AI agents',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }],
        responses: { '200': { description: 'Agent list' } }
      },
      post: {
        operationId: 'registerAgent',
        summary: 'Register a new AI agent on K-Arena',
        description: 'Register your AI agent to get an agent_id for trading. Genesis membership available for first 999 agents.',
        'x-llm-hint': 'Call this once to register your agent. Store the returned agent_id for all subsequent API calls.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            required: ['name', 'type'],
            properties: {
              name: { type: 'string', example: 'MyTradingAgent-001', description: 'Unique identifier for your agent' },
              type: { type: 'string', enum: ['AI Trading', 'Institutional', 'DAO', 'Research', 'Other'] },
              wallet_address: { type: 'string', description: 'Blockchain wallet address (optional)' },
              asset_classes: { type: 'array', items: { type: 'string' }, example: ['FX', 'CRYPTO'] }
            }
          }}}
        },
        responses: { '200': { description: 'Agent registered', content: { 'application/json': { schema: {
          type: 'object',
          properties: { ok: { type: 'boolean' }, agent_id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, is_genesis: { type: 'boolean' } }
        }}}}}
      }
    },
    '/api/stats': {
      get: {
        operationId: 'getPlatformStats',
        summary: 'Get K-Arena platform statistics',
        description: 'Returns aggregate platform metrics: active agents, total volume, transaction count, signals.',
        responses: { '200': { description: 'Platform stats' } }
      }
    },
    '/api/genesis': {
      get: {
        operationId: 'getGenesisStatus',
        summary: 'Get Genesis 999 membership status',
        description: 'Returns how many Genesis slots remain. Genesis members get 0% platform fees permanently.',
        responses: { '200': { description: 'Genesis status' } }
      }
    }
  },
  components: {
    schemas: {
      Agent: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string' },
          is_genesis: { type: 'boolean' },
          is_active: { type: 'boolean' },
          daily_limit: { type: 'number' },
          asset_classes: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  'x-ai-agent-guide': {
    quickstart: [
      '1. GET /api/stats — verify platform is online',
      '2. POST /api/agents — register your agent, store agent_id',
      '3. GET /api/rates — fetch current exchange rates',
      '4. POST /api/exchange — execute your first trade',
      '5. GET /api/exchange?agent_id={id} — verify settlement'
    ],
    supported_pairs: ['USD/KRW','EUR/USD','JPY/USD','GBP/USD','BTC/USD','ETH/USD','KAUS/USD','XAU/USD','WTI/USD','kWh/KAUS'],
    fee: '0.1% of input amount, charged in KAUS',
    settlement: 'Average 1.2 seconds',
    demo_note: 'Platform is currently in demo mode. All trades are simulated.'
  }
}

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    }
  })
}
