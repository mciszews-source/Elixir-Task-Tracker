"use client";

import { format } from "date-fns";

interface TopBarProps {
  title: string;
  subtitle?: string;
  userName?: string;
  role?: string;
}

export function TopBar({ title, subtitle, userName, role }: TopBarProps) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="glass-panel relative z-10 flex items-center justify-between px-8 py-5">
      <div>
        <p className="font-display text-[11px] tracking-[0.22em] text-white/40 uppercase">
          {today}
        </p>
        <h1 className="font-display mt-1 text-[22px] font-light tracking-[0.16em] text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        )}
      </div>

      <div className="text-right">
        {userName && (
          <p className="text-sm font-medium text-white/85">{userName}</p>
        )}
        {role && (
          <p className="font-display mt-0.5 text-[10px] tracking-[0.2em] text-white/45 uppercase">
            {role}
          </p>
        )}
      </div>
    </header>
  );
}
