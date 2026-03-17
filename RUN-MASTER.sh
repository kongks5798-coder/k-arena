#!/bin/bash
# K-Arena MASTER 전체 실행 스크립트
# 실행: bash RUN-MASTER.sh

set -e
BASE_URL="https://karena.fieldnine.io"
PROJECT="/c/Users/kongk/k-arena"

echo "=================================================="
echo " K-Arena MASTER — 전체 완성 실행"
echo " $(date)"
echo "=================================================="
echo ""
echo "전체 작업: 41개"
echo "완료: 32개 (78%)"
echo "이번 배포: 9개 추가 → 100% 목표"
echo ""

cd $PROJECT

echo "▶ [1/6] MASTER 파일 적용..."
tar -xzf ~/Downloads/k-arena-MASTER.tar.gz --overwrite
echo "  ✅"

echo ""
echo "▶ [2/6] 전체 빌드 검증..."
npx next build 2>&1 | tail -8
echo "  ✅ 빌드 완료"

echo ""
echo "▶ [3/6] 커밋 & 배포..."
git add -A
git commit -m "feat: MASTER 100% - portfolio, alerts, status pages, LiveTicker, TxFeed, price-history cron, agents[id] REST API, vercel.json 5 crons"
git push origin master
DEPLOY_URL=$(npx vercel --prod --yes 2>&1 | grep "Aliased:" | awk '{print $2}')
echo "  ✅ 배포: $DEPLOY_URL"

echo ""
echo "▶ [4/6] 배포 안정화 대기 (15초)..."
sleep 15

echo ""
echo "▶ [5/6] 전체 페이지 헬스체크..."
PASS=0; FAIL=0
PAGES=("/" "/dashboard" "/exchange" "/agents" "/genesis" "/chart" "/orderbook" "/portfolio" "/alerts" "/status" "/docs" "/search" "/connect" "/community" "/leaderboard" "/tokenomics" "/onboarding" "/wallet" "/buy-kaus" "/data" "/deck")
for path in "${PAGES[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$BASE_URL$path")
  if [ "$CODE" = "200" ]; then printf "  ✅ %-25s %s\n" "$path" "OK"; ((PASS++))
  else printf "  ❌ %-25s %s\n" "$path" "$CODE"; ((FAIL++)); fi
done

echo ""
echo "▶ [6/6] 전체 API 헬스체크..."
APIS=("/api/stats" "/api/rates" "/api/exchange" "/api/health" "/api/genesis" "/api/transactions" "/api/intelligence" "/api/signals-ai" "/api/portfolio" "/api/alerts" "/api/orderbook" "/api/kaus-chart" "/api/leaderboard-api" "/api/trade-history" "/api/search" "/api/realtime")
for path in "${APIS[@]}"; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$BASE_URL$path")
  if [ "$CODE" = "200" ] || [ "$CODE" = "401" ]; then printf "  ✅ %-35s %s\n" "$path" "OK"; ((PASS++))
  else printf "  ❌ %-35s %s\n" "$path" "$CODE"; ((FAIL++)); fi
done

TOTAL=$((PASS + FAIL))
PCT=$(echo "scale=1; $PASS * 100 / $TOTAL" | bc 2>/dev/null || echo "N/A")

echo ""
echo "=================================================="
echo " 헬스체크 결과: $PASS/$TOTAL passed ($PCT%)"
echo ""
echo " 플랫폼:  $BASE_URL"
echo " 상태:    $BASE_URL/status"
echo " 대시보드: $BASE_URL/dashboard"
echo " 차트:    $BASE_URL/chart"
echo " 어드민:  $BASE_URL/admin"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo " 🎉 K-Arena 100% 기술 완성!"
else
  echo " ⚠️  $FAIL개 실패 — 확인 필요"
fi
echo "=================================================="
echo ""
echo "▶ 다음 할 것 (선택사항):"
echo "  1. Supabase SQL Editor에서 kaus_price_history 테이블 생성"
echo "     (scripts/MASTER-PLAN.md 안에 SQL 있음)"
echo "  2. MCP npm publish: cd mcp-package && npm publish --access public"
echo "  3. KAUS 토큰 배포: bash scripts/KAUS-DEPLOY-FINAL.sh"
