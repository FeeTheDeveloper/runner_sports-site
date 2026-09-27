import { NextResponse } from "next/server";
import { getRunnerAccess } from "@/lib/auth/access";

export async function GET() {
  const access = await getRunnerAccess();
  if (!access.authenticated) return NextResponse.json({ error: "Sign in to view billing." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({
    plan: access.paidPlan, entitlement: access.entitlement, expiresAt: access.expiresAt,
    source: access.source, billingState: access.billingState,
    capabilities: { research: access.fullAccess, tracker: access.fullAccess, predictionExecution: false },
    predictionModels: { state: "unavailable", reason: "No validated prediction execution service is enabled." },
    usage: { state: "not_configured", limit: null, used: null, remaining: null },
  }, { headers: { "Cache-Control": "no-store" } });
}
