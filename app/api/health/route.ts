import { ok } from "@/lib/api/response";
import { getClerkConfigurationState } from "@/lib/auth/config";

// Public liveness probe. `identity` is the Clerk configuration state enum only
// (see lib/auth/config.ts); it never includes key material or hostnames.
export async function GET() {
  return ok({
    status: "ok",
    service: "runner-sports-site",
    identity: getClerkConfigurationState(),
    timestamp: new Date().toISOString(),
  });
}
