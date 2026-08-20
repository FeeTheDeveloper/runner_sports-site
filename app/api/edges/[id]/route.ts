import { notFound, ok } from "@/lib/api/response";
import { getEdges } from "@/lib/data/edges";

export const revalidate = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const edge = (await getEdges()).find((item) => item.id === id);
  return edge ? ok(edge) : notFound("Edge", id);
}
