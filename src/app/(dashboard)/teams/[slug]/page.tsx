import { TeamTracker } from "@/components/tracker/team-tracker";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <TeamTracker
        team={{
          id: "1",
          name: slug.replace(/-/g, " "),
          slug,
          color: "#4A78C4",
          sort_order: 0,
          created_at: "",
        }}
        role="admin"
        userTeamIds={[]}
      />
    );
  }

  const session = await getSessionContext();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!team) notFound();

  return (
    <TeamTracker
      team={team}
      role={session.role}
      userTeamIds={session.teamIds}
    />
  );
}
