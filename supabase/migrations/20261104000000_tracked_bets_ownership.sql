-- TRK-002 / SEC-01: per-user ownership for the bet tracker.
--
-- Before this migration tracked_bets had no owner and /api/tracker had no
-- authentication, so any caller could read or insert rows. Each row now
-- belongs to one Clerk user, and every read/write in lib/data/tracker.ts is
-- scoped to the caller's clerk_user_id.
--
-- Existing rows are PRESERVED with clerk_user_id = null. They are not visible
-- to any user until an admin assigns them (see docs/replacement/MIGRATION_MANIFEST.md).
-- Nothing is deleted.
--
-- source/external_id prepare the table for consent-based sportsbook sync
-- (TRK-001): a sync provider's bet ID lands in external_id, and the unique
-- index below makes repeated syncs idempotent per user and provider.

alter table tracked_bets
  add column if not exists clerk_user_id text,
  add column if not exists source text not null default 'manual',
  add column if not exists external_id text,
  add column if not exists updated_at timestamptz not null default now();

alter table tracked_bets
  drop constraint if exists tracked_bets_source_check;
alter table tracked_bets
  add constraint tracked_bets_source_check
  check (source in ('manual', 'csv_import', 'sportsbook_sync'));

-- Owner-scoped listing (newest first) is the only read path.
create index if not exists tracked_bets_owner_bet_date_idx
  on tracked_bets (clerk_user_id, bet_date desc);

-- Duplicate-import guard for synced/imported bets.
create unique index if not exists tracked_bets_owner_source_external_uidx
  on tracked_bets (clerk_user_id, source, external_id)
  where external_id is not null;

-- RLS stays enabled with no policies: only the server-side service-role
-- client can touch this table, and it always filters by owner.
alter table tracked_bets enable row level security;
