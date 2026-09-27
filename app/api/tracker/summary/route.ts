import { ok } from "@/lib/api/response";
import { getTrackerSummary } from "@/lib/data/tracker";
import { trackerResponse } from "@/lib/api/trackerResponse";

export const revalidate = 0;

export async function GET() {
  return trackerResponse(async () => ok(await getTrackerSummary()));
}
