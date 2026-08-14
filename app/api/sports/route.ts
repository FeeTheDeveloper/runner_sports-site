import { ok } from "@/lib/api/response";
import { sports } from "@/lib/data/sports";

export async function GET() {
  return ok(sports, { total: sports.length });
}
