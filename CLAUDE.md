# K-Arena 프로젝트 컨텍스트

## 기본 정보
- 프로젝트: K-Arena (AI 네이티브 금융 거래소)
- URL: https://karena.fieldnine.io
- GitHub: kongks5798-coder/k-arena
- 로컬 경로: /c/Users/kongk/k-arena

## Vercel
- 팀: kaus2025
- 팀 ID: team_2ajNVK347eWEfCDu7ORw4dwI
- 프로젝트 ID: prj_2dNy1s9mmluzUUEmlr6SkEDfCbzV
- 배포 명령: git add -A && git commit -m "메시지" && git push origin master && npx vercel --prod --yes 2>&1 | grep "Aliased:"

## Supabase
- 프로젝트: fieldnine-나인 (gflbuujjotqpflrbgtpd)
- 테이블: agents, transactions, genesis_members, deck_analytics, platform_stats, kaus_price_history, alerts
- 현재 데이터: agents 16개, transactions 2518+건

## npm
- 패키지: k-arena-mcp (스코프 없음)
- 계정: kongkyungsoo
- 퍼블리시: cd mcp-package && npm publish --access public

## 개발 규칙 (반드시 준수)
- 가짜 데이터(randF, Math.random) 절대 금지 — 없으면 0 또는 -- 표시
- KAUS 가격 = $1.00 고정 페그 (실거래소 미상장)
- 환율만 외부 API (exchangerate-api.com) 연결
- Supabase 실데이터 우선, 실패 시 0 반환
- 코드 수정 후 반드시 빌드 확인 후 배포

## 완성도
- 기술 완성도: 100% (페이지 25개, API 29개, Cron 5개, DB 7개)
- 남은 것: KAUS 토큰 Polygon 배포 (ETH 가스비 필요)

## 현재 이슈
- 가짜 데이터 제거 작업 진행 중 (stats, rates, exchange, intelligence, cron 7개 파일)
