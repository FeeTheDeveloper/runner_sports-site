-- Apply before deploying tracker ownership code. Existing rows stay unowned:
-- never infer ownership from names, email, or the first signed-in user.
begin;

alter table public.tracked_bets add column if not exists owner_user_id text;
alter table public.tracked_bets enable row level security;
alter table public.tracked_bets force row level security;

-- The app uses a server-only service role and explicit verified-session owner
-- filters. Direct anon/authenticated access is intentionally unavailable.
revoke all on public.tracked_bets from public, anon, authenticated;

create index if not exists tracked_bets_owner_date_idx
  on public.tracked_bets (owner_user_id, bet_date desc)
  where owner_user_id is not null;

-- NOT VALID leaves legacy records quarantined but prevents new unowned rows.
alter table public.tracked_bets add constraint tracked_bets_owner_required
  check (owner_user_id is not null and length(trim(owner_user_id)) > 0) not valid;

comment on column public.tracked_bets.owner_user_id is
  'Verified Clerk user ID. NULL legacy rows are quarantined pending independently verified ownership.';

commit;
