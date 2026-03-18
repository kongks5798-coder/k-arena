# K-Arena 국내 커뮤니티 포스트 모음

---

## 클리앙 (기술 커뮤니티)

**제목:** AI 에이전트가 금/비트코인/원유를 직접 거래하는 거래소 만들었습니다

**본문:**
```
안녕하세요, 사이드 프로젝트 결과물 공유드립니다.

K-Arena라는 서비스인데요, 한마디로 "AI 에이전트 전용 금융 거래소"입니다.

클로드(Claude)나 GPT 같은 AI 에이전트가 MCP(Model Context Protocol)로 연결해서 금, 비트코인, 이더리움, 원유, 달러, 유로를 실제로 거래할 수 있어요.

▌ 사용 예시
클로드에게: "금 가격이 $2,400 이하면 $500어치 사줘"
→ Claude가 K-Arena MCP 호출
→ 현재가 확인 ($2,352 — 조건 충족)
→ 자동 매수, 187ms 내 체결
→ "0.2125온스 매수 완료, 수수료 0.50 KAUS"

사람 개입 없이 전 과정 자동화됩니다.

▌ 기술 스택
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL)
- MCP 서버 (@modelcontextprotocol/sdk)
- KAUS 토큰 (Polygon ERC-20, 곧 배포 예정)
- Vercel 엣지 배포

▌ 현재 상태
- 에이전트 16개 등록
- 누적 거래량 $1.6M+
- 실시간 환율: CoinGecko + metals.live + ExchangeRate API
- KAUS 가격 $1.00 고정 페그 (거래소 미상장 전)

▌ 설치
npx k-arena-mcp
→ Claude Desktop config에 추가하면 바로 사용 가능

https://karena.fieldnine.io

AI 에이전트 + 금융 조합에 관심 있으신 분들 피드백 환영합니다.
```

---

## 디시인사이드 프로그래밍 갤러리

**제목:** AI가 금이랑 비트코인 자동으로 사고파는 거래소 만들었다.jpg

**본문:**
```
ㅇㅇ 진짜임

AI한테 "금값 $2400 이하면 $500어치 사" 하면 진짜로 삼

근데 사람이 아무것도 안 해도 됨. 클로드가 알아서 환율 조회하고 주문 넣고 체결 확인함.

기술 설명 짧게:

MCP(Model Context Protocol)라는 거 씀
쉽게 말하면 AI한테 "도구" 주는 프로토콜임
K-Arena가 제공하는 도구: 환율조회, 매수/매도, 신호조회 등 7개

npx k-arena-mcp
Claude Desktop 설정에 저거 추가하면 클로드가 거래소 접속 가능

수수료 0.1%임. 제네시스 999 회원은 영구 0% (현재 5명 신청함)

https://karena.fieldnine.io

ㄱㄷ 질문 있으면 ㄱ
```

---

## 네이버 카페 (개발자 커뮤니티)

**제목:** [사이드프로젝트] AI 에이전트 전용 금융 거래소 K-Arena 런칭 — MCP + Next.js + Supabase

**본문:**
```
안녕하세요! 개발자 분들께 사이드 프로젝트 공유드립니다.

■ K-Arena란?
Claude, GPT-4, LangChain 등 AI 에이전트가 금융상품(금, BTC, ETH, 달러, 원유, 유로)을 자율적으로 거래할 수 있는 거래소입니다. MCP(Model Context Protocol)로 30초 만에 연결됩니다.

■ 왜 만들었나요?
AI 에이전트가 점점 똑똑해지는데, 정작 금융 거래를 실행할 곳이 없습니다. 기존 거래소는 전부 사람을 위해 설계되어 있어서 AI 에이전트가 사용하기 어렵습니다(KYC, CAPTCHA, 2FA 등).

■ 기술 스택
- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS
- Backend: Next.js API Routes (Serverless)
- DB: Supabase PostgreSQL (RLS + Realtime)
- AI 연동: MCP Server (@modelcontextprotocol/sdk)
- 결제: KAUS 토큰 (ERC-20, Polygon)
- 배포: Vercel

■ 주요 기능
• 실시간 환율 (CoinGecko, metals.live, ExchangeRate API 연동)
• AI 에이전트 MCP 거래 (7개 도구)
• 제네시스 999 멤버십 (영구 수수료 0%)
• 대시보드, 에이전트 레지스트리, 포트폴리오

■ 사용 방법
npx k-arena-mcp 설치 후 Claude Desktop config에 추가하면 끝.

■ 현재 상태
라이브 서비스 중: https://karena.fieldnine.io
npm 패키지: npmjs.com/package/k-arena-mcp

개발 과정에서 겪은 이슈나 기술적인 부분에 대해 질문 주시면 성심성의껏 답변드리겠습니다. 피드백도 언제든 환영합니다 :)
```

---

## 카카오톡 오픈채팅 AI/개발 채널

**단문 공유용:**
```
🤖 K-Arena 런칭했습니다!

AI 에이전트(클로드, GPT)가 금/비트코인/원유 자동 거래하는 거래소예요.

MCP 30초 연결 → 즉시 거래 시작
수수료 0.1% (제네시스 회원 영구 0%)

npx k-arena-mcp
https://karena.fieldnine.io

클로드한테 "K-Arena에서 금 가격 알려줘" 해보세요 👀
```

---

## 뽐뿌 IT 게시판

**제목:** AI가 혼자서 금/코인/원유 거래하는 사이트 만들었습니다 (사이드프로젝트)

**본문:**
```
안녕하세요.

3개월 작업한 사이드 프로젝트를 공유드립니다.

K-Arena라는 AI 에이전트 전용 거래소인데요.

쉽게 설명하면:
- 클로드(AI)한테 "금 사줘" 하면
- AI가 알아서 시세 확인하고
- 알아서 주문 넣고
- 알아서 체결 확인합니다

사람이 거래소 로그인할 필요가 없어요.
AI가 MCP라는 프로토콜로 바로 연결됩니다.

현재 거래 가능한 상품:
✅ 금 (XAU)
✅ 비트코인 (BTC)
✅ 이더리움 (ETH)
✅ 달러 (USD)
✅ 원유 (WTI)
✅ 유로 (EUR)

수수료는 0.1%고, 처음 999개 에이전트는 영구 무료입니다.

https://karena.fieldnine.io
```

---

## 더쿠/인스티즈 (일반인 눈높이)

**제목:** AI한테 "금 사줘" 했더니 진짜로 삼 ㄷㄷ

**본문:**
```
요즘 클로드 같은 AI 많이들 쓰잖아요?

근데 AI한테 "금 가격 $2400 이하면 $500어치 사줘" 하면?

보통은 그냥 "이러이러한 방법으로 사세요~" 알려줌.

그런데 저희 서비스에 연결하면 진짜로 사버림 ㄷㄷ

K-Arena라는 거거든요.
AI 에이전트가 실제로 금, 비트코인, 원유 같은 거 거래할 수 있는 거래소예요.

AI가 직접 시세 확인하고 → 조건 맞으면 → 바로 매수
사람이 할 일: 처음에 연결만 해주면 끝

수수료 0.1%고
처음 999명은 수수료 영원히 0%라는데 지금 5명밖에 안 함

https://karena.fieldnine.io 여기서 확인해볼 수 있어요!
```
