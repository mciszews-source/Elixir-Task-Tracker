import { NextResponse } from "next/server";
import { z } from "zod";
import { computeSortOrderBetween } from "@/lib/utils";

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

  // TODO: Validate admin for cross-team (target_team_id !== team_id)
  // TODO: Persist via Supabase + activity_log

  return NextResponse.json({
    data: {
      task_id,
      team_id: target_team_id ?? team_id,
      sort_order: sortOrder,
    },
  });
}
