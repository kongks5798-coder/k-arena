#!/bin/bash
# K-Arena 자동 성장 시스템
# 매일 실행: crontab -e → 0 9 * * * bash ~/k-arena-launch/auto-growth.sh

echo "=== K-Arena Daily Growth Check - $(date) ==="

# 1. 헬스체크
echo "▶ Platform health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://karena.fieldnine.io/api/health --max-time 10)
echo "  /api/health: $STATUS"

# 2. 실시간 통계 출력
echo "▶ Current stats..."
curl -s https://karena.fieldnine.io/api/stats | python3 -c "
import json,sys
d=json.load(sys.stdin)
p=d.get('platform',{})
print(f'  Volume: \${p.get(\"total_volume_24h\",0):,.0f}')
print(f'  Agents: {p.get(\"active_agents\",0)}/{p.get(\"total_agents\",0)}')
print(f'  KAUS: \${p.get(\"kaus_price\",0):.4f}')
print(f'  Genesis: {p.get(\"genesis_sold\",0)}/999')
print(f'  Source: {d.get(\"data_source\",\"unknown\")}')
" 2>/dev/null

# 3. 일일 cron 트리거 (Supabase 데이터 갱신)
echo "▶ Triggering daily cron..."
curl -s -o /dev/null "https://karena.fieldnine.io/api/cron/simulate-agents" \
  -H "Authorization: Bearer ${CRON_SECRET:-k-arena-cron-secret}"

echo "✅ Daily growth check complete"
