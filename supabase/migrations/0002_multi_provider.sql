-- Multi-provider architecture: canonical team registry + ESPN enrichment records.
-- The Odds API stays the market-pricing source of truth; ESPN records land in
-- `espn_records` with full source lineage, and `team_registry` gives every
-- provider a shared canonical identity for safe joins.

create table if not exists team_registry (
  id text primary key,
  league text not null,
  name text not null,
  abbreviation text not null,
  espn_id text,
  odds_api_name text,
  aliases text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create unique index if not exists team_registry_league_espn_id_idx
  on team_registry (league, espn_id)
  where espn_id is not null;

create index if not exists team_registry_league_idx on team_registry (league);

create table if not exists espn_records (
  id text primary key,
  provider text not null default 'ESPN',
  sport text not null,
  league text not null,
  data_type text not null check (data_type in (
    'scoreboard', 'teams', 'roster', 'injuries', 'standings',
    'athlete', 'athlete-stats', 'athlete-gamelog', 'summary'
  )),
  entity_id text not null,
  payload jsonb not null,
  retrieved_at timestamptz not null,
  source jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists espn_records_sport_data_type_idx on espn_records (sport, data_type);
create index if not exists espn_records_entity_id_idx on espn_records (entity_id);
create index if not exists espn_records_retrieved_at_idx on espn_records (retrieved_at desc);

alter table team_registry enable row level security;
alter table espn_records enable row level security;
