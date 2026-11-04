import { ok } from "@/lib/api/response";
import { getTrackerSummary } from "@/lib/data/tracker";
import { authorizeTrackerRequest } from "../auth";

export const revalidate = 0;

export async function GET() {
  const auth = await authorizeTrackerRequest();
  if (auth instanceof Response) return auth;

  return ok(await getTrackerSummary(auth.ownerId));
}
