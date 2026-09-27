import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeBillingConfigured() {
  const keyMode = process.env.STRIPE_SECRET_KEY?.match(/^(?:sk|rk)_(test|live)_/u)?.[1];
  return isStripeConfigured() && /^acct_[A-Za-z0-9]+$/.test(process.env.STRIPE_EXPECTED_ACCOUNT_ID ?? "") &&
    ["test", "live"].includes(process.env.STRIPE_BILLING_MODE ?? "") && keyMode === process.env.STRIPE_BILLING_MODE;
}

export function isCheckoutEnabled() {
  return process.env.RUNNER_CHECKOUT_ENABLED === "true" && isStripeBillingConfigured();
}

export async function getVerifiedBillingStripe() {
  if (!isStripeBillingConfigured()) throw new Error("Stripe merchant and mode have not been confirmed.");
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(null);
  if (account.id !== process.env.STRIPE_EXPECTED_ACCOUNT_ID) throw new Error("Stripe merchant mismatch.");
  return stripe;
}

export function matchesBillingMode(livemode: boolean) {
  return isStripeBillingConfigured() && livemode === (process.env.STRIPE_BILLING_MODE === "live");
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });
  }

  return stripeClient;
}
