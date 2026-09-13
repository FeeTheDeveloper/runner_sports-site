import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth/access";
import { isClerkConfigured } from "@/lib/auth/config";

export async function GET(request: Request) {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isClerkConfigured()) return NextResponse.json({ error: "Clerk is not configured." }, { status: 503 });

  const email = new URL(request.url).searchParams.get("email")?.trim();
  if (!email) return NextResponse.json({ error: "Provide an email to search for." }, { status: 400 });

  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({ emailAddress: [email] });

  const users = data.map((user) => ({
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
    fullName: user.fullName,
    subscriptionStatus: (user.privateMetadata as Record<string, unknown>).subscriptionStatus ?? null,
    runnerPlan: (user.privateMetadata as Record<string, unknown>).runnerPlan ?? null,
    role: (user.privateMetadata as Record<string, unknown>).role ?? null,
  }));

  return NextResponse.json({ users });
}
