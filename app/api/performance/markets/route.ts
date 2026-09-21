import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth/access";
import { getMarketTypePerformance } from "@/lib/data/performance";

export const revalidate = 0;

export async function GET() {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const markets = await getMarketTypePerformance();
    return NextResponse.json({ data: markets });
  } catch (error) {
    console.error("Failed to load Runner market-type performance", error);
    return NextResponse.json({ error: "Failed to load market performance." }, { status: 500 });
  }
}
