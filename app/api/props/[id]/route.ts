import { notFound, ok } from "@/lib/api/response";
import { getProps } from "@/lib/data/props";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prop = (await getProps()).find((item) => item.id === id);
  return prop ? ok(prop) : notFound("Prop", id);
}
