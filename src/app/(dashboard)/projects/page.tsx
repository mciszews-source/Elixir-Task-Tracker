import { ProjectsGrid } from "@/components/projects/projects-grid";
import { MOCK_PROJECTS } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-light tracking-[0.18em] text-white">
        Projects
      </h1>
      <p className="mt-2 text-sm text-white/40">
        Initiative tracking — Astral X, Clear, EVA 3D and more.
      </p>
      <div className="mt-8">
        <ProjectsGrid projects={MOCK_PROJECTS} />
      </div>
    </div>
  );
}
