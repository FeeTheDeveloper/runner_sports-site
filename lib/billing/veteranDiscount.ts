export const VETERAN_DISCOUNT_PERCENT = 15;
export const VETERAN_DISCOUNT_VERIFIER = "Hutchrok Group Solutions";
export const VETERAN_DISCOUNT_SLA_HOURS = 24;

export function getVeteranCouponId() {
  return process.env.STRIPE_COUPON_VETERAN15;
}

export function isVeteranDiscountConfigured() {
  return Boolean(getVeteranCouponId());
}
