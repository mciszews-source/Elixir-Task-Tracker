import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";

export interface SessionContext {
  userId: string;
  email: string;
  profile: Profile;
  role: UserRole;
  teamIds: string[];
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: memberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
    role: profile.role as UserRole,
    teamIds: (memberships ?? []).map((m: { team_id: string }) => m.team_id),
  };
}
