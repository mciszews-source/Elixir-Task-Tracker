"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ElixirHeader } from "@/components/layout/elixir-header";
import { TabBar } from "@/components/layout/tab-bar";
import type { UserRole } from "@/types/database";

interface AppShellProps {
  children: React.ReactNode;
  role?: UserRole;
  userName?: string;
  headerView?: "departments" | "projects";
}

export function AppShell({
  children,
  role,
  userName,
  headerView = "departments",
}: AppShellProps) {
  const pathname = usePathname();
  // Show the horizontal department tab bar on team pages (matches the
  // legacy prototype where tabs are the primary nav).
  const teamSlugMatch = pathname.match(/^\/teams\/([^/?#]+)/);
  const activeSlug = teamSlugMatch?.[1] ?? "";

  return (
    <div className="relative z-10 flex min-h-screen">
      <Sidebar role={role} userName={userName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <ElixirHeader view={headerView} />
        {activeSlug && <TabBar activeSlug={activeSlug} role={role ?? "member"} />}
        <main className="relative z-10 flex-1 overflow-y-auto px-8 py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
