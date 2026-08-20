import { notFound, ok } from "@/lib/api/response";
import { getMarketSignals } from "@/lib/data/signals";

export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = (await getMarketSignals()).find((item) => item.id === id);
  return signal ? ok(signal) : notFound("Market signal", id);
}
