// Runner access catalogue.
//
// Amounts here are the OWNER-APPROVED intent, declared in code so that a
// mis-pasted Stripe Price ID cannot silently charge a different number.
// Stripe remains authoritative for what is actually charged; `assertPriceMatches`
// below is the gate that refuses checkout when the two disagree.

export const BILLING_INTERVALS = ["monthly", "yearly", "lifetime"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

type PriceSpec = {
  env: string;
  /** Owner-approved amount in the smallest currency unit. */
  amountCents: number;
  /** Stripe recurring interval, or null for a one-time purchase. */
  recurring: "month" | "year" | null;
  label: string;
};

export const PAID_PLANS = {
  plus: {
    name: "Runner Plus",
    rank: 1,
    prices: {
      monthly: { env: "STRIPE_PRICE_RUNNER_PLUS_MONTHLY", amountCents: 1999, recurring: "month", label: "$19.99 / month" },
      yearly: { env: "STRIPE_PRICE_RUNNER_PLUS_YEARLY", amountCents: 15000, recurring: "year", label: "$150 / year" },
    },
  },
  pro: {
    name: "Runner Pro",
    rank: 2,
    prices: {
      monthly: { env: "STRIPE_PRICE_RUNNER_PRO_MONTHLY", amountCents: 4999, recurring: "month", label: "$49.99 / month" },
      yearly: { env: "STRIPE_PRICE_RUNNER_PRO_YEARLY", amountCents: 30000, recurring: "year", label: "$300 / year" },
    },
  },
  premium: {
    name: "Runner Premium",
    rank: 3,
    prices: {
      yearly: { env: "STRIPE_PRICE_RUNNER_PREMIUM_YEARLY", amountCents: 50000, recurring: "year", label: "$500 / year" },
    },
  },
  premium_plus: {
    name: "Runner Premium Plus",
    rank: 4,
    prices: {
      lifetime: { env: "STRIPE_PRICE_RUNNER_PREMIUM_PLUS_LIFETIME", amountCents: 150000, recurring: null, label: "$1,500 once" },
    },
  },
} as const satisfies Record<string, { name: string; rank: number; prices: Partial<Record<BillingInterval, PriceSpec>> }>;

export type PaidPlanId = keyof typeof PAID_PLANS;
export const PAID_PLAN_IDS = Object.keys(PAID_PLANS) as PaidPlanId[];

export function isPaidPlan(value: unknown): value is PaidPlanId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PAID_PLANS, value);
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return typeof value === "string" && (BILLING_INTERVALS as readonly string[]).includes(value);
}

/** Intervals a plan is actually sold on. Premium is yearly only; Premium Plus is lifetime only. */
export function intervalsFor(plan: PaidPlanId): BillingInterval[] {
  return Object.keys(PAID_PLANS[plan].prices) as BillingInterval[];
}

export function priceSpec(plan: PaidPlanId, interval: BillingInterval): PriceSpec | undefined {
  return (PAID_PLANS[plan].prices as Partial<Record<BillingInterval, PriceSpec>>)[interval];
}

/** A one-time purchase uses Stripe `mode: "payment"`, not `"subscription"`. */
export function isLifetime(plan: PaidPlanId, interval: BillingInterval): boolean {
  return priceSpec(plan, interval)?.recurring === null;
}

export function getStripePriceId(plan: PaidPlanId, interval: BillingInterval): string | undefined {
  const spec = priceSpec(plan, interval);
  if (!spec) return undefined;
  const id = process.env[spec.env]?.trim();
  return id && /^price_[A-Za-z0-9]+$/.test(id) ? id : undefined;
}

/** True when every interval this plan is sold on has a configured Price ID. */
export function isPlanConfigured(plan: PaidPlanId): boolean {
  return intervalsFor(plan).every(interval => Boolean(getStripePriceId(plan, interval)));
}

/**
 * Reverse lookup used by webhook reconciliation. Ambiguous or unconfigured
 * prices resolve to null so a shared Price ID can never grant a tier.
 */
export function planForStripePrice(priceId: string): { plan: PaidPlanId; interval: BillingInterval } | null {
  const matches: { plan: PaidPlanId; interval: BillingInterval }[] = [];
  for (const plan of PAID_PLAN_IDS) {
    for (const interval of intervalsFor(plan)) {
      if (getStripePriceId(plan, interval) === priceId) matches.push({ plan, interval });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/** Highest-ranked plan wins when a customer somehow holds more than one. */
export function planRank(plan: unknown): number {
  return isPaidPlan(plan) ? PAID_PLANS[plan].rank : 0;
}

type StripePriceLike = {
  active: boolean;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string; usage_type: string } | null;
};

/**
 * Refuses a Stripe price that does not match the owner-approved amount,
 * currency and cadence. This is the guard against a wrong Price ID being
 * pasted into an environment variable.
 */
export function assertPriceMatches(plan: PaidPlanId, interval: BillingInterval, price: StripePriceLike): string | null {
  const spec = priceSpec(plan, interval);
  if (!spec) return "This access level is not sold on that billing interval.";
  if (!price.active) return "This Stripe price is not active.";
  if (price.currency !== "usd") return "This Stripe price is not in USD.";
  if (price.unit_amount !== spec.amountCents) {
    return `This Stripe price does not match the approved amount for ${PAID_PLANS[plan].name} (${spec.label}).`;
  }
  if (spec.recurring === null) {
    if (price.recurring) return "Runner Premium Plus is a one-time purchase and needs a non-recurring Stripe price.";
  } else {
    if (!price.recurring) return "This access level needs a recurring Stripe price.";
    if (price.recurring.interval !== spec.recurring) return "This Stripe price uses a different billing interval than approved.";
    if (price.recurring.usage_type !== "licensed") return "This Stripe price must be licensed, not metered.";
  }
  return null;
}
