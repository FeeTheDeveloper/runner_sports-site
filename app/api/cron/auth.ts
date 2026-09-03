import { NextResponse, type NextRequest } from "next/server";

// Vercel Cron invokes these paths with GET and automatically attaches an
// Authorization header carrying CRON_SECRET as a bearer token; POST is also
// supported for manual triggering (e.g. `curl -X POST` while testing
// locally). Returns a ready error response when the request is not
// authorized, or null when it is.
export function authorizeCronRequest(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: { code: "CONFIG", message: "CRON_SECRET is not set" } }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== "Bearer " + cronSecret) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing bearer token" } },
      { status: 401 },
    );
  }

  return null;
}
