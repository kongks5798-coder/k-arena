#!/bin/bash
set -e
cd /c/Users/kongk/k-arena

echo "======================================"
echo " K-Arena 최종 업그레이드 배포"
echo "======================================"

# 파일 적용
tar -xzf ~/Downloads/k-arena-next.tar.gz --overwrite
echo "✅ 파일 적용"

# 빌드 확인
echo "▶ 빌드 확인..."
npx next build 2>&1 | tail -5
echo "✅ 빌드 성공"

# Git push
git add -A
git commit -m "feat: enhanced stats/genesis API, cron with real DB writes, MCP package"
git push origin master
echo "✅ Push 완료"

# Vercel 배포
npx vercel --prod --yes 2>&1 | tail -5
echo "✅ 배포 완료!"

echo ""
echo "🌐 https://karena.fieldnine.io"
echo ""
echo "다음 할 것:"
echo "1. cd mcp-package && npm publish --access public"
echo "2. https://smithery.ai/new 등록"
echo "3. https://producthunt.com 제품 등록"
