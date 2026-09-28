/**
 * The Runner owner identity.
 *
 * Exactly one account is the owner. That account holds permanent, non-expiring
 * full access that no billing state, lapsed subscription or expired grant can
 * revoke, and it is the only account that carries the exclusive owner badge.
 *
 * The address is configured through RUNNER_OWNER_EMAIL rather than hardcoded so
 * the repository never carries a personal address. A comma list is rejected on
 * purpose: a second value would defeat the "this account only" guarantee, and
 * the safe failure for an ambiguous configuration is no owner at all.
 */

export const OWNER_BADGE = {
  /** Stable identifier for the one exclusive badge in the product. */
  id: "runner-owner",
  /** Short form used inside chrome and compact rows. */
  label: "Owner",
  /** Full form used on the account page. */
  title: "Runner Owner",
  description: "Permanent, unrestricted access to every Runner surface.",
} as const;

export type OwnerConfigurationState = "unset" | "invalid" | "ambiguous" | "configured";

// Deliberately rejects commas and whitespace so a list can never pass as one address.
const OWNER_EMAIL_PATTERN = /^[^\s@,]+@[^\s@,]+\.[^\s@,]{2,}$/;

type OwnerEnvironment = Record<string, string | undefined>;

/** Never returns the address itself, so it is safe to surface in diagnostics. */
export function getOwnerConfigurationState(env: OwnerEnvironment = process.env): OwnerConfigurationState {
  const raw = env.RUNNER_OWNER_EMAIL?.trim();
  if (!raw) return "unset";
  const entries = raw.split(",").map((entry) => entry.trim()).filter(Boolean);
  if (entries.length !== 1) return "ambiguous";
  if (!OWNER_EMAIL_PATTERN.test(entries[0])) return "invalid";
  return "configured";
}

/** The configured owner address, lowercased, or null when not usable. */
export function getOwnerEmail(env: OwnerEnvironment = process.env): string | null {
  if (getOwnerConfigurationState(env) !== "configured") return null;
  return (env.RUNNER_OWNER_EMAIL as string).trim().toLowerCase();
}

/**
 * True only for the one configured owner address.
 *
 * Callers must pass a *verified* address. An unverified address would let any
 * account claim ownership by typing it into a profile field.
 */
export function isOwnerEmail(email: string | null | undefined, env: OwnerEnvironment = process.env): boolean {
  const owner = getOwnerEmail(env);
  if (!owner || !email) return false;
  return email.trim().toLowerCase() === owner;
}
