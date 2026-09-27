const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function loader(stubs = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const req = name => name === 'server-only' ? {} : Object.hasOwn(stubs, name) ? stubs[name] : name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name);
    vm.runInNewContext(compiled, { require: req, module, exports: module.exports, process, Date, Response, URL, console });
    return module.exports;
  }
  return load;
}
const next = { NextResponse: { json: (body, init) => Response.json(body, init) } };
function env(values, action) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  return Promise.resolve().then(action).finally(() => { for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value; });
}

test('only unique configured prices map to recognized plans and expiry fails closed', async () => env({ STRIPE_PRICE_RUNNER_PRO_MONTHLY: 'price_pro', STRIPE_PRICE_RUNNER_PLUS_MONTHLY: 'price_plus' }, () => {
  const load = loader({ '@/lib/supabase/server': {} });
  const plans = load('lib/billing/plans.ts');
  assert.equal(plans.planForStripePrice('price_pro').plan, 'pro');
  assert.equal(plans.planForStripePrice('price_pro').interval, 'monthly');
  assert.equal(plans.planForStripePrice('price_unknown'), null);
  // A Price ID shared by two plans must never grant a tier.
  process.env.STRIPE_PRICE_RUNNER_PLUS_MONTHLY = 'price_pro';
  assert.equal(plans.planForStripePrice('price_pro'), null);
  const { isActiveSubscription } = load('lib/billing/subscriptions.ts');
  const row = { plan: 'pro', status: 'active', period_end: new Date(Date.now() + 60000).toISOString() };
  assert.equal(isActiveSubscription(row), true);
  for (const change of [{ plan: 'arbitrary' }, { status: 'past_due' }, { period_end: null }, { period_end: 'invalid' }, { period_end: '2000-01-01' }]) assert.equal(isActiveSubscription({ ...row, ...change }), false);
}));

test('subscription plan is derived from price, never Stripe metadata or checkout status', async () => env({ STRIPE_PRICE_RUNNER_PRO_MONTHLY: 'price_pro', STRIPE_PRICE_RUNNER_PLUS_MONTHLY: 'price_plus' }, () => {
  const { subscriptionSnapshot } = loader({ '@/lib/supabase/server': {} })('lib/billing/subscriptions.ts');
  const subscription = { customer: 'cus_owner', status: 'active', metadata: { runner_plan: 'premium_plus' }, items: { data: [{ quantity: 1, price: { id: 'price_pro', recurring: {} }, current_period_end: 2000000000 }] } };
  assert.equal(subscriptionSnapshot(subscription).plan, 'pro');
  subscription.items.data[0].price.id = 'price_unknown';
  assert.equal(subscriptionSnapshot(subscription).plan, null);
  subscription.items.data.push(subscription.items.data[0]);
  assert.equal(subscriptionSnapshot(subscription).plan, null);
}));

test('billing redirect and Supabase binding reject wrong hosts before clients initialize', async () => env({ NEXT_PUBLIC_APP_URL: 'https://runner.example', SUPABASE_URL: 'https://wrongwrongwrongwrong.supabase.co', SUPABASE_EXPECTED_PROJECT_REF: 'vrhvvywncclonfwplsjl', SUPABASE_SERVICE_ROLE_KEY: 'test-placeholder' }, () => {
  const origin = loader()('lib/billing/origin.ts').billingOrigin;
  assert.equal(origin(new Request('https://attacker.example/checkout')), 'https://runner.example');
  assert.throws(() => origin(new Request('https://runner.example/checkout', { headers: { origin: 'https://attacker.example' } })), /not allowed/);
  assert.throws(() => loader()('lib/env.ts').getSupabaseEnv(), /approved project/);
  process.env.SUPABASE_URL = 'https://vrhvvywncclonfwplsjl.supabase.co';
  assert.equal(loader()('lib/env.ts').getSupabaseEnv().SUPABASE_URL, process.env.SUPABASE_URL);
}));

