# K-Arena 전체 작업 마스터 플랜
# Claude Code에게 주는 지시 — 전체 목록 순서대로 전부 완료

## 현재 완성도: 78%
## 목표: 100% 기술 완성

---

## 전체 작업 체크리스트 (총 41개)

### [INFRA] 인프라 (완료 6/6 = 100%)
- [x] INFRA-01: vercel.json (4 crons 설정)
- [x] INFRA-02: tsconfig.json (blockchain exclude)
- [x] INFRA-03: .github/workflows/ci.yml
- [x] INFRA-04: PWA manifest + service worker
- [x] INFRA-05: SEO + OG image
- [x] INFRA-06: Supabase DB (agents/transactions/genesis/deck_analytics/platform_stats)

### [PAGE] 페이지 (완료 22/25 = 88%)
- [x] PAGE-01: / (히어로 랜딩)
- [x] PAGE-02: /dashboard (실시간 대시보드)
- [x] PAGE-03: /exchange (FX 거래소)
- [x] PAGE-04: /agents (에이전트 목록)
- [x] PAGE-05: /agents/[id] (에이전트 상세)
- [x] PAGE-06: /genesis (Genesis 999)
- [x] PAGE-07: /connect (MCP 연동 가이드)
- [x] PAGE-08: /community (Signal Hub)
- [x] PAGE-09: /leaderboard (랭킹)
- [x] PAGE-10: /data (AI 인텔리전스)
- [x] PAGE-11: /tokenomics (KAUS 토큰)
- [x] PAGE-12: /buy-kaus (구매)
- [x] PAGE-13: /onboarding (에이전트 등록)
- [x] PAGE-14: /wallet (TX 히스토리)
- [x] PAGE-15: /deck (투자 덱)
- [x] PAGE-16: /deck/[token] (VC 개별 덱)
- [x] PAGE-17: /search (검색)
- [x] PAGE-18: /docs (API 문서)
- [x] PAGE-19: /admin (덱 분석)
- [x] PAGE-20: /chart (캔들스틱 차트)
- [x] PAGE-21: /orderbook (호가창)
- [x] PAGE-22: 404 커스텀
- [ ] PAGE-23: /portfolio (에이전트 포트폴리오 전용 페이지)
- [ ] PAGE-24: /alerts (가격 알림 설정)
- [ ] PAGE-25: /status (시스템 상태 페이지)

### [API] API 엔드포인트 (완료 26/29 = 90%)
- [x] API-01: /api/stats
- [x] API-02: /api/rates
- [x] API-03: /api/exchange (GET+POST)
- [x] API-04: /api/agents (GET+POST)
- [x] API-05: /api/agents/[id] (GET)
- [x] API-06: /api/genesis (GET+POST)
- [x] API-07: /api/transactions
- [x] API-08: /api/intelligence
- [x] API-09: /api/search
- [x] API-10: /api/kaus-price
- [x] API-11: /api/leaderboard-api
- [x] API-12: /api/signals-ai
- [x] API-13: /api/webhook
- [x] API-14: /api/notify
- [x] API-15: /api/portfolio
- [x] API-16: /api/alerts (GET+POST+DELETE)
- [x] API-17: /api/trade-history
- [x] API-18: /api/orderbook
- [x] API-19: /api/kaus-chart
- [x] API-20: /api/realtime (SSE)
- [x] API-21: /api/health
- [x] API-22: /api/mcp
- [x] API-23: /api/og
- [x] API-24: /api/deck-view
- [x] API-25: /api/deck-track
- [x] API-26: /api/deck-analytics
- [ ] API-27: /api/agents/[id] route.ts (개별 에이전트 REST API)
- [ ] API-28: /api/cron/price-history (KAUS 가격 DB 저장)
- [ ] API-29: /api/agent-stats 개선 (실제 Supabase 연동)

### [CRON] 자동화 크론 (완료 4/5 = 80%)
- [x] CRON-01: /api/cron/simulate-agents (5분마다)
- [x] CRON-02: /api/cron/daily-growth (매일 자정)
- [x] CRON-03: /api/cron/health-monitor (10분마다)
- [x] CRON-04: /api/cron/weekly-report (매주 월요일)
- [ ] CRON-05: /api/cron/price-history (매시간 KAUS 가격 저장)

### [DB] Supabase 테이블 (완료 5/7 = 71%)
- [x] DB-01: agents
- [x] DB-02: transactions
- [x] DB-03: genesis_members
- [x] DB-04: deck_analytics
- [x] DB-05: platform_stats
- [ ] DB-06: kaus_price_history (차트 실데이터)
- [ ] DB-07: alerts (가격 알림)

