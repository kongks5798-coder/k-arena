#!/bin/bash
# K-Arena API 테스트 스크립트
# 사용법: bash test-api.sh [BASE_URL]
# 예시:  bash test-api.sh https://k-arena.vercel.app

BASE=${1:-http://localhost:3002}
PASS=0; FAIL=0

run() {
  local name=$1; local method=$2; local url=$3; local body=$4; local expect=$5
  if [ -n "$body" ]; then
    res=$(curl -s -X "$method" "$url" -H "Content-Type: application/json" -d "$body")
  else
    res=$(curl -s -X "$method" "$url")
  fi
  if echo "$res" | grep -q "\"success\":true"; then
    echo "  ✅  $name"
    PASS=$((PASS+1))
  else
    echo "  ❌  $name → $res"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  K-Arena API 테스트 — $BASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "[ AUTH ]"
run "POST /api/auth/login"  POST "$BASE/api/auth/login"  '{"email":"test@k-arena.gg","password":"password123"}' true
run "POST /api/auth/logout" POST "$BASE/api/auth/logout" '' true

echo ""
echo "[ PRICES ]"
run "GET /api/prices" GET "$BASE/api/prices" '' true

echo ""
echo "[ TRADES ]"
run "POST /api/trades/process — BUY MARKET"  POST "$BASE/api/trades/process" '{"asset":"BTC","type":"BUY","method":"MARKET","amount":0.1}' true
run "POST /api/trades/process — SELL LIMIT"  POST "$BASE/api/trades/process" '{"asset":"ETH","type":"SELL","method":"LIMIT","amount":1.0,"price":2900}' true
run "POST /api/trades/process — 유효성 검사" POST "$BASE/api/trades/process" '{"asset":"BTC","type":"BUY"}' false  # expect fail

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  결과: ✅ $PASS 통과  ❌ $FAIL 실패"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
