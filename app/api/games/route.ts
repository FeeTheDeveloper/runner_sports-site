import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getGames } from "@/lib/data/games";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const games = (await getGames()).filter((game) =>
    filterValue(game.sport.slug, params.get("sport")) &&
    filterValue(game.league, params.get("league")) &&
    filterValue(game.status, params.get("status")),
  );
  const result = paginate(games, params);
  return ok(result.data, result.meta);
}
