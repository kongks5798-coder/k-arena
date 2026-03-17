#!/bin/bash
set -e
cd /c/Users/kongk/k-arena
echo "▶ 파일 적용..."
tar -xzf ~/Downloads/k-arena-next.tar.gz --overwrite
echo "▶ 빌드 확인..."
npx next build 2>&1 | tail -5
echo "▶ 배포..."
git add -A
git commit -m "feat: supabase live data, genesis real API, cron simulator, agent stats"
git push origin master
echo "✅ 완료! https://karena.fieldnine.io"
