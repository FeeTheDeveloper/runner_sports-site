import { notFound, ok } from "@/lib/api/response";
import { getModels } from "@/lib/data/models";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = (await getModels()).find((item) => item.id === id);
  return model ? ok(model) : notFound("Model", id);
}
