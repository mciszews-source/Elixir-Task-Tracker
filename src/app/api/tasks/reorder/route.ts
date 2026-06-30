import { NextResponse } from "next/server";
import { z } from "zod";
import { computeSortOrderBetween } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  canReprioritizeCrossTeam,
  canReprioritizeTeam,
} from "@/lib/permissions";
import type { Task, UserRole } from "@/types/database";

const reorderSchema = z.object({
  team_id: z.string().uuid(),
  task_id: z.string().uuid(),
  new_sort_order: z.number().optional(),
  neighbor_before: z.number().optional(),
  neighbor_after: z.number().optional(),
  target_team_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { neighbor_before, neighbor_after, task_id, team_id, target_team_id } =
    parsed.data;

  const sortOrder =
    parsed.data.new_sort_order ??
    computeSortOrderBetween(neighbor_before, neighbor_after);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      data: {
        task_id,
        team_id: target_team_id ?? team_id,
        sort_order: sortOrder,
      },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = ((profileRow as { role: UserRole } | null)?.role) ?? "viewer";

  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);

  const userTeamIds =
    (teamMemberships as { team_id: string }[] | null)?.map((m) => m.team_id) ??
    [];
  const destinationTeamId = target_team_id ?? team_id;
  const isCrossTeam = destinationTeamId !== team_id;

  if (isCrossTeam && !canReprioritizeCrossTeam(role)) {
    return NextResponse.json(
      { error: "Only admins can move tasks across teams" },
      { status: 403 },
    );
  }

  if (
    !canReprioritizeTeam(role, userTeamIds, destinationTeamId) &&
    !canReprioritizeCrossTeam(role)
  ) {
    return NextResponse.json(
      { error: "Insufficient permissions to reorder this team" },
      { status: 403 },
    );
  }

  const { data: existingTask } = await supabase
    .from("tasks")
    .select("sort_order, team_id")
    .eq("id", task_id)
    .single();

  const prior = existingTask as { sort_order: number; team_id: string } | null;

  const updates: Partial<Task> = {
    sort_order: sortOrder,
    is_on_board: true,
  };

  if (isCrossTeam) {
    updates.team_id = destinationTeamId;
  }

  const { data: updatedTask, error: updateError } = await supabase
    .from("tasks")
    .update(updates as never)
    .eq("id", task_id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("activity_log").insert({
    task_id,
    actor_id: user.id,
    action: isCrossTeam ? "moved_and_reordered" : "reordered",
    metadata: {
      from_team_id: prior?.team_id ?? team_id,
      to_team_id: destinationTeamId,
      old_sort_order: prior?.sort_order,
      new_sort_order: sortOrder,
    },
  } as never);

  return NextResponse.json({
    data: updatedTask,
  });
}
