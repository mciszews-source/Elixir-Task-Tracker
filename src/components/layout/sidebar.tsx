"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/database";
import type { UserRole } from "@/types/database";
import { canManageUsers } from "@/lib/permissions";

interface SidebarProps {
  role?: UserRole;
  userName?: string;
}

export function Sidebar({ role = "member", userName }: SidebarProps) {
  const pathname = usePathname();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const staticLinks = [
    { href: "/reports/daily", label: "Daily Report" },
    { href: "/projects", label: "Projects" },
  ];

  return (
    <aside className="relative z-20 flex w-[220px] shrink-0 flex-col border-r border-white/10 glass-panel">
      <div className="border-b border-white/10 px-5 py-6">
        <p className="font-display text-[11px] font-light tracking-[0.25em] text-white/95">
          ELIXIR MD INC
        </p>
        <p className="mt-1 font-display text-[10px] tracking-[0.2em] text-white/40 uppercase">
          Task Tracker
        </p>
        {userName && (
          <p className="mt-4 truncate text-xs text-white/50">{userName}</p>
        )}
        {role === "admin" && (
          <span className="mt-1 inline-block rounded px-2 py-0.5 font-display text-[9px] tracking-widest uppercase bg-white/15 text-white/70">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <p className="px-3 pb-2 font-display text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">
          Departments
        </p>
        <ul className="space-y-0.5">
          {teams.map((team) => {
            const href = `/teams/${team.slug}`;
            const active = pathname === href;
            return (
              <li key={team.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 font-display text-[11px] font-medium tracking-[0.14em] uppercase transition-all",
                    active
                      ? "border-l-2 border-white/85 bg-white/12 text-white"
                      : "border-l-2 border-transparent text-white/45 hover:bg-white/8 hover:text-white/80",
                  )}
                >
                  {team.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-3 pb-2 font-display text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">
          Tools
        </p>
        <ul className="space-y-0.5">
          {staticLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "block rounded-lg px-3 py-2.5 font-display text-[11px] font-medium tracking-[0.14em] uppercase transition-all",
                  pathname.startsWith(href)
                    ? "bg-white/12 text-white"
                    : "text-white/45 hover:bg-white/8 hover:text-white/80",
                )}
              >
                {label}
              </Link>
            </li>
          ))}
          {canManageUsers(role) && (
            <li>
              <Link
                href="/admin/users"
                className={cn(
                  "block rounded-lg px-3 py-2.5 font-display text-[11px] font-medium tracking-[0.14em] uppercase transition-all",
                  pathname.startsWith("/admin")
                    ? "bg-white/12 text-white"
                    : "text-white/45 hover:bg-white/8 hover:text-white/80",
                )}
              >
                Team Access
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
