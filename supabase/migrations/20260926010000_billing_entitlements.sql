begin;

create table public.runner_billing_customers (
  owner_user_id text primary key check (length(trim(owner_user_id)) > 0),
  stripe_customer_id text not null unique,
  merchant_account_id text not null,
  created_at timestamptz not null default now()
);
create table public.runner_billing_subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id text not null references public.runner_billing_customers(stripe_customer_id),
  owner_user_id text not null references public.runner_billing_customers(owner_user_id),
  merchant_account_id text not null,
  plan text check (plan in ('pro', 'command')),
  status text not null,
  period_end timestamptz,
  observed_at timestamptz not null,
  livemode boolean not null,
  last_event_id text not null
);
create index runner_billing_subscriptions_owner_idx on public.runner_billing_subscriptions(owner_user_id);
create table public.runner_checkout_attempts (
  owner_user_id text primary key references public.runner_billing_customers(owner_user_id),
  attempt_id uuid not null default gen_random_uuid(),
  attempt_created_at timestamptz not null default clock_timestamp(),
  plan text not null check (plan in ('pro','command')),
  price_id text not null,
  stripe_session_id text,
  lease_token uuid,
  lease_until timestamptz
);
create table public.runner_billing_events (
  event_id text primary key,
  event_type text not null,
  event_created bigint not null,
  stripe_subscription_id text not null,
  applied boolean not null default false,
  received_at timestamptz not null default now()
);
alter table public.runner_billing_customers enable row level security;
alter table public.runner_billing_subscriptions enable row level security;
alter table public.runner_billing_events enable row level security;
alter table public.runner_checkout_attempts enable row level security;
revoke all on public.runner_checkout_attempts from public, anon, authenticated;
grant select, insert, update on public.runner_checkout_attempts to service_role;
revoke all on public.runner_billing_customers, public.runner_billing_subscriptions, public.runner_billing_events from public, anon, authenticated;
grant select, insert, update on public.runner_billing_customers, public.runner_billing_subscriptions, public.runner_billing_events to service_role;

create function public.runner_bind_billing_customer(p_owner text, p_customer text, p_account text)
returns void language plpgsql security invoker set search_path = '' as $$
declare existing_customer text; existing_account text;
begin
  insert into public.runner_billing_customers(owner_user_id, stripe_customer_id, merchant_account_id)
  values(p_owner, p_customer, p_account) on conflict (owner_user_id) do nothing;
  select stripe_customer_id, merchant_account_id into existing_customer, existing_account from public.runner_billing_customers
    where owner_user_id = p_owner for update;
  if existing_customer is distinct from p_customer or existing_account is distinct from p_account then
    raise exception 'Billing customer ownership conflict';
  end if;
end;
$$;

