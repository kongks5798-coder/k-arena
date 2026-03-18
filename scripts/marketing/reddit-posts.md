# K-Arena Reddit 포스트 모음

---

## r/MachineLearning

**제목:** We built an MCP-native financial exchange where AI agents autonomously trade XAU/BTC/ETH — here's the architecture

**본문:**
```
Hey r/ML,

We've been building K-Arena for the past few months — a financial exchange designed from ground up for autonomous AI agents, not humans.

**The problem we're solving:**
Language models can now reason about financial markets with surprising sophistication. But they have no way to actually *execute* — every exchange assumes a human is on the other side (KYC, 2FA, CAPTCHA, human-readable UI).

**Our solution — MCP (Model Context Protocol) native architecture:**

The entire exchange is exposed as 7 MCP tools:

```
get_exchange_rates → real-time XAU/BTC/ETH/USD/OIL/EUR rates
execute_trade → BUY/SELL with sub-200ms KAUS settlement
get_market_signals → confidence-scored directional signals
get_platform_stats → volume/agent activity
register_agent → programmatic agent registration
claim_genesis → zero-fee founding membership
get_transactions → trade history
```

**Stack:**
- Next.js 14 App Router (TypeScript)
- Supabase PostgreSQL (RLS, realtime)
- MCP server via @modelcontextprotocol/sdk
- KAUS token (ERC-20, Polygon — deploying soon)
- Vercel edge deployment with 5 cron jobs

**Settlement layer:**
We chose a custom KAUS token over USD because:
1. Programmable settlement (AI can verify without bank API)
2. No fiat rails needed (removes human touchpoints)
3. Polygon gas fees are negligible for micro-trades

**Current state:**
- 16 agents registered (seeded)
- $1.6M+ recorded volume
- Real exchange rates from CoinGecko + metals.live + ExchangeRate API
- KAUS pegged at $1.00 pre-exchange listing

**What we're genuinely unsure about:**
- How to price KAUS once external liquidity exists
- Whether MCP is the right protocol or if we should build gRPC
- Agent authentication beyond API keys

Would love feedback from people doing work in AI agents / LLM tool use.

Live: karena.fieldnine.io
MCP: npx k-arena-mcp
```

---

## r/artificial

**제목:** Built the first exchange where AI agents (Claude, GPT-4, LangChain) can autonomously trade gold, crypto, and forex. No humans required.

**본문:**
```
Hi r/artificial,

Quick demo of what's possible:

**Tell Claude:** "Check gold price and buy $500 if it's under $2,400"

**Claude does:**
1. Calls get_exchange_rates → XAU: $2,352 (below threshold ✓)
2. Calls execute_trade → BUY $500 XAU
3. Trade settles in 187ms
4. Reports: "Done. Got 0.2125 oz at $2,352. Fee: 0.50 KAUS"

No human involvement at any step.

**How it works:**
K-Arena is a financial exchange built exclusively for AI agents. Connect via MCP (Model Context Protocol) in 30 seconds and your agent can trade XAU, BTC, ETH, USD, OIL, EUR.

**Why this matters:**
AI agents are increasingly being given "agentic" tasks — research, scheduling, code writing. Finance is the obvious next frontier. But there's nowhere for them to actually trade.

K-Arena is that somewhere.

**Try it:**
npx k-arena-mcp

Then in Claude: "Connect to K-Arena and check gold prices"

What would you have your AI agent trade first?
```

---

## r/webdev — Show HN 스타일

**제목:** Show r/webdev: I built a financial exchange for AI agents using Next.js 14, Supabase, and MCP

**본문:**
```
Show r/webdev: K-Arena — AI-native financial exchange

**Tech stack:**
- Next.js 14 App Router with TypeScript
- Supabase (PostgreSQL + RLS + Realtime)
- MCP (Model Context Protocol) server
- Vercel deployment (5 cron jobs for market simulation)
- Tailwind CSS with dark terminal aesthetic

**What I learned building this:**

1. **Next.js App Router + Supabase is excellent** for real-time data but the caching behavior with force-dynamic routes is non-obvious

2. **MCP protocol is surprisingly simple** — the entire exchange is ~200 lines in index.js using @modelcontextprotocol/sdk

3. **CORS on .well-known routes** — needed custom next.config.js headers for Smithery MCP scanner to work

4. **Vercel cron limitations** — free tier is 1/day, paid is 1/minute. Had to architect crons carefully.

5. **Supabase RLS gotcha** — anon key reads work fine, but write operations need explicit policies or service role key

**Design decisions I'm second-guessing:**
- Using NEXT_PUBLIC_ for Supabase key (readable client-side — mitigated by RLS but still)
- In-memory fallbacks vs. always failing loud
- Fixed KAUS peg vs. algorithmic price discovery

**Live:** karena.fieldnine.io
**Repo:** github.com/kongks5798-coder/k-arena
**MCP package:** npmjs.com/package/k-arena-mcp

Happy to answer any architecture questions!
```

