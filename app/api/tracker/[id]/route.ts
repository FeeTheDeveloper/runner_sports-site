import { notFound, ok } from "@/lib/api/response";
import { getTrackedBets } from "@/lib/data/tracker";

export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bet = (await getTrackedBets()).find((item) => item.id === id);
  return bet ? ok(bet) : notFound("Tracked bet", id);
}
