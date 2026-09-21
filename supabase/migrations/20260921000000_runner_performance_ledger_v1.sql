-- Runner Sports Performance Ledger v1.
-- Historical, verified betting performance imported from the Juice Reel CSV
-- export. This is an external historical-performance source, not the live
-- Demon intelligence pipeline: it records what was actually risked and won,
-- never a projection or a model output. juice_bet_id is ticket identity;
-- bet_leg_id is leg identity. Ticket economics (risk, payout, result) belong
-- only on runner_bets — a multi-leg ticket must never be counted once per
-- leg when computing risk or P/L.

create extension if not exists pgcrypto;

create table if not exists runner_import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  filename text,
  imported_at timestamptz not null default now(),
  total_rows integer not null default 0,
  unique_bets integer not null default 0,
  unique_legs integer not null default 0,
  rows_inserted integer not null default 0,
  rows_updated integer not null default 0,
  rows_rejected integer not null default 0,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'completed_with_errors', 'failed')),
  error_summary jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists runner_bets (
  id uuid primary key default gen_random_uuid(),
  juice_bet_id bigint not null unique,
  sportsbook text not null,
  books_bet_id text,
  risk_amount numeric(14, 4),
  max_potential_win numeric(14, 4),
  bet_result text,
  amount_won_or_lost numeric(14, 4),
  odds_american integer,
  number_of_legs integer not null default 1,
  date_placed timestamptz,
  date_settled timestamptz,
  date_synced timestamptz,
  freeplay_amount_at_risk numeric(14, 4),
  is_odds_boosted boolean not null default false,
  clv_percent numeric(12, 6),
  source text not null default 'juice_reel',
  import_run_id uuid references runner_import_runs(id) on delete set null,
  raw_ticket jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runner_bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_leg_id bigint not null unique,
  juice_bet_id bigint not null references runner_bets(juice_bet_id) on delete cascade,
  leg_type text,
  bet_on text,
  spread_total_number numeric(12, 4),
  duration text,
  sport text,
  league text,
  leg_vig integer,
  leg_description text,
  long_description text,
  event_start_date timestamptz,
  event_name text,
  bet_tag_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_runner_bets_sportsbook on runner_bets(sportsbook);
create index if not exists idx_runner_bets_result on runner_bets(bet_result);
create index if not exists idx_runner_bets_date_placed on runner_bets(date_placed);
create index if not exists idx_runner_bets_number_of_legs on runner_bets(number_of_legs);
create index if not exists idx_runner_bet_legs_juice_bet_id on runner_bet_legs(juice_bet_id);
create index if not exists idx_runner_bet_legs_sport on runner_bet_legs(sport);
create index if not exists idx_runner_bet_legs_league on runner_bet_legs(league);
create index if not exists idx_runner_bet_legs_leg_type on runner_bet_legs(leg_type);
create index if not exists idx_runner_bet_legs_duration on runner_bet_legs(duration);

alter table runner_import_runs enable row level security;
alter table runner_bets enable row level security;
alter table runner_bet_legs enable row level security;

grant all on table runner_import_runs to service_role;
grant all on table runner_bets to service_role;
grant all on table runner_bet_legs to service_role;

-- Ticket-level performance. Every row here is one juice_bet_id — never
-- duplicate ticket risk/P/L across its legs.
create or replace view runner_bet_performance
  with (security_invoker = true) as
select
  b.id,
  b.juice_bet_id,
  b.sportsbook,
  b.bet_result,
  b.risk_amount,
  b.amount_won_or_lost,
  b.max_potential_win,
  b.odds_american,
  b.number_of_legs,
  b.date_placed,
  b.date_settled,
  case
    when b.risk_amount > 0 then round((b.amount_won_or_lost / b.risk_amount) * 100, 4)
    else null
  end as roi_percent,
  case when b.bet_result = 'Won' then 1 else 0 end as is_win,
  case when b.bet_result = 'Lost' then 1 else 0 end as is_loss,
  case when b.bet_result = 'CashedOut' then 1 else 0 end as is_cashout
from runner_bets b;

create or replace view runner_portfolio_summary
  with (security_invoker = true) as
select
  count(*) as total_bets,
  count(*) filter (where bet_result = 'Won') as wins,
  count(*) filter (where bet_result = 'Lost') as losses,
  count(*) filter (where bet_result = 'CashedOut') as cashouts,
  round(sum(coalesce(risk_amount, 0)), 2) as total_risked,
  round(sum(coalesce(amount_won_or_lost, 0)), 2) as net_profit,
  round(
    case
      when sum(coalesce(risk_amount, 0)) > 0
        then sum(coalesce(amount_won_or_lost, 0)) / sum(coalesce(risk_amount, 0)) * 100
      else 0
    end,
    2
  ) as roi_percent,
  round(avg(risk_amount), 2) as average_risk,
  round(avg(number_of_legs), 2) as average_leg_count
from runner_bets;

-- Exploratory only. A parlay's full ticket P/L is attributed to every leg's
-- sport/league/market here, which overstates single-market performance —
-- see the Phase 2 leg-contribution methodology note before treating this as
-- true market-specific ROI.
--
-- `legs` counts every leg row per (league, sport, leg_type). `bets_exposed`/
-- `approximate_risk`/`approximate_profit` are deduplicated per distinct
-- (juice_bet_id, league, sport, leg_type) combination first, then joined to
-- runner_bets — summing a ticket's risk/P/L once per combination it
-- touches, not once per leg row. Do not switch this back to
-- `sum(distinct b.risk_amount)`: that dedupes by dollar amount, not ticket
-- identity, and silently collapses unrelated tickets that happen to share a
-- risk amount.
create or replace view runner_market_type_performance
  with (security_invoker = true) as
with leg_totals as (
  select league, sport, leg_type, count(*) as legs
  from runner_bet_legs
  group by league, sport, leg_type
),
ticket_exposure as (
  select distinct juice_bet_id, league, sport, leg_type
  from runner_bet_legs
)
select
  leg_totals.league,
  leg_totals.sport,
  leg_totals.leg_type,
  leg_totals.legs,
  count(distinct e.juice_bet_id) as bets_exposed,
  round(sum(b.risk_amount), 2) as approximate_risk,
  round(sum(b.amount_won_or_lost), 2) as approximate_profit
from leg_totals
join ticket_exposure e
  on e.league is not distinct from leg_totals.league
  and e.sport is not distinct from leg_totals.sport
  and e.leg_type is not distinct from leg_totals.leg_type
join runner_bets b on b.juice_bet_id = e.juice_bet_id
group by leg_totals.league, leg_totals.sport, leg_totals.leg_type, leg_totals.legs;

grant select on runner_bet_performance to service_role;
grant select on runner_portfolio_summary to service_role;
grant select on runner_market_type_performance to service_role;