test('old Clerk billing metadata never grants subscription access; missing mirror fails closed', async () => {
  let rows = []; let unavailable = false;
  const load = loader({
    '@clerk/nextjs/server': { currentUser: async () => ({ id: 'user_owner', primaryEmailAddress: null, privateMetadata: { subscriptionStatus: 'active', runnerPlan: 'command' } }) },
    '@/lib/auth/config': { isClerkConfigured: () => true },
    '@/lib/supabase/server': { getSupabaseServerClient: () => { throw new Error('no manual grant'); } },
    '@/lib/billing/subscriptions': { getBillingSubscriptions: async () => { if (unavailable) throw new Error('schema missing'); return rows; }, isActiveSubscription: row => row.status === 'active' && row.plan === 'pro' },
  });
  const access = load('lib/auth/access.ts').getRunnerAccess;
  assert.equal((await access()).fullAccess, false);
  rows = [{ plan: 'pro', status: 'active', period_end: '2030-01-01' }];
  assert.equal((await access()).paidPlan, 'pro');
  unavailable = true;
  assert.equal((await access()).fullAccess, false);
  assert.equal((await access()).billingState, 'unavailable');
});

test('webhook verifies signatures, retrieves current state and retries failed atomic persistence', async () => env({ STRIPE_WEBHOOK_SECRET: 'test-placeholder' }, async () => {
  let invalid = false, unavailable = false, saved = 0, fetched = 0;
  let event = { id: 'evt_test', type: 'customer.subscription.created', livemode: false, created: 1, data: { object: { id: 'sub_test', status: 'canceled' } } };
  const stripe = { webhooks: { constructEvent: () => { if (invalid) throw new Error('invalid signature'); return event; } }, subscriptions: { retrieve: async id => { fetched++; return { id, status: 'active', livemode: false }; } } };
  const handler = loader({ 'next/server': next,
    '@/lib/stripe/server': { getStripe: () => stripe, getVerifiedBillingStripe: async () => stripe, isStripeBillingConfigured: () => true, matchesBillingMode: mode => !mode },
    '@/lib/billing/subscriptions': { billingObservationTime: async () => '2026-09-26T12:00:00Z', reconcileSubscriptionEvent: async (_event, subscription) => { assert.equal(subscription.status, 'active'); if (unavailable) throw new Error('database unavailable'); saved++; return 'applied'; } },
  })('app/api/webhooks/stripe/route.ts').POST;
  const request = () => new Request('https://runner.example/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': 'test-signature' }, body: '{}' });
  invalid = true; assert.equal((await handler(request())).status, 400); assert.equal(fetched, 0);
  invalid = false; assert.equal((await handler(request())).status, 200); assert.equal(saved, 1);
  unavailable = true; assert.equal((await handler(request())).status, 503);
  event = { ...event, livemode: true }; assert.equal((await handler(request())).status, 400);
}));

