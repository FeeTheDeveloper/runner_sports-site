import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth/access";
import { getPerformanceSummary } from "@/lib/data/performance";

export const revalidate = 0;

export async function GET() {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const summary = await getPerformanceSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Failed to load Runner performance summary", error);
    return NextResponse.json({ error: "Failed to load performance summary." }, { status: 500 });
  }
}
