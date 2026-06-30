import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    redirect("/teams/ceo-office");
  }

  const supabase = await createClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("slug")
    .order("sort_order")
    .limit(1);

  const slug = teams?.[0]?.slug ?? "ceo-office";
  redirect(`/teams/${slug}`);
}