---

## r/SideProject

**제목:** After 3 months of building, launched the world's first exchange for AI agents. Here's what I learned.

**본문:**
```
Hey r/SideProject,

Just launched K-Arena — a financial exchange built exclusively for AI agents, not humans.

**The origin story:**
I was playing with Claude agents and realized: they can reason about gold prices, calculate optimal position sizes, and articulate risk — but they literally cannot execute a trade anywhere. Every exchange has KYC, CAPTCHA, and UX designed for humans.

So I built the exchange they needed.

**What it does:**
- AI agents connect via MCP (Model Context Protocol)
- Trade XAU, BTC, ETH, USD, OIL, EUR settled in KAUS token
- 0.1% fee (Genesis members: 0% forever)
- Sub-200ms settlement

**Brutal honest lessons:**

✅ What worked:
- MCP as the integration layer (brilliant protocol, underused)
- Supabase for rapid prototyping (got to real data in a week)
- Dark terminal aesthetic (fits the "AI exchange" brand perfectly)
- Publishing to npm early (k-arena-mcp)

❌ What didn't:
- Spent 2 weeks on blockchain before realizing I needed the app first
- Over-engineered the cron system (5 crons when 2 would do)
- Kept adding "just one more page" instead of shipping

**Current metrics:**
- 16 registered AI agents
- $1.6M+ trading volume (seeded for demo)
- 5 Genesis members claimed
- Live at karena.fieldnine.io

**What's next:**
KAUS token deployment on Polygon, Smithery MCP directory listing, and getting actual AI agents trading in real-time.

If you're building AI agents, try: npx k-arena-mcp

AMA!
```

---

## r/Entrepreneur

**제목:** I built infrastructure for the $10T question: where do AI agents go when they need to make financial transactions?

**본문:**
```
Every major bank and exchange is preparing for AI agents in finance.

They're all building the wrong thing.

They're adding AI *features* to human exchanges. Chatbots. AI advisors. "Smart" recommendations.

That's not the future. The future is exchanges built FOR AI, not with AI bolted on.

**The opportunity I saw:**
When AI agents can autonomously manage portfolios, execute trades, and optimize positions 24/7 — they need infrastructure. Not Fidelity with a chatbot. Real, AI-native infrastructure.

**K-Arena is my answer:**
- Connect via MCP in 30 seconds (no KYC, no CAPTCHA)
- Trade 6 asset classes (XAU, BTC, ETH, USD, OIL, EUR)
- Sub-200ms settlement in KAUS token
- 0.1% fee — Genesis 999 members get zero fees forever

**The business model:**
0.1% × growing AI agent trade volume.

As AI agents proliferate (every company will have them), the volume grows automatically. Zero CAC for most users — agents discover K-Arena through MCP directories and connect themselves.

**Why now:**
MCP just hit 1.0. Anthropic, OpenAI, and every major AI company supports it. The infrastructure moment is now, before the volume arrives.

**Current traction:**
karena.fieldnine.io | MCP: npx k-arena-mcp

Would appreciate feedback from entrepreneurs who've seen infrastructure plays succeed/fail.
```

---

## r/CryptoCurrency

**제목:** KAUS token: the settlement layer for AI agent trading. Here's why we built it and why it's different.

**본문:**
```
Not here to pump. Here to explain a design decision.

We built K-Arena — a financial exchange for AI agents. And we created KAUS token as the settlement layer. Here's why.

**Why not USD?**
- Fiat rails require human verification (KYC)
- Bank APIs have rate limits and human-approval flows
- Stablecoins on-chain still need wallet setup

**Why not existing crypto (ETH, USDC)?**
- Gas costs make micro-trades ($10-$500) uneconomical
- Existing tokens weren't designed for AI settlement
- No programmatic issuance/redemption

**Why KAUS?**
- ERC-20 on Polygon (near-zero gas)
- Programmatic minting for AI agents
- $1.00 peg (pre-exchange listing — stable reference)
- Designed to be settled, not speculated

**The tokenomics:**
- Total supply: 100M KAUS
- 60% — Agent liquidity pool
- 20% — Genesis 999 members
- 10% — Protocol reserves
- 10% — Team/development

**Current status:**
KAUS is in pre-launch. Smart contract audited internally, Polygon mainnet deployment pending (need gas for initial liquidity).

K-Arena itself is live at karena.fieldnine.io with KAUS pegged at $1.00.

Not financial advice. We're infrastructure, not speculation.
```
