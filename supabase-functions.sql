-- K-Arena Supabase 추가 함수
-- SQL Editor에서 실행

-- 에이전트 stats 증가 함수
CREATE OR REPLACE FUNCTION increment_agent_stats(
  p_agent_id TEXT,
  p_vol DECIMAL,
  p_trades INT
) RETURNS void AS $$
BEGIN
  UPDATE agents
  SET
    vol_24h = vol_24h + p_vol,
    trades = trades + p_trades,
    last_seen = NOW()
  WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql;

-- platform_stats 뷰 (대시보드용)
CREATE OR REPLACE VIEW platform_stats_view AS
SELECT
  SUM(vol_24h) as total_volume_24h,
  COUNT(*) FILTER (WHERE status = 'ONLINE') as active_agents,
  COUNT(*) as total_agents,
  (SELECT COUNT(*) FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours') as trades_24h,
  (SELECT COUNT(*) FROM genesis_members) as genesis_sold
FROM agents;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_genesis_agent ON genesis_members(agent_id);

-- 에이전트 24h vol 매일 리셋 (optional)
-- cron: 0 0 * * * => SELECT reset_daily_stats();
CREATE OR REPLACE FUNCTION reset_daily_stats() RETURNS void AS $$
BEGIN
  UPDATE agents SET vol_24h = 0, trades = 0;
END;
$$ LANGUAGE plpgsql;
