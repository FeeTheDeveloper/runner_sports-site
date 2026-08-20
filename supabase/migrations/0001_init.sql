-- Runner Sports & Analytics — initial schema
-- Tables are upserted by app/api/cron/sync-odds against The Odds API on a
-- schedule. Per-sportsbook prices are kept as JSONB arrays (book_odds) so the
-- app layer can compute a no-vig consensus and per-book edge at read time
-- (see lib/models/edgeCalculator.ts) without a second write path.

create table if not exists games (
  id text primary key,
  sport_id text not null,
  league text not null,
  home_team jsonb not null,
  away_team jsonb not null,
  starts_at timestamptz not null,
  status text not null check (status in ('scheduled', 'live', 'final')),
  book_odds jsonb not null default '[]'::jsonb,
  key_factors text[] not null default '{}',
  source jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists props (
  id text primary key,
  game_id text not null references games(id) on delete cascade,
  player jsonb not null,
  opponent text not null,
  sport text not null,
  market text not null,
  book_odds jsonb not null default '[]'::jsonb,
  recent_hit_rate numeric,
  matchup_context text,
  source jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists market_movements (
  id text primary key,
  event text not null,
  market text not null,
  sportsbook text not null,
  opening_line numeric,
  current_line numeric,
  opening_price integer not null,
  current_price integer not null,
  direction text not null check (direction in ('up', 'down', 'flat')),
  captured_at timestamptz not null,
  source jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists signals (
  id text primary key,
  event text not null,
  market text not null,
  movement jsonb not null,
  model_market_delta numeric not null default 0,
  note text not null,
  updated_at timestamptz not null default now()
);

create table if not exists tracked_bets (
  id uuid primary key default gen_random_uuid(),
  bet_date date not null,
  sport text not null,
  event text not null,
  selection text not null,
  market text not null,
  sportsbook text not null,
  odds integer not null,
  stake numeric not null,
  result text not null check (result in ('win', 'loss', 'push', 'pending')),
  profit numeric not null default 0,
  closing_odds integer,
  clv numeric,
  created_at timestamptz not null default now()
);

create index if not exists props_game_id_idx on props(game_id);
create index if not exists games_starts_at_idx on games(starts_at);
create index if not exists tracked_bets_bet_date_idx on tracked_bets(bet_date desc);

-- No RLS policies yet: this pass ships with no login/paywall and all reads
-- happen server-side through the service-role client. Revisit before any
-- client-side Supabase access is introduced.
alter table games enable row level security;
alter table props enable row level security;
alter table market_movements enable row level security;
alter table signals enable row level security;
alter table tracked_bets enable row level security;
