-- Veteran discount verification requests. A user requests verification from
-- their billing page; Hutchrok Group Solutions performs custom verification
-- out of band and posts the decision back via a bearer-secured callback
-- (app/api/veteran-discount/verify). Approval applies a 15% recurring Stripe
-- coupon to the subscriber's customer record.

create table if not exists veteran_discount_requests (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  review_due_at timestamptz not null default (now() + interval '24 hours'),
  reviewed_at timestamptz,
  reviewed_by text,
  denial_reason text,
  stripe_coupon_applied boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists veteran_discount_requests_clerk_user_idx
  on veteran_discount_requests (clerk_user_id);
create index if not exists veteran_discount_requests_email_idx
  on veteran_discount_requests (lower(email));
create index if not exists veteran_discount_requests_status_idx
  on veteran_discount_requests (status);

alter table veteran_discount_requests enable row level security;

grant all on table veteran_discount_requests to service_role;
