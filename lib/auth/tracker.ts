import "server-only";
import { getRunnerAccess } from "@/lib/auth/access";

export class TrackerAccessError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Sign in to access your tracker." : "Tracker access requires an active Runner entitlement.");
    this.name = "TrackerAccessError";
  }
}

/** Identity comes only from the verified session, never a caller-supplied owner. */
export async function requireTrackerOwner(): Promise<string> {
  const access = await getRunnerAccess();
  if (!access.authenticated || !access.userId) throw new TrackerAccessError(401);
  if (!access.fullAccess) throw new TrackerAccessError(403);
  return access.userId;
}
