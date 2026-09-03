-- Read-only prediction-market intelligence. Current state is stored separately
-- from append-only snapshots so the board is fast while retaining price history.

create table if not exists prediction_markets (
  id text primary key,
  provider text not null check (provider in ('kalshi', 'polymarket')),
  external_id text not null,
  event_id text,
  title text not null,
  sport text,
  market_type text not null default 'binary',
  status text not null,
  yes_bid numeric,
  yes_ask numeric,
  last_price numeric,
  implied_probability numeric check (implied_probability between 0 and 1),
  liquidity numeric,
  volume numeric,
  closes_at timestamptz,
  rules text,
  raw jsonb not null default '{}'::jsonb,
  source_timestamp timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists prediction_market_snapshots (
  id bigint generated always as identity primary key,
  market_id text not null references prediction_markets(id) on delete cascade,
  yes_bid numeric,
  yes_ask numeric,
  last_price numeric,
  implied_probability numeric check (implied_probability between 0 and 1),
  liquidity numeric,
  volume numeric,
  captured_at timestamptz not null default now()
);

create table if not exists prediction_market_game_mappings (
  id bigint generated always as identity primary key,
  market_id text not null references prediction_markets(id) on delete cascade,
  game_id text not null references games(id) on delete cascade,
  mapping_method text not null check (mapping_method in ('manual', 'exact', 'fuzzy')),
  confidence numeric not null check (confidence between 0 and 1),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (market_id, game_id)
);

create index if not exists prediction_markets_provider_status_idx
  on prediction_markets(provider, status);
create index if not exists prediction_markets_source_timestamp_idx
  on prediction_markets(source_timestamp desc);
create index if not exists prediction_market_snapshots_market_captured_idx
  on prediction_market_snapshots(market_id, captured_at desc);
create index if not exists prediction_market_mappings_game_idx
  on prediction_market_game_mappings(game_id);

alter table prediction_markets enable row level security;
alter table prediction_market_snapshots enable row level security;
alter table prediction_market_game_mappings enable row level security;

-- This app uses a server-only service-role client. Explicit grants keep the
-- tables available if the project opts into Supabase's stricter Data API model.
grant all on table prediction_markets to service_role;
grant all on table prediction_market_snapshots to service_role;
grant all on table prediction_market_game_mappings to service_role;
grant usage, select on sequence prediction_market_snapshots_id_seq to service_role;
grant usage, select on sequence prediction_market_game_mappings_id_seq to service_role;
