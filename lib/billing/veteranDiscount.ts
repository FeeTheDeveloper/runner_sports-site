// Military / veteran benefit terms.
//
// Supersedes the earlier 15% veteran coupon. Both the discount and the trial
// are granted only after verification completes — never from a self-declared
// flag, a filename, or an uploaded image alone.

export const MILITARY_DISCOUNT_PERCENT = 20;

/** Free trial length in days. Verified military/veteran accounts only. */
export const VETERAN_TRIAL_DAYS = 3;

export const VETERAN_DISCOUNT_VERIFIER = "Hutchrok Group Solutions";
export const VETERAN_DISCOUNT_SLA_HOURS = 24;

/**
 * Retained as an alias so existing panels and routes keep compiling while the
 * copy is updated. Prefer MILITARY_DISCOUNT_PERCENT in new code.
 */
export const VETERAN_DISCOUNT_PERCENT = MILITARY_DISCOUNT_PERCENT;

export function getMilitaryCouponId() {
  return process.env.STRIPE_COUPON_MILITARY20?.trim() || undefined;
}

export function isMilitaryDiscountConfigured() {
  return Boolean(getMilitaryCouponId());
}

/** Back-compat aliases. */
export const getVeteranCouponId = getMilitaryCouponId;
export const isVeteranDiscountConfigured = isMilitaryDiscountConfigured;

/**
 * The trial is a subscription concept. A one-time lifetime purchase cannot
 * carry one, so callers must not request a trial for it.
 */
export function trialDaysFor(verifiedMilitary: boolean, lifetime: boolean): number | undefined {
  if (!verifiedMilitary || lifetime) return undefined;
  return VETERAN_TRIAL_DAYS;
}
