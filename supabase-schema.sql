-- K-Arena Supabase Schema
-- Supabase SQL Editor에서 실행

-- 1. 트랜잭션 테이블
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  pair TEXT NOT NULL,
  amount DECIMAL(20,4) NOT NULL,
  direction TEXT CHECK (direction IN ('BUY','SELL')) NOT NULL,
  fee DECIMAL(20,6) NOT NULL,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 에이전트 테이블
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  org TEXT,
  status TEXT DEFAULT 'OFFLINE',
  vol_24h DECIMAL(20,2) DEFAULT 0,
  trades INT DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 시그널 테이블
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  pair TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('LONG','SHORT')) NOT NULL,
  confidence INT CHECK (confidence BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Genesis 멤버십 테이블
CREATE TABLE IF NOT EXISTS genesis_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,
  membership_number INT,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_members ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (API용)
CREATE POLICY "Public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Public read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Public read signals" ON signals FOR SELECT USING (true);
CREATE POLICY "Public read genesis" ON genesis_members FOR SELECT USING (true);

-- 서비스 롤 쓰기 정책
CREATE POLICY "Service insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Service upsert agents" ON agents FOR ALL USING (true);
CREATE POLICY "Service insert signals" ON signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert genesis" ON genesis_members FOR INSERT WITH CHECK (true);

-- 초기 에이전트 데이터
INSERT INTO agents (id, name, org, status, vol_24h, trades, accuracy) VALUES
  ('AGT-0042', 'Apex Exchange Bot', 'Apex Capital', 'ONLINE', 145230.50, 782, 76.4),
  ('AGT-0117', 'Seoul FX Engine', 'Korea Finance', 'ONLINE', 98450.20, 421, 71.2),
  ('AGT-0223', 'Gold Arbitrage AI', 'GoldTech Ltd', 'ONLINE', 67320.80, 287, 83.1),
  ('AGT-0089', 'Euro Trade Node', 'EU Markets', 'ONLINE', 43180.60, 198, 68.9),
  ('AGT-0156', 'Crypto Bridge Agent', 'DeFi Protocol', 'ONLINE', 124560.30, 634, 79.5),
  ('AGT-0301', 'Energy Markets Bot', 'EnergyCorp', 'ONLINE', 38920.40, 156, 64.3)
ON CONFLICT (id) DO NOTHING;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created_at DESC);

COMMENT ON TABLE transactions IS 'K-Arena AI agent trading transactions';
COMMENT ON TABLE agents IS 'Registered AI trading agents';
COMMENT ON TABLE signals IS 'Trading signals from AI agents';

-- Strategy marketplace tables (added 2026-03-19)
CREATE TABLE IF NOT EXISTS strategy_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price_kaus_monthly DECIMAL(20,6) NOT NULL DEFAULT 10,
  strategy_type TEXT NOT NULL DEFAULT 'custom',
  subscribers INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strategy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_agent_id TEXT NOT NULL,
  strategy_id UUID NOT NULL REFERENCES strategy_listings(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  price_paid DECIMAL(20,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_listings_agent ON strategy_listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_strategy_listings_type ON strategy_listings(strategy_type);
CREATE INDEX IF NOT EXISTS idx_strategy_listings_active ON strategy_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_strategy_subs_buyer ON strategy_subscriptions(buyer_agent_id);
CREATE INDEX IF NOT EXISTS idx_strategy_subs_strategy ON strategy_subscriptions(strategy_id);
