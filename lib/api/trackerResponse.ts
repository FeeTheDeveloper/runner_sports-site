import "server-only";
import { NextResponse } from "next/server";
import { requireTrackerOwner, TrackerAccessError } from "@/lib/auth/tracker";

export async function trackerResponse(action: () => Promise<Response>): Promise<Response> {
  try {
    await requireTrackerOwner();
    return await action();
  } catch (error) {
    const status = error instanceof TrackerAccessError ? error.status : 503;
    return NextResponse.json({ error: {
      code: status === 401 ? "UNAUTHENTICATED" : status === 403 ? "FORBIDDEN" : "TRACKER_UNAVAILABLE",
      message: error instanceof TrackerAccessError ? error.message : "Tracker data is temporarily unavailable.",
    } }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
