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
  const accent = team.color || "#4A78C4";

  return (
    <section className="glass-panel-strong flex min-w-[300px] flex-1 flex-col rounded-[14px]">
      <header
        className="flex items-center justify-between border-b border-white/10 px-5 py-4"
        style={{ borderTop: `3px solid ${accent}`, borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
      >
        <div>
          <h2 className="font-display text-base font-medium tracking-[0.06em] text-white/95">
            {team.name}
          </h2>
          <p className="font-display mt-0.5 text-[10px] tracking-[0.18em] text-white/45 uppercase">
            {team.board_tasks.length} prioritized
          </p>
        </div>
      </header>

      <div className="flex-1 p-4">
        {visibleTasks.length === 0 ? (
          <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
            No prioritized tasks yet
          </p>
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
