import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().optional(),
  role: z.enum(["admin", "executive", "team_lead", "member", "viewer"]).default("member"),
  team_id: z.string().uuid().optional(),
  is_lead: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, full_name, role, team_id, is_lead } = parsed.data;
  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
      data: { full_name: full_name ?? email.split("@")[0] },
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const userId = inviteData.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Invite failed" }, { status: 500 });
  }

  await admin.from("profiles").update({ role, full_name: full_name ?? "" }).eq("id", userId);

  if (team_id) {
    await admin.from("team_members").upsert({
      team_id,
      user_id: userId,
      is_lead: is_lead ?? false,
    });
  }

  return NextResponse.json({ data: { id: userId, email, role } }, { status: 201 });
}
