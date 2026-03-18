# K-Arena Hacker News Show HN 가이드

---

## 제목 5가지 버전 (A/B 테스트)

**버전 A (기술 중심):**
```
Show HN: K-Arena – MCP-native financial exchange where AI agents autonomously trade XAU/BTC/ETH
```

**버전 B (문제 중심):**
```
Show HN: I built a financial exchange for AI agents because they had nowhere to actually trade
```

**버전 C (데모 중심):**
```
Show HN: Tell Claude "buy $500 of gold if it's under $2,400" and it actually executes the trade
```

**버전 D (철학 중심):**
```
Show HN: K-Arena – "No Humans. Only AI." – The first exchange designed from day one for autonomous agents
```

**버전 E (숫자 중심):**
```
Show HN: We built an AI agent exchange (7 MCP tools, 6 asset classes, <200ms settlement, 0.1% fee)
```

**추천:** 버전 C — 구체적 데모가 HN에서 가장 반응 좋음.

---

## 본문 (Show HN 포스트)

```
Hey HN,

I'm sharing K-Arena – a financial exchange built specifically for autonomous AI agents.

**Background:**
While experimenting with Claude's tool use, I noticed a gap: AI agents can reason about markets with surprising sophistication, but they can't actually *execute*. Every exchange requires KYC, CAPTCHA, or human-readable UIs. So I built one that doesn't.

**What it does:**
K-Arena exposes a financial exchange as 7 MCP (Model Context Protocol) tools:

- `get_exchange_rates` – live rates for XAU/BTC/ETH/USD/OIL/EUR vs KAUS
- `execute_trade` – BUY/SELL with sub-200ms KAUS settlement
- `get_market_signals` – confidence-scored directional signals
- `get_platform_stats` – platform volume and agent activity
- `register_agent` – programmatic agent registration
- `claim_genesis` – zero-fee founding membership
- `get_transactions` – trade history

**30-second integration:**
```json
{
  "mcpServers": {
    "k-arena": {
      "command": "npx",
      "args": ["k-arena-mcp"]
    }
  }
}
```

**Technical decisions worth discussing:**

1. **KAUS token as settlement**: We chose a custom ERC-20 over USD because AI agents can't open bank accounts. Pegged at $1.00 pre-listing, deployed on Polygon for near-zero gas.

2. **MCP over REST**: While REST works, MCP gives AI agents semantic understanding of tools, not just endpoints. The agent knows it's calling `execute_trade`, not parsing a POST /api/exchange response.

3. **Real data, no simulation**: Rates from CoinGecko (BTC/ETH), metals.live (XAU), ExchangeRate API (EUR). KAUS itself is pegged, with 0.00% change until exchange listing.

4. **Stack**: Next.js 14 App Router, TypeScript, Supabase PostgreSQL, Vercel edge deployment.

**Current state:**
- 16 registered agents (seeded for demo purposes)
- $1.6M+ recorded trading volume
- 5 Genesis 999 members (zero fees forever)
- Live at karena.fieldnine.io
- npm: k-arena-mcp

**Known limitations / honest assessment:**
- KAUS has no external liquidity yet (pre-listing)
- "Trading volume" is seeded demo data — real autonomous trading hasn't happened at scale
- Smart contract audit is internal only so far
- The "AI signal" feature needs real training data

I'm genuinely interested in HN's take on: (1) whether MCP is the right protocol for this, or if gRPC/WebSocket would be better, and (2) where the actual security risks are in autonomous agent finance.

Demo: karena.fieldnine.io
MCP package: npmjs.com/package/k-arena-mcp
GitHub: github.com/kongks5798-coder/k-arena
```

---

## 예상 댓글 Q&A 준비

**Q1: "This is just a mock exchange with fake trading data, not a real exchange"**
```
Fair point, and I should have been clearer. Current trading volume is seeded for demo purposes. The infrastructure for real trades exists (POST /api/exchange works, Supabase records real transactions), but no production AI agents are trading yet. We're essentially at "working product, no organic usage" stage.

What we're working toward: KAUS Polygon mainnet deployment → real liquidity → real autonomous trading.
```

**Q2: "What stops someone from exploiting this financially?"**
```
Good question. Current safeguards:
1. Agent API keys required for trades (register_agent)
2. Per-agent daily trade limits
3. KAUS is pegged — no speculative attack surface pre-listing
4. Supabase RLS prevents cross-agent data access
5. Rate limiting on all endpoints

The bigger risk is currently low because there's no real money involved (KAUS has no external market). Once KAUS lists externally, we'll need much more robust security.
```

**Q3: "MCP is Anthropic's protocol. What about OpenAI/other agents?"**
```
MCP is open protocol (MIT license) — Anthropic published it but doesn't own it. Current support:
- Claude Desktop: native
- LangChain: via MCP adapter
- AutoGPT: community MCP plugin
- Any LLM: via REST API directly (fallback)

Long term, we'll expose both MCP and a standard REST API.
```

**Q4: "Why not just use an existing DEX?"**
```
DEXes require:
- Wallet (private key management)
- On-chain transaction signing
- Gas estimation
- Slippage tolerance settings

That's 4-5 concepts an AI agent must understand before making a single trade. K-Arena reduces it to: "execute_trade(pair='XAU/KAUS', direction='BUY', amount=500)".

We're optimizing for simplicity of integration, not decentralization purity.
```

**Q5: "KAUS token sounds like a rugpull setup"**
```
Understandable concern. Honest answer:
- 100M total supply, no minting after genesis
- Team allocation: 10% (vested 2 years)
- No private sale, no VC round
- Tokenomics designed for utility (settlement), not speculation
- We explicitly position KAUS as a "settlement layer", not investment

We're not trying to pump KAUS. We're trying to make AI agent finance work.
```

**Q6: "What's the actual business model here?"**
```
Simple: 0.1% per trade.

As AI agents proliferate (every company will have them), autonomous trading volume grows. The exchange infrastructure is built. CAC is essentially zero — AI agents discover K-Arena through MCP directories.

Long term: KAUS as the settlement standard for AI-to-AI financial transactions creates network effects.

Current revenue: $0 (pre-launch). We're building for where AI agent adoption goes in 2-3 years.
```

**Q7: "Regulatory concerns?"**
```
This is the honest "we don't fully know yet" answer.

Current position:
- KAUS is not marketed as a security or investment
- K-Arena is not operating as a registered exchange
- Operating in gray area similar to early crypto infrastructure
- We'll need legal counsel before significant scale

This is a real risk we're aware of. Regulatory clarity on AI agent finance doesn't exist yet.
```

**Q8: "Why not open source the whole thing?"**
```
The MCP server (k-arena-mcp) is open on npm.
The main application is currently private.

Plan: open source the core exchange engine once KAUS launches, keep proprietary: the signal generation model and genesis membership management.

If there's strong HN interest, we'd consider full open source.
```
