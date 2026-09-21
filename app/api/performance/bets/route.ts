import { NextResponse, type NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/auth/access";
import { filterValue, paginate } from "@/lib/api/response";
import { getRunnerBets } from "@/lib/data/performance";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const sportsbook = params.get("sportsbook");
  const result = params.get("result");

  try {
    const bets = (await getRunnerBets()).filter(
      (bet) => filterValue(bet.sportsbook, sportsbook) && filterValue(bet.betResult ?? "", result),
    );
    const paged = paginate(bets, params);
    return NextResponse.json({ data: paged.data, meta: paged.meta });
  } catch (error) {
    console.error("Failed to load Runner bets", error);
    return NextResponse.json({ error: "Failed to load bets." }, { status: 500 });
  }
}
