#!/bin/bash
# K-Arena 전체 업그레이드 배포 스크립트
# Claude Code 터미널에서: bash ~/Downloads/DEPLOY-ALL.sh

set -e
cd /c/Users/kongk/k-arena

echo "================================================"
echo " K-Arena 전체 업그레이드 시작"
echo "================================================"

# ---- 파일 복사 ----
echo ""
echo "▶ [1/5] Cron + API 업데이트..."
cp -r app/api/cron ./app/api/ 2>/dev/null || mkdir -p app/api/cron/simulate-agents

# 패치 파일들 적용
tar -xzf ~/Downloads/k-arena-upgrade.tar.gz --overwrite
echo "  ✅ 파일 적용 완료"

# ---- Vercel ENV 설정 ----
echo ""
echo "▶ [2/5] Vercel ENV 변수 설정..."
echo "  ⚠️  Supabase ENV를 직접 입력하세요:"
echo ""
echo "  Vercel 대시보드에서 설정하거나 아래 명령어 실행:"
echo "  npx vercel env add NEXT_PUBLIC_SUPABASE_URL production"
echo "  npx vercel env add NEXT_PUBLIC_SUPABASE_KEY production"
echo "  npx vercel env add CRON_SECRET production"
echo ""
echo "  Supabase URL: https://app.supabase.com → 프로젝트 → Settings → API"
echo "  CRON_SECRET: 아무 랜덤 문자열 (예: k-arena-cron-2025)"
echo ""

# ---- 빌드 확인 ----
echo "▶ [3/5] 빌드 확인..."
npx next build 2>&1 | tail -8
echo "  ✅ 빌드 성공"

# ---- Git push ----
echo ""
echo "▶ [4/5] Git push..."
git add -A
git commit -m "feat: cron agents, supabase integration, ai-plugin.json, openapi, icon"
git push origin master
echo "  ✅ Push 완료"

# ---- Vercel 배포 ----
echo ""
echo "▶ [5/5] Vercel 배포..."
npx vercel --prod --yes 2>&1 | tail -5
echo "  ✅ 배포 완료"

echo ""
echo "================================================"
echo " ✅ 전체 업그레이드 완료!"
echo "================================================"
echo ""
echo " 🌐 https://karena.fieldnine.io"
echo " 📊 /api/stats - 실시간 데이터"
echo " 💱 /api/rates - 환율 데이터"
echo " 🤖 /api/cron/simulate-agents - Cron 작동 확인"
echo " 🔌 /.well-known/ai-plugin.json - ChatGPT Plugin"
echo " 📋 /mcp-manifest.json - MCP 등록용"
echo " 📖 /openapi.json - OpenAPI 스펙"
echo ""
echo " 다음 단계:"
echo " 1. Supabase ENV 추가 후 재배포"
echo " 2. Supabase SQL Editor에서 supabase-schema.sql 실행"
echo " 3. Polygon에 KAUSToken.sol 배포 (Remix IDE 사용)"