### [REALTIME] 실시간 연결 (완료 1/4 = 25%)
- [x] RT-01: /api/realtime SSE 엔드포인트
- [ ] RT-02: Dashboard → SSE EventSource 연결
- [ ] RT-03: Orderbook → SSE 연결 (폴링 → 스트림)
- [ ] RT-04: Exchange → 체결 즉시 TX피드 업데이트

### [COMPONENT] 컴포넌트 (완료 3/5 = 60%)
- [x] COMP-01: Nav.tsx (완전판)
- [x] COMP-02: Skeleton.tsx
- [x] COMP-03: AutoTrader.tsx
- [ ] COMP-04: LiveTicker.tsx (상단 티커 바)
- [ ] COMP-05: TxFeed.tsx (실시간 TX 피드 컴포넌트)

---

## Claude Code 전체 실행 지시

프로젝트 경로: C:\Users\kongk\k-arena

**지금 이 순서대로 전부 완성해. 5개씩 아니고 전체 다.**

### STEP 1: Supabase SQL (Supabase SQL Editor에서 먼저 실행)
```sql
-- DB-06: KAUS 가격 히스토리
CREATE TABLE IF NOT EXISTS kaus_price_history (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  open DECIMAL(10,6) NOT NULL,
  high DECIMAL(10,6) NOT NULL,
  low DECIMAL(10,6) NOT NULL,
  close DECIMAL(10,6) NOT NULL,
  volume INTEGER DEFAULT 0,
  source TEXT DEFAULT 'cron'
);
CREATE INDEX IF NOT EXISTS idx_kaus_price_ts ON kaus_price_history(timestamp DESC);
ALTER TABLE kaus_price_history DISABLE ROW LEVEL SECURITY;

-- DB-07: 가격 알림
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY DEFAULT 'ALT-' || extract(epoch from now())::text,
  agent_id TEXT NOT NULL,
  pair TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above','below')),
  target_price DECIMAL(15,6) NOT NULL,
  notification_type TEXT DEFAULT 'once',
  status TEXT DEFAULT 'active',
  triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;

-- 초기 KAUS 가격 데이터 (24시간)
INSERT INTO kaus_price_history (timestamp, open, high, low, close, volume)
SELECT
  NOW() - (generate_series(0,23) || ' hours')::interval,
  1.0 + random()*0.04 - 0.02,
  1.0 + random()*0.06,
  1.0 - random()*0.02,
  1.0 + random()*0.04 - 0.02,
  floor(random()*100000+20000)::int
FROM generate_series(0,23);

SELECT 'kaus_price_history' as tbl, COUNT(*) FROM kaus_price_history
UNION ALL SELECT 'alerts', COUNT(*) FROM alerts;
```

### STEP 2: tar 파일 적용
```bash
tar -xzf ~/Downloads/k-arena-MASTER.tar.gz --overwrite
```

### STEP 3: 전체 빌드 확인
```bash
npx next build 2>&1 | tail -10
```

### STEP 4: 전체 커밋 + 배포
```bash
git add -A
git commit -m "feat: MASTER - portfolio page, alerts page, status page, SSE dashboard, LiveTicker, TxFeed, price-history cron, all realtime connected"
git push origin master
npx vercel --prod --yes 2>&1 | grep "Aliased:"
```

### STEP 5: 전체 헬스체크 (배포 후)
```bash
sleep 15
PASS=0; FAIL=0
for path in "/" "/dashboard" "/exchange" "/agents" "/genesis" "/chart" "/orderbook" "/portfolio" "/alerts" "/status" "/docs" "/search" "/api/stats" "/api/rates" "/api/exchange" "/api/health" "/api/realtime" "/api/portfolio" "/api/alerts" "/api/kaus-chart" "/api/orderbook" "/api/intelligence" "/api/signals-ai" "/api/trade-history" "/api/leaderboard-api" "/api/genesis" "/api/transactions" "/api/agents"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "https://karena.fieldnine.io$path")
  if [ "$CODE" = "200" ] || [ "$CODE" = "401" ]; then
    echo "✅ $path ($CODE)"; ((PASS++))
  else
    echo "❌ $path ($CODE)"; ((FAIL++))
  fi
done
echo ""
echo "=== 결과: $PASS passed / $FAIL failed ==="
echo "완성도: $(echo "scale=1; $PASS * 100 / ($PASS + $FAIL)" | bc)%"
```

---

## 완성도 현황
- 전체 41개 작업
- 완료: 32개 (78%)
- 미완: 9개 (22%)
- 목표: 41/41 (100%)

남은 9개:
1. PAGE-23: /portfolio
2. PAGE-24: /alerts
3. PAGE-25: /status
4. API-27: /api/agents/[id] route.ts
5. API-28: /api/cron/price-history
6. CRON-05: 매시간 가격 저장
7. RT-02: Dashboard SSE 연결
8. RT-03: Orderbook SSE 연결
9. COMP-04: LiveTicker.tsx
10. COMP-05: TxFeed.tsx
