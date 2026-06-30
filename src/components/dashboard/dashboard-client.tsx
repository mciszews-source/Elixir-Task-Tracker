"use client";

import { TaskBoard } from "@/components/tasks/task-board";
import { OpenTasksPanel } from "@/components/tasks/open-tasks-panel";
import { TopBar } from "@/components/layout/top-bar";
import { MOCK_DASHBOARD } from "@/lib/mock-data";
import { canReprioritizeCrossTeam } from "@/lib/permissions";
import type { UserRole } from "@/types/database";

interface DashboardClientProps {
  role?: UserRole;
}

export function DashboardClient({ role = "admin" }: DashboardClientProps) {
  const allOpenTasks = MOCK_DASHBOARD.flatMap((team) => team.open_tasks);

  function canReorderTeam(teamId: string) {
    if (canReprioritizeCrossTeam(role)) return true;
    // Team leads would check membership here
    return false;
  }

  function handleReorder(_teamId: string, _taskId: string, _newIndex: number) {
    // Wire to POST /api/tasks/reorder with optimistic update
    console.info("Reorder requested", { _teamId, _taskId, _newIndex });
  }

  return (
    <>
      <TopBar
        title="Cross-team dashboard"
        subtitle="Prioritized work across all departments"
        userName="Demo User"
        role={role}
      />

      <div className="flex flex-1 gap-6 p-8">
        <div className="min-w-0 flex-1">
          <TaskBoard
            teams={MOCK_DASHBOARD}
            canReorderTeam={canReorderTeam}
            onReorder={handleReorder}
          />
        </div>

        <div className="hidden w-80 shrink-0 xl:block">
          <OpenTasksPanel tasks={allOpenTasks} />
        </div>
      </div>
    </>
  );
}
