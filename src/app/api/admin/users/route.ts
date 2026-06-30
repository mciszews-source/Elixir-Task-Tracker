import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id, user_id, is_lead, teams(id, name, slug)");

  const users = (profiles ?? []).map((p) => ({
    ...p,
    teams: (memberships ?? [])
      .filter((m: { user_id: string }) => m.user_id === p.id)
      .map((m: { teams: unknown; is_lead: boolean; team_id: string }) => ({
        team_id: m.team_id,
        is_lead: m.is_lead,
        team: m.teams,
      })),
  }));

  const { data: teams } = await supabase.from("teams").select("*").order("sort_order");

  return NextResponse.json({ data: { users, teams: teams ?? [] } });
}
