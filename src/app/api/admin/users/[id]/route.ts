import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const patchSchema = z.object({
  role: z.enum(["admin", "executive", "team_lead", "member", "viewer"]).optional(),
  full_name: z.string().optional(),
  team_id: z.string().uuid().optional(),
  is_lead: z.boolean().optional(),
  remove_team_id: z.string().uuid().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { role, full_name, team_id, is_lead, remove_team_id } = parsed.data;

  if (role || full_name !== undefined) {
    const updates: Record<string, string> = {};
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name;
    const { error } = await admin.from("profiles").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (team_id) {
    const { error } = await admin.from("team_members").upsert({
      team_id,
      user_id: id,
      is_lead: is_lead ?? false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (remove_team_id) {
    await admin
      .from("team_members")
      .delete()
      .eq("team_id", remove_team_id)
      .eq("user_id", id);
  }

  return NextResponse.json({ ok: true });
}
