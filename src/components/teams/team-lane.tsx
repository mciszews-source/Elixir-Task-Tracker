import type { TeamWithTasks } from "@/types/database";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";

interface TeamLaneProps {
  team: TeamWithTasks;
  canReorder: boolean;
  onReorder: (taskId: string, newIndex: number) => void;
  maxTasks?: number;
}

export function TeamLane({
  team,
  canReorder,
  onReorder,
  maxTasks = 5,
}: TeamLaneProps) {
  const visibleTasks = team.board_tasks.slice(0, maxTasks);

  return (
    <section className="flex min-w-[300px] flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
      <header
        className="flex items-center justify-between border-b border-slate-100 px-5 py-4"
        style={{ borderTopColor: team.color, borderTopWidth: 3 }}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{team.name}</h2>
          <p className="text-sm text-slate-500">
            {team.board_tasks.length} prioritized
          </p>
        </div>
      </header>

      <div className="flex-1 p-4">
        {visibleTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No prioritized tasks yet.</p>
        ) : (
          <SortableTaskList
            tasks={visibleTasks}
            onReorder={onReorder}
            disabled={!canReorder}
          />
        )}
      </div>
    </section>
  );
}
