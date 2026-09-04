-- Bound MCP candidate lookups by the same fields used by PostgREST filters.
-- Trigram indexes support the connector's case-insensitive partial team,
-- league, player, opponent, and market searches.
create extension if not exists pg_trgm;

create index if not exists games_league_trgm_idx on games using gin (league gin_trgm_ops);
create index if not exists games_sport_id_trgm_idx on games using gin (sport_id gin_trgm_ops);
create index if not exists games_home_team_name_trgm_idx on games using gin ((home_team->>'name') gin_trgm_ops);
create index if not exists games_away_team_name_trgm_idx on games using gin ((away_team->>'name') gin_trgm_ops);
create index if not exists props_sport_trgm_idx on props using gin (sport gin_trgm_ops);
create index if not exists props_market_trgm_idx on props using gin (market gin_trgm_ops);
create index if not exists props_opponent_trgm_idx on props using gin (opponent gin_trgm_ops);
create index if not exists props_player_name_trgm_idx on props using gin ((player->>'name') gin_trgm_ops);
create index if not exists props_player_team_trgm_idx on props using gin ((player->>'team') gin_trgm_ops);
create index if not exists props_updated_at_idx on props(updated_at desc);
create index if not exists team_registry_name_trgm_idx on team_registry using gin (name gin_trgm_ops);
create index if not exists team_registry_abbreviation_trgm_idx on team_registry using gin (abbreviation gin_trgm_ops);
create index if not exists team_registry_odds_name_trgm_idx on team_registry using gin (odds_api_name gin_trgm_ops);