test('checkout preserves ownership and reuses open checkout instead of creating duplicate subscriptions', async () => {
  let userId = null, customerOwner = 'owner', existingSubscription = false, created = 0;
  const stripe = {
    prices: { retrieve: async () => ({ active: true, livemode: false, currency: 'usd', unit_amount: 4999, recurring: { interval: 'month', usage_type: 'licensed' } }) },
    customers: { retrieve: async () => ({ metadata: { clerk_user_id: customerOwner } }) },
    subscriptions: { list: async () => ({ has_more: false, data: existingSubscription ? [{ status: 'active' }] : [] }) },
    checkout: { sessions: { list: async () => ({ has_more: false, data: [{ id: 'cs_existing', mode: 'subscription', metadata: { runner_plan: 'pro', runner_interval: 'monthly' }, url: 'https://checkout.stripe.com/existing' }] }), listLineItems: async () => ({ has_more: false, data: [{ price: { id: 'price_pro' }, quantity: 1 }] }), create: async () => { created++; return {}; } } },
  };
  const handler = loader({ 'next/server': next,
    '@clerk/nextjs/server': { auth: async () => ({ userId }), currentUser: async () => ({ id: userId, privateMetadata: {} }), clerkClient: async () => ({ users: { updateUserMetadata: async () => {} } }) },
    '@/lib/auth/config': { isClerkConfigured: () => true },
    '@/lib/stripe/server': { getVerifiedBillingStripe: async () => stripe, isCheckoutEnabled: () => true, matchesBillingMode: () => true },
    '@/lib/billing/plans': { getStripePriceId: () => 'price_pro', planForStripePrice: () => ({ plan: 'pro', interval: 'monthly' }), PAID_PLANS: { pro: { name: 'Runner Pro' } }, PAID_PLAN_IDS: ['plus', 'pro', 'premium', 'premium_plus'], BILLING_INTERVALS: ['monthly', 'yearly', 'lifetime'], priceSpec: () => ({ amountCents: 4999, recurring: 'month', label: '9.99 / month' }), isLifetime: () => false, assertPriceMatches: () => null },
    '@/lib/billing/origin': { billingOrigin: () => 'https://runner.example' },
    '@/lib/billing/subscriptions': { getBillingCustomer: async () => 'cus_owner', bindBillingCustomer: async () => {} },
    '@/lib/billing/checkoutAttempt': { beginCheckoutAttempt: async () => ({ attempt_id: 'attempt_stable', lease_token: 'lease', plan: 'pro', price_id: 'price_pro', stripe_session_id: null }), finishCheckoutAttempt: async () => {} },
    '@/lib/billing/veteranDiscount': { trialDaysFor: () => undefined, getMilitaryCouponId: () => undefined },
  })('app/api/checkout/route.ts').POST;
  const request = () => new Request('https://runner.example/api/checkout', { method: 'POST', body: JSON.stringify({ plan: 'pro', interval: 'monthly' }) });
  assert.equal((await handler(request())).status, 401);
  userId = 'owner'; customerOwner = 'foreign'; assert.equal((await handler(request())).status, 409);
  customerOwner = 'owner'; existingSubscription = true; assert.equal((await handler(request())).status, 409);
  existingSubscription = false; const result = await handler(request()); assert.equal(result.status, 200); assert.equal((await result.json()).url, 'https://checkout.stripe.com/existing');
  assert.equal(created, 0);
});

test('verified Stripe connection rejects a different merchant and mismatched event mode', async () => env({ STRIPE_SECRET_KEY: 'sk_test_placeholder', STRIPE_EXPECTED_ACCOUNT_ID: 'acct_runner', STRIPE_BILLING_MODE: 'test' }, async () => {
  let account = 'acct_foreign';
  class StripeStub { constructor() { return { accounts: { retrieve: async id => { assert.equal(id, null); return { id: account }; } } }; } }
  const module = loader({ stripe: { default: StripeStub } })('lib/stripe/server.ts');
  await assert.rejects(module.getVerifiedBillingStripe, /merchant mismatch/);
  account = 'acct_runner';
  assert.ok(await module.getVerifiedBillingStripe());
  assert.equal(module.matchesBillingMode(false), true);
  assert.equal(module.matchesBillingMode(true), false);
  delete process.env.STRIPE_EXPECTED_ACCOUNT_ID;
  await assert.rejects(module.getVerifiedBillingStripe, /not been confirmed/);
}));

test('billing status requires identity and never turns a subscription into model or unlimited usage access', async () => {
  let access = { authenticated: false };
  const handler = loader({ 'next/server': next, '@/lib/auth/access': { getRunnerAccess: async () => access } })('app/api/billing/status/route.ts').GET;
  const denied = await handler();
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get('cache-control'), 'no-store');
  access = { authenticated: true, paidPlan: 'command', entitlement: 'active', fullAccess: true, billingState: 'synced' };
  const response = await handler(); const data = await response.json();
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(data.capabilities.research, true);
  assert.equal(data.capabilities.predictionExecution, false);
  assert.equal(data.usage.state, 'not_configured');
  assert.equal(data.usage.limit, null);
});

