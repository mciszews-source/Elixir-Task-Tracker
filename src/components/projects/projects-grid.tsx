import type { Project } from "@/types/database";

interface ProjectsGridProps {
  projects: Project[];
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-white/20 bg-white/5 px-8 py-16 text-center">
        <h3 className="font-display text-lg font-light tracking-wider text-white/70">
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
      {projects.map((project) => (
        <article
          key={project.id}
          className="glass-card rounded-[14px] p-5"
        >
          <h3 className="font-display text-base font-medium tracking-wide text-white/90">
            {project.name}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-white/40">
            {project.description || "No description"}
          </p>
          <span className="mt-4 inline-flex rounded-full border border-white/15 bg-white/8 px-2.5 py-1 font-display text-[10px] tracking-wider text-white/50 uppercase">
            {project.status.replace("_", " ")}
          </span>
        </article>
      ))}
    </div>
  );
}
