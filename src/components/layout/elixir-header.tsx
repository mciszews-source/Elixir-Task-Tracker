"use client";

import Link from "next/link";
import { format } from "date-fns";

interface ElixirHeaderProps {
  view?: "departments" | "projects";
}

export function ElixirHeader({ view = "departments" }: ElixirHeaderProps) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="glass-panel relative z-20 flex items-center justify-between px-8 py-4">
      <div className="font-display text-[12px] font-light tracking-[0.22em] text-white/55 uppercase">
        {today}
      </div>

      <div className="elixir-segment">
        <Link
          href="/teams/ceo-office"
          data-active={view === "departments"}
        >
          Departments
        </Link>
        <Link href="/projects" data-active={view === "projects"}>
          Projects
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/reports/daily" className="elixir-btn">
          Daily Report
        </Link>
      </div>
    </header>
  );
}
