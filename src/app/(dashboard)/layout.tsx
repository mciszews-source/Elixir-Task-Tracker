import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSessionContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let role: UserRole = "admin";
  let userName = "Demo";

  if (isSupabaseConfigured()) {
    const session = await getSessionContext();
    if (!session) redirect("/login");
    role = session.role;
    userName = session.profile.full_name || session.email;
  }

  return (
    <DashboardShell role={role} userName={userName}>
      {children}
    </DashboardShell>
  );
}
