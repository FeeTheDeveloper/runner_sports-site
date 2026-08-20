import { notFound, ok } from "@/lib/api/response";
import { getMarketMovements } from "@/lib/data/markets";

export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movement = (await getMarketMovements()).find((item) => item.id === id);
  return movement ? ok(movement) : notFound("Market movement", id);
}
