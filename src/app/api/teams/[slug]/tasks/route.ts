import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import type { TaskWithRelations } from "@/types/database";

const TASK_SELECT = `
  *,
  team:teams(id, name, slug, color, sort_order, created_at),
  assignee:profiles!assignee_id(id, full_name, email)
`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("team_id", team.id)
    .order("sort_order", { ascending: true });

  const all = (tasks ?? []) as TaskWithRelations[];
  const active = all.filter((t) => t.status !== "done");
  const done = all.filter((t) => t.status === "done");

  return NextResponse.json({ data: { team, active, done } });
}