test('billing portal rejects a customer from the wrong Stripe mode before creating a portal', async () => {
  let live = true; let created = 0;
  const stripe = { customers: { retrieve: async () => ({ livemode: live, metadata: { clerk_user_id: 'owner' } }) }, billingPortal: { sessions: { create: async () => { created++; return { url: 'https://billing.stripe.com/session' }; } } } };
  const handler = loader({
    'next/server': next, '@clerk/nextjs/server': { auth: async () => ({ userId: 'owner' }) },
    '@/lib/auth/config': { isClerkConfigured: () => true },
    '@/lib/billing/subscriptions': { getBillingCustomer: async () => 'cus_owner' },
    '@/lib/billing/origin': { billingOrigin: () => 'https://runner.example' },
    '@/lib/stripe/server': { isStripeBillingConfigured: () => true, getVerifiedBillingStripe: async () => stripe, matchesBillingMode: value => value === false },
  })('app/api/billing/portal/route.ts').POST;
  const request = () => new Request('https://runner.example/api/billing/portal', { method: 'POST' });
  assert.equal((await handler(request())).status, 409); assert.equal(created, 0);
  live = false; assert.equal((await handler(request())).status, 200); assert.equal(created, 1);
});

test('approved catalogue amounts gate checkout so a wrong Price ID cannot charge a different number', async () => env({
  STRIPE_PRICE_RUNNER_PRO_MONTHLY: 'price_pro_m',
  STRIPE_PRICE_RUNNER_PREMIUM_PLUS_LIFETIME: 'price_lifetime',
}, () => {
  const plans = loader({ '@/lib/supabase/server': {} })('lib/billing/plans.ts');
  const recurring = { active: true, currency: 'usd', unit_amount: 4999, recurring: { interval: 'month', usage_type: 'licensed' } };

  // Exact approved amount passes.
  assert.equal(plans.assertPriceMatches('pro', 'monthly', recurring), null);
  // Wrong amount, wrong currency, inactive and metered prices are all refused.
  assert.match(plans.assertPriceMatches('pro', 'monthly', { ...recurring, unit_amount: 3999 }), /approved amount/);
  assert.match(plans.assertPriceMatches('pro', 'monthly', { ...recurring, currency: 'eur' }), /USD/);
  assert.match(plans.assertPriceMatches('pro', 'monthly', { ...recurring, active: false }), /not active/);
  assert.match(plans.assertPriceMatches('pro', 'monthly', { ...recurring, recurring: { interval: 'month', usage_type: 'metered' } }), /licensed/);
  assert.match(plans.assertPriceMatches('pro', 'monthly', { ...recurring, recurring: { interval: 'year', usage_type: 'licensed' } }), /different billing interval/);

  // Premium is annual only; Premium Plus is a one-time purchase.
  assert.match(plans.assertPriceMatches('premium', 'monthly', recurring), /not sold on that billing interval/);
  assert.equal(plans.priceSpec('premium', 'monthly'), undefined);
  assert.equal(plans.isLifetime('premium_plus', 'lifetime'), true);
  assert.equal(plans.isLifetime('pro', 'yearly'), false);
  const oneTime = { active: true, currency: 'usd', unit_amount: 150000, recurring: null };
  assert.equal(plans.assertPriceMatches('premium_plus', 'lifetime', oneTime), null);
  assert.match(plans.assertPriceMatches('premium_plus', 'lifetime', { ...oneTime, recurring: { interval: 'year', usage_type: 'licensed' } }), /one-time purchase/);

  // Tier ordering drives which plan wins when more than one is held.
  assert.ok(plans.planRank('premium_plus') > plans.planRank('premium'));
  assert.ok(plans.planRank('premium') > plans.planRank('pro'));
  assert.ok(plans.planRank('pro') > plans.planRank('plus'));
  assert.equal(plans.planRank('command'), 0);
}));

test('the free trial and military discount are granted only after verification, and never on a lifetime purchase', async () => {
  const { trialDaysFor, MILITARY_DISCOUNT_PERCENT, VETERAN_TRIAL_DAYS } = loader({})('lib/billing/veteranDiscount.ts');
  assert.equal(MILITARY_DISCOUNT_PERCENT, 20);
  assert.equal(VETERAN_TRIAL_DAYS, 3);
  assert.equal(trialDaysFor(true, false), 3);
  assert.equal(trialDaysFor(false, false), undefined);
  assert.equal(trialDaysFor(true, true), undefined);
  assert.equal(trialDaysFor(false, true), undefined);
});
