import "server-only";
import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia" });
  }

  return stripeClient;
}
