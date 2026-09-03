export const PAID_PLANS = {
  pro: {
    name: "Runner Pro",
    priceEnv: "STRIPE_PRICE_RUNNER_PRO",
  },
  command: {
    name: "Runner Command",
    priceEnv: "STRIPE_PRICE_RUNNER_COMMAND",
  },
} as const;

export type PaidPlanId = keyof typeof PAID_PLANS;

export function getStripePriceId(plan: PaidPlanId) {
  return process.env[PAID_PLANS[plan].priceEnv];
}
