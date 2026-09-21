import { NextResponse, type NextRequest } from "next/server";
import { requireAdminAccess } from "@/lib/auth/access";
import { importJuiceReelCsv } from "@/lib/juice-reel/import";

export const revalidate = 0;

// Admin-only: this ingests real, historical financial records (what was
// actually risked and won on Juice Reel), never a model projection, so it
// is gated the same way as /api/admin/grants rather than exposed to
// subscribers.
export async function POST(request: NextRequest) {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Juice Reel CSV file required." }, { status: 400 });
  }

  try {
    const csvText = await file.text();
    const result = await importJuiceReelCsv(csvText, file.name);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Runner performance import failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown import error" },
      { status: 500 },
    );
  }
}