create function public.runner_checkout_begin(p_owner text,p_plan text,p_price text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare attempt public.runner_checkout_attempts;
begin
  insert into public.runner_checkout_attempts(owner_user_id,plan,price_id)
    values(p_owner,p_plan,p_price) on conflict(owner_user_id) do nothing;
  select * into attempt from public.runner_checkout_attempts where owner_user_id=p_owner for update;
  if attempt.stripe_session_id is null and attempt.attempt_created_at < pg_catalog.clock_timestamp()-interval '23 hours'
    then return jsonb_build_object('state','review_required'); end if;
  if attempt.lease_until > pg_catalog.clock_timestamp() then return jsonb_build_object('state','busy'); end if;
  update public.runner_checkout_attempts set lease_token=gen_random_uuid(),lease_until=pg_catalog.clock_timestamp()+interval '2 minutes'
    where owner_user_id=p_owner returning * into attempt;
  return to_jsonb(attempt) || jsonb_build_object('state','acquired');
end;
$$;

create function public.runner_checkout_rotate(p_owner text,p_lease uuid,p_session text,p_plan text,p_price text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare attempt public.runner_checkout_attempts;
begin
  -- The server must first retrieve this exact recorded session from Stripe and
  -- confirm expiry, or completion with a terminal subscription. Never rotate an
  -- unknown attempt merely because an API list or network response is empty.
  update public.runner_checkout_attempts set attempt_id=gen_random_uuid(),attempt_created_at=pg_catalog.clock_timestamp(),plan=p_plan,price_id=p_price,stripe_session_id=null
    where owner_user_id=p_owner and lease_token=p_lease and lease_until>pg_catalog.clock_timestamp()
      and stripe_session_id=p_session
    returning * into attempt;
  if attempt.owner_user_id is null then raise exception 'Checkout lease or session mismatch'; end if;
  return to_jsonb(attempt) || jsonb_build_object('state','acquired');
end;
$$;

create function public.runner_checkout_finish(p_owner text,p_lease uuid,p_session text)
returns void language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  update public.runner_checkout_attempts set stripe_session_id=coalesce(p_session,stripe_session_id),lease_token=null,lease_until=null
    where owner_user_id=p_owner and lease_token=p_lease
      and (p_session is null or stripe_session_id is null or stripe_session_id=p_session);
  get diagnostics affected = row_count;
  if affected=0 then raise exception 'Checkout lease or session mismatch'; end if;
end;
$$;
revoke all on function public.runner_checkout_begin(text,text,text), public.runner_checkout_rotate(text,uuid,text,text,text), public.runner_checkout_finish(text,uuid,text) from public, anon, authenticated;
grant execute on function public.runner_checkout_begin(text,text,text), public.runner_checkout_rotate(text,uuid,text,text,text), public.runner_checkout_finish(text,uuid,text) to service_role;

-- All webhook workers use one database clock before fetching Stripe state.
-- Serverless host clock skew cannot make an older fetch overwrite a newer one.
create function public.runner_billing_observation_time()
returns timestamptz language sql volatile security invoker set search_path = ''
as 'select pg_catalog.clock_timestamp()';

create function public.runner_apply_subscription_event(
  p_event_id text, p_event_type text, p_event_created bigint, p_customer text,
  p_subscription text, p_status text, p_plan text, p_period_end timestamptz,
  p_observed_at timestamptz, p_livemode boolean, p_account text
) returns text language plpgsql security invoker set search_path = '' as $$
declare target_owner text; inserted_event text; prior_owner text; affected integer;
begin
  -- Serialize changes for one customer and derive owner from the verified
  -- server binding. Stripe object metadata never chooses entitlement ownership.
  select owner_user_id into target_owner from public.runner_billing_customers
    where stripe_customer_id = p_customer and merchant_account_id = p_account for update;
  if target_owner is null then return 'unbound_customer'; end if;

  insert into public.runner_billing_events(event_id,event_type,event_created,stripe_subscription_id)
  values(p_event_id,p_event_type,p_event_created,p_subscription)
  on conflict (event_id) do nothing returning event_id into inserted_event;
  if inserted_event is null then return 'duplicate'; end if;

  select owner_user_id into prior_owner from public.runner_billing_subscriptions where stripe_subscription_id = p_subscription;
  if prior_owner is not null and prior_owner <> target_owner then raise exception 'Subscription ownership conflict'; end if;

  insert into public.runner_billing_subscriptions
    (stripe_subscription_id,stripe_customer_id,owner_user_id,merchant_account_id,plan,status,period_end,observed_at,livemode,last_event_id)
  values(p_subscription,p_customer,target_owner,p_account,p_plan,p_status,p_period_end,p_observed_at,p_livemode,p_event_id)
  on conflict(stripe_subscription_id) do update set
    plan=excluded.plan,status=excluded.status,period_end=excluded.period_end,
    observed_at=excluded.observed_at,livemode=excluded.livemode,last_event_id=excluded.last_event_id
  where public.runner_billing_subscriptions.observed_at < excluded.observed_at;
  get diagnostics affected = row_count;
  update public.runner_billing_events set applied = affected > 0 where event_id = p_event_id;
  return case when affected > 0 then 'applied' else 'older_observation' end;
end;
$$;
revoke all on function public.runner_bind_billing_customer(text,text,text) from public, anon, authenticated;
revoke all on function public.runner_apply_subscription_event(text,text,bigint,text,text,text,text,timestamptz,timestamptz,boolean,text) from public, anon, authenticated;
grant execute on function public.runner_bind_billing_customer(text,text,text) to service_role;
grant execute on function public.runner_apply_subscription_event(text,text,bigint,text,text,text,text,timestamptz,timestamptz,boolean,text) to service_role;
revoke all on function public.runner_billing_observation_time() from public, anon, authenticated;
grant execute on function public.runner_billing_observation_time() to service_role;

commit;
