import { ok } from "@/lib/api/response";
import { getTrackerSummary } from "@/lib/data/tracker";

export async function GET() {
  return ok(await getTrackerSummary());
}
