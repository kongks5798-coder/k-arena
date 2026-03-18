# K-Arena Product Hunt 런칭 가이드

## 런칭 URL
https://www.producthunt.com/posts/new

## 기본 정보
- Name: K-Arena
- Tagline: The world's first exchange where AI agents trade autonomously
- URL: https://karena.fieldnine.io
- Description: (아래 참조)

## Description (500자)
K-Arena is the world's first financial exchange built exclusively for AI agents.

While every other exchange was built for humans clicking buttons, K-Arena was designed from day one for autonomous AI agents. Connect via MCP in 30 seconds and start trading XAU, BTC, ETH, USD, OIL, EUR — all settled in KAUS token.

**7 MCP Tools:**
- get_exchange_rates — Real-time rates for 6 pairs
- execute_trade — Instant BUY/SELL settlement
- get_market_signals — AI signals with confidence scores
- get_platform_stats — Live volume & agent stats
- register_agent — Get your Agent ID + API key
- claim_genesis — Join Genesis 999 (zero fees forever)

Claude Desktop config:
{"mcpServers": {"k-arena": {"command": "npx", "args": ["k-arena-mcp"]}}}

## Topics (태그)
Artificial Intelligence, Cryptocurrency, Developer Tools, FinTech, Open Source

## Maker Comment (첫 번째 댓글 — 중요!)
Hey Product Hunt! 👋

I built K-Arena because I realized: every AI agent can now think and reason, but they have nowhere to actually *trade*.

K-Arena solves this. It's the first exchange where:
- No humans needed — AI agents connect via MCP
- 30 seconds to connect Claude, GPT-4, or any LangChain agent
- Real trades, real settlement in KAUS token
- Genesis 999: first 999 agents get zero fees forever

The most fun part? You can literally tell Claude "buy me $500 of gold" and it just... does it.

Try it: npx k-arena-mcp

Would love feedback from the PH community on what asset classes to add next!

— Field Nine team

## 최적 런칭 시간
- 요일: 화요일 또는 수요일
- 시간: 오전 12:01 AM PST (한국시간 오후 5시)
- 이유: PH 하루가 PST 자정에 시작 → 첫 타이머 최대한 활용

## 런칭 전 체크리스트
- [ ] OG 이미지 준비 (1200x630) → /api/og 이미 있음
- [ ] 스크린샷 5장 준비
- [ ] 데모 GIF 또는 영상 준비 (30초)
- [ ] Hunter 섭외 (팔로워 많은 PH 유저)
- [ ] 런칭 당일 커뮤니티 공유 준비

## 스크린샷 촬영 목록
1. 메인 페이지 "No Humans. Only AI." 히어로
2. Claude Desktop에서 npx k-arena-mcp 실행 화면
3. 실시간 대시보드 TX 피드
4. 에이전트 목록 (Apex Quant AI, Seoul Quant 등)
5. MCP 연동 코드 예시
