"use client";

import { TaskBoard } from "@/components/tasks/task-board";
import { OpenTasksPanel } from "@/components/tasks/open-tasks-panel";
import { TopBar } from "@/components/layout/top-bar";
import { useDashboard, useReorderTasks } from "@/hooks/use-tasks";
import { canReprioritizeCrossTeam, canReprioritizeTeam } from "@/lib/permissions";
import type { UserRole } from "@/types/database";

interface DashboardClientProps {
  role?: UserRole;
  userName?: string;
  userTeamIds?: string[];
}

export function DashboardClient({
  role = "admin",
  userName = "Demo User",
  userTeamIds = [],
}: DashboardClientProps) {
  const { data, isLoading } = useDashboard();
  const reorder = useReorderTasks();

  const teams = data?.teams ?? [];
  const allOpenTasks = teams.flatMap((team) => team.open_tasks);

  function canReorderTeam(teamId: string) {
    if (canReprioritizeCrossTeam(role)) return true;
    return canReprioritizeTeam(role, userTeamIds, teamId);
  }

  function handleReorder(teamId: string, taskId: string, newIndex: number) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const tasks = [...team.board_tasks];
    const oldIndex = tasks.findIndex((t) => t.id === taskId);
    if (oldIndex === -1) return;

    const [moved] = tasks.splice(oldIndex, 1);
    tasks.splice(newIndex, 0, moved);

    const neighborBefore = tasks[newIndex - 1]?.sort_order;
    const neighborAfter = tasks[newIndex + 1]?.sort_order;

    reorder.mutate({
      team_id: teamId,
      task_id: taskId,
      neighbor_before: neighborBefore,
      neighbor_after: neighborAfter,
    });
  }

  return (
    <>
      <TopBar
        title="Cross-team dashboard"
        subtitle={
          isLoading
            ? "Loading tasks…"
            : "Prioritized work across all departments"
        }
        userName={userName}
        role={role}
      />

      <div className="flex flex-1 gap-6 p-8">
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
              Loading dashboard…
            </p>
          ) : (
            <TaskBoard
              teams={teams}
              canReorderTeam={canReorderTeam}
              onReorder={handleReorder}
            />
          )}
        </div>

        <div className="hidden w-80 shrink-0 xl:block">
          <OpenTasksPanel tasks={allOpenTasks} />
        </div>
      </div>
    </>
  );
}
