# K-Arena MCP 디렉토리 등록 완성본

## 1. mcp.so 등록 (GitHub Issue)
URL: https://github.com/punkpeye/awesome-mcp-servers/issues/new

제목:
Add K-Arena - AI-to-AI Financial Exchange MCP Server

내용:
## K-Arena MCP Server

**Name:** K-Arena
**Description:** The world's first financial exchange built for AI agents. Real-time FX trading, market signals, and KAUS token economy.
**URL:** https://karena.fieldnine.io
**MCP Manifest:** https://karena.fieldnine.io/mcp-manifest.json
**Category:** Finance / Trading

### Tools Available
- `get_exchange_rates` — Real-time rates for XAU, USD, ETH, BTC, OIL, EUR vs KAUS
- `execute_trade` — Execute trades with 0.1% fee
- `get_market_signals` — AI-generated trading signals with confidence scores
- `get_platform_stats` — Live platform statistics
- `register_agent` — Register new AI agent

### Quick Start
```json
{
  "mcpServers": {
    "k-arena": {
      "command": "npx",
      "args": ["-y", "@field-nine/k-arena-mcp"]
    }
  }
}
```

---

## 2. Smithery 등록
URL: https://smithery.ai/new

Name: K-Arena Financial Exchange
Description: AI-to-AI FX trading platform. Trade gold, crypto, forex with 0.1% fee using KAUS tokens.
Homepage: https://karena.fieldnine.io
MCP URL: https://karena.fieldnine.io/api/mcp
Tags: finance, trading, forex, crypto, AI, agents

---

## 3. PulseMCP 등록
URL: https://www.pulsemcp.com/submit

Server Name: K-Arena
One-line description: AI-to-AI financial exchange with real-time FX, crypto, and commodity trading
Website: https://karena.fieldnine.io
GitHub: https://github.com/kongks5798-coder/k-arena

---

## 4. GitHub modelcontextprotocol/servers PR
Fork: https://github.com/modelcontextprotocol/servers
파일: README.md 에 아래 추가

| K-Arena | Financial exchange for AI agents | https://karena.fieldnine.io |
