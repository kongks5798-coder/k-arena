#!/bin/bash
# K-Arena MCP 디렉토리 등록 자동화
# Claude Code 터미널에서 실행

echo "======================================"
echo " K-Arena MCP 등록 시작"
echo "======================================"

# 1. awesome-mcp-servers GitHub Issue 자동 생성
echo ""
echo "▶ [1/4] mcp.so (awesome-mcp-servers) 등록..."
gh issue create \
  --repo "punkpeye/awesome-mcp-servers" \
  --title "Add K-Arena - AI-to-AI Financial Exchange MCP Server" \
  --body "## K-Arena MCP Server

**Name:** K-Arena
**Description:** The world's first financial exchange built for AI agents. Real-time FX trading, market signals, and KAUS token economy.
**URL:** https://karena.fieldnine.io
**MCP Manifest:** https://karena.fieldnine.io/mcp-manifest.json
**OpenAPI:** https://karena.fieldnine.io/openapi.json
**Category:** Finance / Trading / Blockchain

### Tools Available
- \`get_exchange_rates\` — Real-time rates for XAU, USD, ETH, BTC, OIL, EUR vs KAUS
- \`execute_trade\` — Execute trades with 0.1% fee
- \`get_market_signals\` — AI-generated trading signals
- \`get_platform_stats\` — Live platform statistics
- \`get_intelligence\` — Claude AI market analysis reports

### Quick Start (Claude Desktop)
\`\`\`json
{
  \"mcpServers\": {
    \"k-arena\": {
      \"command\": \"npx\",
      \"args\": [\"-y\", \"@field-nine/k-arena-mcp\"]
    }
  }
}
\`\`\`

### Links
- Homepage: https://karena.fieldnine.io
- GitHub: https://github.com/kongks5798-coder/k-arena
- ai-plugin.json: https://karena.fieldnine.io/.well-known/ai-plugin.json" \
  2>&1

echo "  완료 (gh CLI 없으면 수동으로)"

# 2. PulseMCP curl 등록
echo ""
echo "▶ [2/4] PulseMCP 등록..."
curl -s -X POST "https://www.pulsemcp.com/api/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "K-Arena",
    "description": "AI-to-AI financial exchange with real-time FX, crypto, and commodity trading",
    "url": "https://karena.fieldnine.io",
    "github": "https://github.com/kongks5798-coder/k-arena",
    "category": "finance"
  }' 2>&1 || echo "  PulseMCP API 없음 - 수동 등록 필요"

echo ""
echo "✅ 자동 등록 완료"
echo ""
echo "수동으로 해야 할 것:"
echo "1. https://smithery.ai/new → K-Arena 등록"
echo "2. https://producthunt.com → 제품 등록 (product-hunt.md 참고)"
