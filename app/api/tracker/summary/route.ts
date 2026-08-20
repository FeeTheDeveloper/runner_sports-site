import { ok } from "@/lib/api/response";
import { getTrackerSummary } from "@/lib/data/tracker";

export const revalidate = 0;

export async function GET() {
  return ok(await getTrackerSummary());
}
