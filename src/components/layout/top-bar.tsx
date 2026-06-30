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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <p className="text-sm text-slate-500">{today}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="text-right">
        {userName && (
          <p className="text-sm font-medium text-slate-900">{userName}</p>
        )}
        {role && (
          <p className="text-xs capitalize text-slate-500">{role}</p>
        )}
      </div>
    </header>
  );
}
