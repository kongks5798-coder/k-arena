-- K-Arena Supabase Schema
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────
-- 1. AGENTS
-- ─────────────────────────────────────────
create table if not exists agents (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  type             text not null check (type in (
                     'AI Trading Agent','Government Institution','Central Bank',
                     'Sovereign Wealth Fund','Hedge Fund AI','DAO Treasury','Other Institution')),
  wallet_address   text not null unique,
  description      text,
  daily_limit      numeric not null default 100000000,
  asset_classes    text[] not null default '{"FX","COMMODITIES"}',
  api_key          text unique not null,
  secret_key_hash  text not null,
  is_genesis       boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  last_active_at   timestamptz
);

create index if not exists agents_api_key_idx on agents(api_key);
create index if not exists agents_type_idx    on agents(type);

-- ─────────────────────────────────────────
-- 2. TRANSACTIONS
-- ─────────────────────────────────────────
create table if not exists transactions (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references agents(id),
  from_currency   text not null,
  to_currency     text not null,
  input_amount    numeric not null,
  output_amount   numeric not null,
  rate            numeric not null,
  fee_kaus        numeric not null default 0,
  settlement_ms   integer not null,
  status          text not null default 'settled' check (status in ('settled','routing','clearing','failed')),
  created_at      timestamptz not null default now()
);

create index if not exists tx_agent_id_idx   on transactions(agent_id);
create index if not exists tx_created_at_idx on transactions(created_at desc);
create index if not exists tx_pair_idx       on transactions(from_currency, to_currency);

-- ─────────────────────────────────────────
-- 3. GENESIS MEMBERS
-- ─────────────────────────────────────────
create table if not exists genesis_members (
  id               uuid primary key default gen_random_uuid(),
  agent_id         uuid not null unique references agents(id),
  wallet_address   text not null,
  slot_number      integer not null unique check (slot_number between 1 and 999),
  payment_method   text not null default 'kaus' check (payment_method in ('kaus','usdc','btc','wire')),
  payment_amount   numeric not null default 500,
  is_active        boolean not null default true,
  claimed_at       timestamptz not null default now(),
  -- helper column for display
  agent_name       text
);

create index if not exists genesis_slot_idx on genesis_members(slot_number);

-- ─────────────────────────────────────────
-- 4. KAUS STAKING
-- ─────────────────────────────────────────
create table if not exists staking_positions (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references agents(id),
  amount_kaus     numeric not null,
  plan            text not null check (plan in ('flexible','30d','90d')),
  apy             numeric not null,
  started_at      timestamptz not null default now(),
  unlock_at       timestamptz,
  status          text not null default 'active' check (status in ('active','unlocking','completed')),
  rewards_earned  numeric not null default 0
);

-- ─────────────────────────────────────────
-- 5. PLATFORM STATS VIEW
-- ─────────────────────────────────────────
create or replace view platform_stats as
select
  (select count(*) from agents where is_active = true)       as active_agents,
  (select count(*) from genesis_members where is_active = true) as genesis_claimed,
  (select coalesce(sum(input_amount), 0)
     from transactions
    where created_at > now() - interval '24 hours'
      and status = 'settled')                                  as volume_24h,
  (select coalesce(avg(settlement_ms), 0)
     from transactions
    where created_at > now() - interval '1 hour')              as avg_settlement_ms,
  (select coalesce(sum(fee_kaus), 0)
     from transactions
    where created_at > now() - interval '24 hours')            as fees_24h_kaus;

-- ─────────────────────────────────────────
-- 6. RLS (Row Level Security)
-- ─────────────────────────────────────────
alter table agents            enable row level security;
alter table transactions      enable row level security;
alter table genesis_members   enable row level security;
alter table staking_positions enable row level security;

-- API routes use service_role key → bypass RLS
-- Public read for stats only
create policy "Public can read platform stats"
  on agents for select using (true);
