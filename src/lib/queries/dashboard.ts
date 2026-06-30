import type {
  DailyReportData,
  TaskWithRelations,
  TeamWithTasks,
  UserRole,
} from "@/types/database";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  MOCK_COMPLETED_TODAY,
  MOCK_DASHBOARD,
  MOCK_TOP_TOMORROW,
} from "@/lib/mock-data";

const TASK_SELECT = `
  *,
  team:teams(id, name, slug, color, sort_order, created_at),
  assignee:profiles!assignee_id(id, full_name, email),
  project:projects(id, name)
`;

export async function fetchDashboardData(): Promise<{
  teams: TeamWithTasks[];
  generated_at: string;
}> {
  if (!isSupabaseConfigured()) {
    return { teams: MOCK_DASHBOARD, generated_at: new Date().toISOString() };
  }

  const supabase = await createClient();

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  if (teamsError || !teams?.length) {
    return { teams: MOCK_DASHBOARD, generated_at: new Date().toISOString() };
  }

  const teamsWithTasks: TeamWithTasks[] = await Promise.all(
    teams.map(async (team) => {
      const { data: boardTasks } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("team_id", team.id)
        .eq("is_on_board", true)
        .neq("status", "done")
        .order("sort_order", { ascending: true })
        .limit(10);

      const { data: openTasks } = await supabase
        .from("tasks")
        .select(TASK_SELECT)
        .eq("team_id", team.id)
        .eq("is_on_board", false)
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(20);

      return {
        ...team,
        board_tasks: (boardTasks ?? []) as TaskWithRelations[],
        open_tasks: (openTasks ?? []) as TaskWithRelations[],
      };
    }),
  );

  return {
    teams: teamsWithTasks,
    generated_at: new Date().toISOString(),
  };
}

export async function fetchDailyReport(date: string): Promise<DailyReportData> {
  const timezone = process.env.NEXT_PUBLIC_TIMEZONE ?? "America/New_York";

  if (!isSupabaseConfigured()) {
    return {
      date,
      timezone,
      completed_today: MOCK_COMPLETED_TODAY,
      top_tomorrow: MOCK_TOP_TOMORROW,
    };
  }

  const supabase = await createClient();

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59.999`;

  const { data: completedToday } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("status", "done")
    .gte("completed_at", dayStart)
    .lte("completed_at", dayEnd)
    .order("completed_at", { ascending: false });

  const { data: topTomorrow } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("is_on_board", true)
    .neq("status", "done")
    .order("sort_order", { ascending: true })
    .limit(10);

  return {
    date,
    timezone,
    completed_today: (completedToday ?? []) as TaskWithRelations[],
    top_tomorrow: (topTomorrow ?? []) as TaskWithRelations[],
  };
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  if (!isSupabaseConfigured()) return "admin";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as UserRole) ?? null;
}
