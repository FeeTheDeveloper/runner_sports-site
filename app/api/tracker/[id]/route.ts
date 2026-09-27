import { notFound, ok } from "@/lib/api/response";
import { getTrackedBets } from "@/lib/data/tracker";
import { trackerResponse } from "@/lib/api/trackerResponse";

export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return trackerResponse(async () => {
    const { id } = await params;
    const bet = (await getTrackedBets()).find((item) => item.id === id);
    return bet ? ok(bet) : notFound("Tracked bet", id);
  });
}
