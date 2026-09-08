import { ok } from "@/lib/api/response";
import { getRunnerStatus } from "@/lib/data/runner";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(await getRunnerStatus());
}
