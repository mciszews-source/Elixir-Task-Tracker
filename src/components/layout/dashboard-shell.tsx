"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import type { UserRole } from "@/types/database";

export function DashboardShell({
  children,
  role,
  userName,
}: {
  children: React.ReactNode;
  role?: UserRole;
  userName?: string;
}) {
  const pathname = usePathname();
  const headerView = pathname.startsWith("/projects") ? "projects" : "departments";

  return (
    <AppShell role={role} userName={userName} headerView={headerView}>
      {children}
    </AppShell>
  );
}
