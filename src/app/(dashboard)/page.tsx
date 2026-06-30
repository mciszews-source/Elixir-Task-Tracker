import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getSessionProfile } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

export default async function DashboardPage() {
  let role: UserRole = "admin";
  let userName = "Demo User";
  let userTeamIds: string[] = [];

  if (isSupabaseConfigured()) {
    const { profile, user } = await getSessionProfile();
    if (profile) {
      role = profile.role;
      userName = profile.full_name || profile.email;
    } else if (user) {
      userName = user.email ?? "User";
      role = "viewer";
    }

    if (user) {
      const supabase = await createClient();
      const { data: memberships } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);
      userTeamIds =
        (memberships as { team_id: string }[] | null)?.map((m) => m.team_id) ??
        [];
    }
  }

  return (
    <DashboardClient
      role={role}
      userName={userName}
      userTeamIds={userTeamIds}
    />
  );
}
