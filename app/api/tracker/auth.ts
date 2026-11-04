import "server-only";
import { NextResponse } from "next/server";
import { getRunnerAccess } from "@/lib/auth/access";

// TRK-002 / SEC-01. The tracker API is per-user: the caller must be signed in
// and hold the same entitlement as the /tracker page. The returned ownerId is
// always the authenticated Clerk user ID — never a value from the request.
export async function authorizeTrackerRequest(): Promise<{ ownerId: string } | NextResponse> {
  const access = await getRunnerAccess();
  if (!access.authenticated || !access.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to use the bet tracker" } },
      { status: 401 },
    );
  }
  if (!access.fullAccess) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "The bet tracker requires an active Runner plan" } },
      { status: 403 },
    );
  }
  return { ownerId: access.userId };
}
