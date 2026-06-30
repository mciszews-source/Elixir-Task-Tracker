"use client";

import type { TeamWithTasks } from "@/types/database";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";
import { OpenTasksPanel } from "@/components/tasks/open-tasks-panel";

export function TeamBoardClient({ team }: { team: TeamWithTasks }) {
  return (
    <div className="flex flex-1 gap-6 p-8">
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Priority board
        </h2>
        {team.board_tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks on the board yet.</p>
        ) : (
          <SortableTaskList tasks={team.board_tasks} onReorder={() => {}} />
        )}
      </div>

      <div className="w-80 shrink-0">
        <OpenTasksPanel tasks={team.open_tasks} />
      </div>
    </div>
  );
}
