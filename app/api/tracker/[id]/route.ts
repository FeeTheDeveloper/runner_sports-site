import { notFound, ok } from "@/lib/api/response";
import { getTrackedBet } from "@/lib/data/tracker";
import { authorizeTrackerRequest } from "../auth";

export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeTrackerRequest();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  // Owner-scoped lookup: another user's bet ID returns 404, not their data.
  const bet = await getTrackedBet(auth.ownerId, id);
  return bet ? ok(bet) : notFound("Tracked bet", id);
}
