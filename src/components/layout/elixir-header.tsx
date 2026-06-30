"use client";

import Link from "next/link";
import { format } from "date-fns";

interface ElixirHeaderProps {
  view?: "departments" | "projects";
}

export function ElixirHeader({ view = "departments" }: ElixirHeaderProps) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="relative z-20 flex items-center justify-between border-b border-white/12 px-8 py-4 glass-panel">
      <div className="font-display text-[13px] font-light tracking-[0.2em] text-white/50 uppercase">
        {today}
      </div>

      <div className="flex items-center gap-1 rounded-full border border-white/14 bg-white/8 p-1">
        <Link
          href="/teams/ceo-office"
          className={`rounded-full px-5 py-1.5 font-display text-[11px] font-bold tracking-[0.14em] transition-all ${
            view === "departments"
              ? "bg-white/90 text-[#21264C]"
              : "text-white/45 hover:text-white/75"
          }`}
        >
          DEPARTMENTS
        </Link>
        <Link
          href="/projects"
          className={`rounded-full px-5 py-1.5 font-display text-[11px] font-bold tracking-[0.14em] transition-all ${
            view === "projects"
              ? "bg-white/90 text-[#21264C]"
              : "text-white/45 hover:text-white/75"
          }`}
        >
          PROJECTS
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/reports/daily"
          className="rounded-lg border border-white/30 bg-[rgba(176,49,40,0.25)] px-3.5 py-1.5 font-display text-[10px] font-bold tracking-[0.12em] text-[rgba(255,180,175,0.9)] transition hover:bg-[rgba(176,49,40,0.4)] hover:text-white"
        >
          DAILY REPORT
        </Link>
      </div>
    </header>
  );
}
