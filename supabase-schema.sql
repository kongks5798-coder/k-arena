-- K-Arena Supabase Schema (fixed)

-- 1. profiles
create table if not exists public.profiles (
  id           uuid primary key,
  username     text unique,
  display_name text,
  avatar_url   text,
  level        text default 'Bronze',
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_self" on public.profiles
  for all using ((auth.uid())::text = (id)::text);

-- 2. trades
create table if not exists public.trades (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null,
  asset      text not null,
  type       text check (type in ('BUY','SELL')) not null,
  method     text check (method in ('MARKET','LIMIT')) not null,
  amount     numeric(20,8) not null,
  price      numeric(20,2) not null,
  fee        numeric(20,4) not null,
  total      numeric(20,4) not null,
  status     text default 'completed',
  created_at timestamptz default now()
);
alter table public.trades enable row level security;
create policy "trades_select" on public.trades
  for select using ((auth.uid())::text = (user_id)::text);
create policy "trades_insert" on public.trades
  for insert with check ((auth.uid())::text = (user_id)::text);

-- 3. portfolio
create table if not exists public.portfolio (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid not null,
  asset         text not null,
  amount        numeric(20,8) default 0,
  avg_buy_price numeric(20,2) default 0,
  updated_at    timestamptz default now(),
  unique(user_id, asset)
);
alter table public.portfolio enable row level security;
create policy "portfolio_self" on public.portfolio
  for all using ((auth.uid())::text = (user_id)::text);

-- 4. payments
create table if not exists public.payments (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid not null,
  toss_order_id    text unique not null,
  toss_payment_key text,
  amount           integer not null,
  status           text default 'pending',
  method           text,
  created_at       timestamptz default now(),
  confirmed_at     timestamptz
);
alter table public.payments enable row level security;
create policy "payments_select" on public.payments
  for select using ((auth.uid())::text = (user_id)::text);
create policy "payments_insert" on public.payments
  for insert with check ((auth.uid())::text = (user_id)::text);

-- 5. audit_log
create table if not exists public.audit_log (
  id         bigserial primary key,
  user_id    uuid,
  action     text not null,
  ip_address text,
  metadata   jsonb,
  created_at timestamptz default now()
);
alter table public.audit_log enable row level security;
create policy "audit_admin" on public.audit_log
  for select using (false);

-- 6. auto profile trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
