"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/database";
import type { UserRole } from "@/types/database";
import { canManageUsers } from "@/lib/permissions";
import { ElixirLogo } from "@/components/ui/elixir-logo";

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

  const itemBase =
    "group relative flex items-center justify-between rounded-lg px-3 py-2 font-display text-[11px] font-medium tracking-[0.16em] uppercase transition-all";
  const itemActive = "bg-white/[0.10] text-white";
  const itemIdle =
    "text-white/45 hover:bg-white/[0.06] hover:text-white/85";

  return (
    <aside className="glass-panel relative z-20 flex w-[224px] shrink-0 flex-col border-r border-white/10">
      <div className="border-b border-white/10 px-5 py-6">
        <ElixirLogo size={64} />
        <p className="font-display mt-3 text-[11px] font-light tracking-[0.28em] text-white/95">
          ELIXIR MD INC
        </p>
        <p className="font-display mt-1 text-[10px] tracking-[0.22em] text-white/40 uppercase">
          Task Tracker
        </p>
        {userName && (
          <p className="mt-5 truncate text-[12px] text-white/55">{userName}</p>
        )}
        {role === "admin" && (
          <span className="font-display mt-1.5 inline-block rounded-[4px] border border-white/15 bg-white/[0.10] px-2 py-[2px] text-[9px] tracking-[0.18em] text-white/70 uppercase">
            Admin
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        <p className="font-display px-3 pb-2 text-[9px] font-bold tracking-[0.22em] text-white/30 uppercase">
          Departments
        </p>
        <ul className="space-y-[2px]">
          {teams.map((team) => {
            const href = `/teams/${team.slug}`;
            const active = pathname === href;
            return (
              <li key={team.id}>
                <Link
                  href={href}
                  className={cn(itemBase, active ? itemActive : itemIdle)}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute top-1 bottom-1 left-0 w-[2px] rounded-full bg-white/85"
                    />
                  )}
                  <span className="pl-1">{team.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="font-display mt-7 px-3 pb-2 text-[9px] font-bold tracking-[0.22em] text-white/30 uppercase">
          Tools
        </p>
        <ul className="space-y-[2px]">
          {staticLinks.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(itemBase, active ? itemActive : itemIdle)}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute top-1 bottom-1 left-0 w-[2px] rounded-full bg-white/85"
                    />
                  )}
                  <span className="pl-1">{label}</span>
                </Link>
              </li>
            );
          })}
          {canManageUsers(role) && (
            <li>
              <Link
                href="/admin/users"
                className={cn(
                  itemBase,
                  pathname.startsWith("/admin") ? itemActive : itemIdle,
                )}
              >
                {pathname.startsWith("/admin") && (
                  <span
                    aria-hidden
                    className="absolute top-1 bottom-1 left-0 w-[2px] rounded-full bg-white/85"
                  />
                )}
                <span className="pl-1">Team Access</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="font-display text-[9px] tracking-[0.22em] text-white/25 uppercase">
          v1 · executive build
        </p>
      </div>
    </aside>
  );
}
