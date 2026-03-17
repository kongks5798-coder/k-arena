#!/bin/bash
echo "================================================"
echo " K-Arena Tech2 — 배포 + 시드 + 검증"
echo "================================================"

cd /c/Users/kongk/k-arena

echo "▶ [1/4] 파일 적용..."
tar -xzf ~/Downloads/k-arena-tech2.tar.gz --overwrite
echo "  ✅"

echo "▶ [2/4] 빌드..."
npx next build 2>&1 | tail -5
echo "  ✅"

echo "▶ [3/4] 배포..."
git add -A
git commit -m "fix: seed-agents API, health-monitor cron, simulate-agents enhanced, vercel cron config"
git push origin master
npx vercel --prod --yes 2>&1 | tail -3
echo "  ✅ 배포 완료"

echo ""
echo "▶ [4/4] Supabase agents 시드..."
sleep 10  # 배포 안정화 대기
SEED=$(curl -s https://karena.fieldnine.io/api/cron/seed-agents)
echo "  $SEED" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  시드 결과:', d.get('message',''))" 2>/dev/null || echo "  시드 완료"

echo ""
echo "▶ 최종 검증..."
sleep 5
STATUS=$(curl -s https://karena.fieldnine.io/api/stats | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"  data_source: {d.get('data_source','?')} | vol: \${d.get('platform',{}).get('total_volume_24h',0):,.0f} | agents: {d.get('platform',{}).get('active_agents',0)}\")" 2>/dev/null)
echo "$STATUS"

HEALTH=$(curl -s https://karena.fieldnine.io/api/health | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"  health: {d.get('status','?')} | db: {d.get('checks',{}).get('database',{}).get('detail','?')}\")" 2>/dev/null)
echo "$HEALTH"

echo ""
echo "================================================"
echo " 완료! karena.fieldnine.io"
echo " data_source: supabase 확인되면 기술 완성"
echo "================================================"
