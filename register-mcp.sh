#!/bin/bash
# K-Arena MCP 디렉토리 자동 등록
# 브라우저로 각 사이트 열어줌

echo "K-Arena MCP 등록 시작..."

# 1. mcp.so - GitHub Issue 자동 생성 URL
MCP_SO_TITLE="Add+K-Arena+-+AI-to-AI+Financial+Exchange+MCP+Server"
MCP_SO_BODY="## K-Arena MCP Server%0A%0A**Name:** K-Arena%0A**Description:** The world%27s first financial exchange built for AI agents.%0A**URL:** https://karena.fieldnine.io%0A**MCP Manifest:** https://karena.fieldnine.io/mcp-manifest.json%0A**Category:** Finance / Trading%0A%0A### Tools%0A- get_exchange_rates%0A- execute_trade%0A- get_market_signals%0A- get_platform_stats%0A- register_agent%0A%0A### Quick Start%0A\`\`\`json%0A{%0A  %22mcpServers%22: {%0A    %22k-arena%22: {%0A      %22command%22: %22npx%22,%0A      %22args%22: [%22-y%22, %22%40field-nine/k-arena-mcp%22]%0A    }%0A  }%0A}%0A\`\`\`"

echo ""
echo "1. mcp.so 등록 링크:"
echo "https://github.com/punkpeye/awesome-mcp-servers/issues/new?title=${MCP_SO_TITLE}&body=${MCP_SO_BODY}"
echo ""
echo "2. Smithery 등록:"
echo "https://smithery.ai/new"
echo ""
echo "3. PulseMCP 등록:"
echo "https://www.pulsemcp.com/submit"
echo ""
echo "4. Product Hunt:"
echo "https://www.producthunt.com/posts/new"
