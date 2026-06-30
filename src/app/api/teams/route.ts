import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { MOCK_DASHBOARD } from "@/lib/mock-data";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      data: MOCK_DASHBOARD.map(({ id, name, slug, color, sort_order }) => ({
        id,
        name,
        slug,
        color,
        sort_order,
      })),
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
