-- Manual subscriber access grants. Lets an admin give a user full Runner
-- access without a Stripe subscription (comps, staff, trials, VIPs).
-- getRunnerAccess() treats an active, unexpired row here as equivalent to
-- an active paid subscription.

create table if not exists manual_access_grants (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  email text not null,
  entitlement text not null default 'manual_access' check (entitlement in ('manual_access')),
  granted_by text not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  reason text,
  notes text,
  active boolean not null default true,
  revoked_at timestamptz,
  revoked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_access_grants_email_idx
  on manual_access_grants (lower(email));
create index if not exists manual_access_grants_clerk_user_idx
  on manual_access_grants (clerk_user_id);
create index if not exists manual_access_grants_active_idx
  on manual_access_grants (active, expires_at);

alter table manual_access_grants enable row level security;

grant all on table manual_access_grants to service_role;
