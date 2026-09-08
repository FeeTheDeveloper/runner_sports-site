-- Runner published intelligence contract.
-- The Demon publishes approved, normalized records here; the website only
-- reads them through its server-side service-role client. Control commands are
-- durable requests for the worker and never contain executable shell commands.

create table if not exists runner_published_intelligence (
  id text primary key,
  kind text not null,
  sport text,
  event_id text,
  payload jsonb not null default '{}'::jsonb,
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runner_forecasts (
  id text primary key,
  runner_event_id text,
  sport text not null,
  league text,
  event_id text,
  event text not null,
  market_type text not null,
  market text not null,
  selection text not null,
  forecast_type text not null,
  probability numeric check (probability between 0 and 1),
  fair_probability numeric check (fair_probability between 0 and 1),
  fair_price numeric,
  edge numeric,
  line numeric,
  price integer,
  confidence numeric check (confidence between 0 and 1),
  model_version text,
  state_version_hash text,
  source text not null,
  source_timestamp timestamptz,
  as_of timestamptz,
  expires_at timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  payload jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runner_pick_health (
  id text primary key,
  runner_event_id text,
  forecast_id text,
  sport text not null,
  event_id text,
  event text not null,
  selection text not null,
  status text not null check (status in ('HEALTHY', 'STABLE', 'WEAKENING', 'AT_RISK', 'BROKEN', 'RESOLVED')),
  health_score numeric check (health_score between 0 and 1),
  score numeric check (score between 0 and 1),
  original_thesis text,
  structural_integrity text,
  favorable_factors text[] not null default '{}',
  adverse_factors text[] not null default '{}',
  invalidation_reasons text[] not null default '{}',
  reasons text[] not null default '{}',
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_game_flow (
  id text primary key,
  runner_event_id text,
  sport text not null,
  event_id text not null,
  period text,
  clock text,
  home_score numeric,
  away_score numeric,
  win_probability_home numeric check (win_probability_home between 0 and 1),
  possession text,
  regime text,
  momentum numeric,
  tempo numeric,
  structural_control numeric,
  latent_states jsonb not null default '{}'::jsonb,
  coaching_adjustments jsonb not null default '{}'::jsonb,
  state text,
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_signals (
  id text primary key,
  signal_id text,
  runner_event_id text,
  sport text not null,
  event_id text,
  event text not null,
  signal_type text,
  market_type text,
  market text not null,
  selection text,
  direction text,
  strength numeric,
  line numeric,
  market_price numeric,
  runner_projection numeric,
  edge numeric,
  confidence numeric check (confidence between 0 and 1),
  status text check (status in ('DETECTED', 'WATCH', 'ARMED', 'ACTIONABLE', 'DECAYING', 'EXPIRED', 'SUPPRESSED')),
  reasons text[] not null default '{}',
  suppressions text[] not null default '{}',
  detected_at timestamptz,
  opened_at timestamptz,
  expires_at timestamptz,
  next_set_point text,
  headline text not null,
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_totals (
  id text primary key,
  runner_event_id text,
  sport text not null,
  event_id text,
  event text not null,
  line numeric,
  over_probability numeric check (over_probability between 0 and 1),
  under_probability numeric check (under_probability between 0 and 1),
  projection numeric,
  current_score_total numeric,
  projected_final numeric,
  projected_home_total numeric,
  projected_away_total numeric,
  expected_remaining_possessions numeric,
  adjusted_efficiency numeric,
  over_trend_score numeric,
  under_trend_score numeric,
  suppression_indicators jsonb not null default '{}'::jsonb,
  edge numeric,
  confidence text,
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_totals_windows (
  id text primary key,
  runner_event_id text not null,
  sport text not null,
  window_type text not null,
  start_at timestamptz,
  end_at timestamptz,
  decision_state text not null,
  line numeric,
  projection numeric,
  edge numeric,
  source_timestamp timestamptz,
  published_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_engine_status (
  id text primary key,
  status text not null,
  version text,
  heartbeat_at timestamptz,
  last_successful_publish_at timestamptz,
  sqlite_status text,
  active_providers text[] not null default '{}',
  active_games integer not null default 0,
  error_summary text,
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_provider_status (
  id text primary key,
  provider text not null,
  status text not null,
  last_success_at timestamptz,
  last_error_at timestamptz,
  latency_ms integer,
  latest_message text,
  latest_error text,
  event_count bigint not null default 0,
  as_of timestamptz,
  freshness text not null default 'unknown' check (freshness in ('fresh', 'stale', 'unknown')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists runner_research_evidence (
  id text primary key,
  sport text,
  event_id text,
  market_type text,
  entity_type text not null,
  entity_id text,
  title text not null,
  summary text,
  source_url text,
  source_name text,
  source_timestamp timestamptz,
  evidence_type text not null,
  confidence numeric check (confidence between 0 and 1),
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runner_control_commands (
  id uuid primary key default gen_random_uuid(),
  command_type text not null check (command_type in (
    'HEALTH_CHECK',
    'REFRESH_MARKETS',
    'REFRESH_PROVIDER',
    'FORCE_PUBLISH',
    'PAUSE_INGESTION',
    'RESUME_INGESTION',
    'RUN_REPLAY',
    'RUN_BACKTEST',
    'REFRESH_GAME'
  )),
  requested_by text not null default 'mcp',
  request_source text not null default 'mcp',
  arguments jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING', 'CLAIMED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REJECTED')),
  idempotency_key text not null unique,
  requested_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  error text,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

create table if not exists runner_control_results (
  id uuid primary key default gen_random_uuid(),
  command_id uuid not null references runner_control_commands(id) on delete cascade,
  status text not null check (status in ('RUNNING', 'SUCCEEDED', 'FAILED')),
  result jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists runner_published_intelligence_kind_idx
  on runner_published_intelligence(kind, sport, updated_at desc);
create index if not exists runner_forecasts_event_idx
  on runner_forecasts(event_id, updated_at desc);
create index if not exists runner_forecasts_sport_idx
  on runner_forecasts(sport, updated_at desc);
create index if not exists runner_pick_health_event_idx
  on runner_pick_health(event_id, updated_at desc);
create index if not exists runner_pick_health_sport_idx
  on runner_pick_health(sport, updated_at desc);
create index if not exists runner_game_flow_event_idx
  on runner_game_flow(event_id, updated_at desc);
create index if not exists runner_game_flow_sport_idx
  on runner_game_flow(sport, updated_at desc);
create index if not exists runner_signals_event_idx
  on runner_signals(event_id, updated_at desc);
create index if not exists runner_signals_sport_idx
  on runner_signals(sport, updated_at desc);
create index if not exists runner_totals_event_idx
  on runner_totals(event_id, updated_at desc);
create index if not exists runner_totals_sport_idx
  on runner_totals(sport, updated_at desc);
create index if not exists runner_totals_windows_event_idx
  on runner_totals_windows(runner_event_id, updated_at desc);
create index if not exists runner_totals_windows_sport_idx
  on runner_totals_windows(sport, updated_at desc);
create index if not exists runner_engine_status_updated_idx
  on runner_engine_status(updated_at desc);
create index if not exists runner_provider_status_provider_idx
  on runner_provider_status(provider, updated_at desc);
create index if not exists runner_research_evidence_event_idx
  on runner_research_evidence(event_id, retrieved_at desc);
create index if not exists runner_research_evidence_sport_idx
  on runner_research_evidence(sport, retrieved_at desc);
create index if not exists runner_control_commands_status_idx
  on runner_control_commands(status, requested_at desc);
create index if not exists runner_control_results_command_idx
  on runner_control_results(command_id, created_at desc);

alter table runner_published_intelligence enable row level security;
alter table runner_forecasts enable row level security;
alter table runner_pick_health enable row level security;
alter table runner_game_flow enable row level security;
alter table runner_signals enable row level security;
alter table runner_totals enable row level security;
alter table runner_totals_windows enable row level security;
alter table runner_engine_status enable row level security;
alter table runner_provider_status enable row level security;
alter table runner_research_evidence enable row level security;
alter table runner_control_commands enable row level security;
alter table runner_control_results enable row level security;

grant all on table runner_published_intelligence to service_role;
grant all on table runner_forecasts to service_role;
grant all on table runner_pick_health to service_role;
grant all on table runner_game_flow to service_role;
grant all on table runner_signals to service_role;
grant all on table runner_totals to service_role;
grant all on table runner_totals_windows to service_role;
grant all on table runner_engine_status to service_role;
grant all on table runner_provider_status to service_role;
grant all on table runner_research_evidence to service_role;
grant all on table runner_control_commands to service_role;
grant all on table runner_control_results to service_role;
