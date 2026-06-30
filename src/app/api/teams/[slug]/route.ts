import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const { slug } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Tasks cascade via FK ON DELETE CASCADE on tasks.team_id.
  const { error } = await supabase.from("teams").delete().eq("id", team.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
