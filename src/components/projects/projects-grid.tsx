import type { Project } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  active: "var(--elixir-green)",
  on_hold: "var(--elixir-amber)",
  archived: "var(--elixir-slate)",
  completed: "var(--elixir-blue)",
};

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-white/20 bg-white/[0.04] px-8 py-16 text-center">
        <h3 className="font-display text-lg font-light tracking-[0.12em] text-white/70">
          No projects yet
        </h3>
        <p className="mt-2 max-w-md text-sm text-white/35">
          Projects group related tasks across initiatives.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const dot = STATUS_COLORS[project.status] ?? "var(--elixir-slate)";
        return (
          <article
            key={project.id}
            className="glass-card glass-card-hover rounded-[14px] p-5 transition-all"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: dot }}
              />
              <span className="font-display text-[10px] tracking-[0.18em] text-white/45 uppercase">
                {project.status.replace("_", " ")}
              </span>
            </div>
            <h3 className="font-display mt-3 text-[15px] font-medium tracking-[0.04em] text-white/95">
              {project.name}
            </h3>
            <p className="mt-2 line-clamp-3 text-sm text-white/45">
              {project.description || "No description"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
