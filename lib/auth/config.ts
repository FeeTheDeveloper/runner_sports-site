type ClerkEnvironment = Record<string, string | undefined>;

export type ClerkConfigurationState = "missing" | "unverified_instance" | "invalid_keys" | "instance_mismatch" | "mode_mismatch" | "configured";

// Works in both the server and Edge middleware. Never return key material.
export function getClerkConfigurationState(env: ClerkEnvironment = process.env): ClerkConfigurationState {
  const publishable = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const secret = env.CLERK_SECRET_KEY?.trim();
  if (!publishable || !secret) return "missing";
  const expected = env.CLERK_EXPECTED_FRONTEND_API?.trim().toLowerCase();
  if (!expected || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(expected)) return "unverified_instance";
  const publicMatch = /^pk_(test|live)_([A-Za-z0-9+/=]+)$/.exec(publishable);
  const secretMatch = /^sk_(test|live)_[A-Za-z0-9_-]+$/.exec(secret);
  if (!publicMatch || !secretMatch) return "invalid_keys";
  if (publicMatch[1] !== secretMatch[1]) return "mode_mismatch";
  try {
    const decoded = atob(publicMatch[2]);
    if (!decoded.endsWith("$")) return "invalid_keys";
    if (decoded.slice(0, -1).toLowerCase() !== expected) return "instance_mismatch";
  } catch { return "invalid_keys"; }
  return "configured";
}

export function isClerkConfigured() {
  return getClerkConfigurationState() === "configured";
}
