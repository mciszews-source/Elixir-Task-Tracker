import type { TaskWithRelations } from "@/types/database";
import { TaskCard } from "@/components/tasks/task-card";

interface OpenTasksPanelProps {
  tasks: TaskWithRelations[];
  title?: string;
}

export function OpenTasksPanel({
  tasks,
  title = "Open tasks",
}: OpenTasksPanelProps) {
  return (
    <aside className="glass-panel-strong flex h-full flex-col rounded-[14px]">
      <header className="border-b border-white/10 px-5 py-4">
        <h2 className="font-display text-[11px] font-bold tracking-[0.22em] text-white/55 uppercase">
          {title}
        </h2>
        <p className="mt-1 text-[11px] text-white/40">
          Drag onto the board to prioritize
        </p>
      </header>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {tasks.length === 0 ? (
          <p className="font-display text-[12px] tracking-widest text-white/30 uppercase">
            No open tasks
          </p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </aside>
  );
}
