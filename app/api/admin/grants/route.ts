import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAccess } from "@/lib/auth/access";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const createGrantSchema = z.object({
  email: z.string().trim().email(),
  clerkUserId: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("manual_access_grants")
    .select("*")
    .order("granted_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load access grants." }, { status: 500 });
  return NextResponse.json({ grants: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdminAccess();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createGrantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid email and optional grant details." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("manual_access_grants")
    .insert({
      email: parsed.data.email.toLowerCase(),
      clerk_user_id: parsed.data.clerkUserId ?? null,
      reason: parsed.data.reason ?? null,
      notes: parsed.data.notes ?? null,
      expires_at: parsed.data.expiresAt ?? null,
      granted_by: admin.email ?? admin.userId ?? "admin",
      active: true,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create access grant." }, { status: 500 });
  return NextResponse.json({ grant: data }, { status: 201 });
}
