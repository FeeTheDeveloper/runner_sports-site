#!/usr/bin/env node
// Validates Stripe billing configuration without ever printing a secret.
//
//   node scripts/check-stripe-config.mjs            local checks only
//   node scripts/check-stripe-config.mjs --verify   also calls Stripe to confirm
//                                                   the account and that every
//                                                   price matches the approved amount
//
// Secrets are only ever reported as SET / MISSING plus a non-secret prefix.

import { readFileSync, existsSync } from 'node:fs';

const ENV_FILE = '.env.local';
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_0-9]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].trim();
  }
}

// Approved catalogue, mirrored from lib/billing/plans.ts.
const CATALOGUE = [
  ['STRIPE_PRICE_RUNNER_PLUS_MONTHLY', 1999, 'month', 'Runner Plus monthly'],
  ['STRIPE_PRICE_RUNNER_PLUS_YEARLY', 15000, 'year', 'Runner Plus yearly'],
  ['STRIPE_PRICE_RUNNER_PRO_MONTHLY', 4999, 'month', 'Runner Pro monthly'],
  ['STRIPE_PRICE_RUNNER_PRO_YEARLY', 30000, 'year', 'Runner Pro yearly'],
  ['STRIPE_PRICE_RUNNER_PREMIUM_YEARLY', 50000, 'year', 'Runner Premium yearly'],
  ['STRIPE_PRICE_RUNNER_PREMIUM_PLUS_LIFETIME', 150000, null, 'Runner Premium Plus lifetime'],
];

const usd = cents => `$${(cents / 100).toFixed(2)}`;
let problems = 0;
const fail = msg => { problems++; console.log(`  FAIL  ${msg}`); };
const ok = msg => console.log(`  ok    ${msg}`);
const warn = msg => console.log(`  warn  ${msg}`);

console.log('\nStripe configuration check\n');

// --- Key and mode ---------------------------------------------------------
const key = process.env.STRIPE_SECRET_KEY?.trim();
const mode = process.env.STRIPE_BILLING_MODE?.trim();
const keyMode = key?.match(/^(?:sk|rk)_(test|live)_/u)?.[1];

if (!key) fail('STRIPE_SECRET_KEY is missing');
else if (!keyMode) fail('STRIPE_SECRET_KEY is not a recognizable sk_/rk_ key');
else ok(`STRIPE_SECRET_KEY set (${key.slice(0, 8)}…, ${keyMode} mode)`);

if (!mode) fail('STRIPE_BILLING_MODE is missing (expected "test" or "live")');
else if (!['test', 'live'].includes(mode)) fail(`STRIPE_BILLING_MODE is "${mode}"; expected "test" or "live"`);
else if (keyMode && keyMode !== mode) fail(`STRIPE_BILLING_MODE is "${mode}" but the key is a ${keyMode} key — billing stays off until these match`);
else if (keyMode) ok(`STRIPE_BILLING_MODE "${mode}" matches the key`);
else ok(`STRIPE_BILLING_MODE "${mode}" set; will be cross-checked once the key is pasted`);

const account = process.env.STRIPE_EXPECTED_ACCOUNT_ID?.trim();
if (!account) fail('STRIPE_EXPECTED_ACCOUNT_ID is missing');
else if (!/^acct_[A-Za-z0-9]+$/.test(account)) fail('STRIPE_EXPECTED_ACCOUNT_ID is not an acct_... id');
else ok(`STRIPE_EXPECTED_ACCOUNT_ID ${account}`);

const webhook = process.env.STRIPE_WEBHOOK_SECRET?.trim();
webhook ? ok('STRIPE_WEBHOOK_SECRET set') : fail('STRIPE_WEBHOOK_SECRET is missing');

// --- Prices ---------------------------------------------------------------
console.log('\nPrices\n');
const configured = [];
for (const [env, cents, recurring, label] of CATALOGUE) {
  const value = process.env[env]?.trim();
  if (!value) { warn(`${label} (${usd(cents)}) — ${env} not set`); continue; }
  if (!/^price_[A-Za-z0-9]+$/.test(value)) { fail(`${label} — ${env} is not a price_... id`); continue; }
  ok(`${label} (${usd(cents)}${recurring ? ` / ${recurring}` : ' one-time'}) — ${value}`);
  configured.push({ env, cents, recurring, label, value });
}

const duplicates = configured.filter((a, i) => configured.findIndex(b => b.value === a.value) !== i);
for (const d of duplicates) fail(`${d.value} is used by more than one tier — a shared Price ID resolves to no plan and blocks checkout`);

const coupon = process.env.STRIPE_COUPON_MILITARY20?.trim();
coupon ? ok(`STRIPE_COUPON_MILITARY20 ${coupon}`) : warn('STRIPE_COUPON_MILITARY20 not set — the 20% military discount cannot be applied');

// --- Live verification ----------------------------------------------------
if (process.argv.includes('--verify')) {
  console.log('\nVerifying against Stripe\n');
  if (!key || problems) {
    fail('Skipped: fix the configuration problems above first.');
  } else {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(key);
    try {
      const acct = await stripe.accounts.retrieve();
      if (acct.id !== account) fail(`Key belongs to ${acct.id}, not ${account} — getVerifiedBillingStripe() would refuse`);
      else ok(`Account confirmed: ${acct.id}${acct.business_profile?.name ? ` (${acct.business_profile.name})` : ''}`);
      if (acct.charges_enabled === false) warn('Account cannot accept charges yet');
    } catch {
      fail('Could not retrieve the Stripe account with this key');
    }

    for (const p of configured) {
      try {
        const price = await stripe.prices.retrieve(p.value);
        const issues = [];
        if (!price.active) issues.push('inactive');
        if (price.currency !== 'usd') issues.push(`currency ${price.currency}`);
        if (price.unit_amount !== p.cents) issues.push(`amount ${usd(price.unit_amount ?? 0)}, approved ${usd(p.cents)}`);
        if (p.recurring === null && price.recurring) issues.push('is recurring but must be one-time');
        if (p.recurring && !price.recurring) issues.push('is one-time but must be recurring');
        if (p.recurring && price.recurring && price.recurring.interval !== p.recurring) issues.push(`interval ${price.recurring.interval}, approved ${p.recurring}`);
        if (price.livemode !== (mode === 'live')) issues.push(`livemode ${price.livemode}, billing mode ${mode}`);
        issues.length ? fail(`${p.label} — ${issues.join('; ')}`) : ok(`${p.label} matches the approved price`);
      } catch {
        fail(`${p.label} — ${p.value} could not be retrieved in ${mode} mode`);
      }
    }

    if (coupon) {
      try {
        const c = await stripe.coupons.retrieve(coupon);
        if (c.percent_off !== 20) fail(`Military coupon is ${c.percent_off ?? '?'}% off, approved 20%`);
        else if (!c.valid) fail('Military coupon is not valid');
        else ok('Military coupon is 20% off and valid');
      } catch {
        fail(`Coupon ${coupon} could not be retrieved in ${mode} mode`);
      }
    }
  }
}

// --- Summary --------------------------------------------------------------
const checkout = process.env.RUNNER_CHECKOUT_ENABLED?.trim();
console.log('');
console.log(`RUNNER_CHECKOUT_ENABLED=${checkout ?? '(unset)'}${checkout === 'true' ? '  — CHECKOUT IS LIVE' : '  — checkout is off'}`);
console.log(problems === 0
  ? `\n${configured.length}/${CATALOGUE.length} prices configured, no problems found.\n`
  : `\n${problems} problem(s) found.\n`);
process.exit(problems === 0 ? 0 : 1);
