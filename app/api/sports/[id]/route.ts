import { notFound, ok } from "@/lib/api/response";
import { sports } from "@/lib/data/sports";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sport = sports.find((item) => item.id === id || item.slug === id);
  return sport ? ok(sport) : notFound("Sport", id);
}
