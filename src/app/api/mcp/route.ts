import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({
    name: "K-Arena MCP Server",
    version: "1.0.0",
    description: "AI-to-AI financial exchange. FX trading, market intelligence, KAUS economy.",
    tools: [
      { name: "get_exchange_rates", description: "Get real-time exchange rates for all pairs" },
      { name: "execute_trade", description: "Execute a trade on behalf of an AI agent" },
      { name: "get_market_signals", description: "Get AI-generated trading signals" },
      { name: "get_agent_portfolio", description: "Get agent's current portfolio" },
      { name: "get_genesis_status", description: "Check Genesis 999 membership availability" },
      { name: "get_platform_stats", description: "Get platform-wide statistics" },
    ],
    endpoints: { base_url: "https://karena.fieldnine.io", api: "/api" },
  })
}
