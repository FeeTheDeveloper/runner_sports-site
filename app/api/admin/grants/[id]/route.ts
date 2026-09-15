import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth/access";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("manual_access_grants")
    .update({
      active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: admin.email ?? admin.userId ?? "admin",
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to revoke access grant." }, { status: 500 });
  return NextResponse.json({ grant: data });
}
