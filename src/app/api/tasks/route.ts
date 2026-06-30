import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canCreateTask } from "@/lib/permissions";

const createSchema = z.object({
  team_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  due_date: z.string().optional().nullable(),
  is_on_board: z.boolean().optional(),
  is_executive_request: z.boolean().optional(),
  assignee_id: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canCreateTask(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...parsed.data,
      status: "open",
      priority: parsed.data.priority ?? "medium",
      is_on_board: parsed.data.is_on_board ?? true,
      created_by: session.userId,
      sort_order: Date.now(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
