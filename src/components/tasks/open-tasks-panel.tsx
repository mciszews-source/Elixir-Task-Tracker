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
    <aside className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80">
      <header className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Drag onto the board to prioritize
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No open tasks right now.</p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </aside>
  );
}
