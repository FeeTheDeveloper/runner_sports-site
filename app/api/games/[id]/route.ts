import { notFound, ok } from "@/lib/api/response";
import { getGameById } from "@/lib/data/games";
import { getPropsByGame } from "@/lib/data/props";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) return notFound("Game", id);
  return ok({ ...game, props: await getPropsByGame(id) });
}
