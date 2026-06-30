"use client";

import type { TeamWithTasks } from "@/types/database";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";
import { OpenTasksPanel } from "@/components/tasks/open-tasks-panel";

export function TeamBoardClient({ team }: { team: TeamWithTasks }) {
  return (
    <div className="flex flex-1 gap-6 p-8">
      <div className="glass-panel-strong min-w-0 flex-1 rounded-[14px] p-6">
        <h2 className="font-display mb-4 text-[11px] font-bold tracking-[0.22em] text-white/55 uppercase">
          Priority board
        </h2>
        {team.board_tasks.length === 0 ? (
          <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
            No tasks on the board yet
          </p>
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
