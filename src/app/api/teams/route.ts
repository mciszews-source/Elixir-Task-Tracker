import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { MOCK_DASHBOARD } from "@/lib/mock-data";
import { requireAdmin } from "@/lib/auth/require-admin";

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

const createTeamSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().optional(),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const baseSlug = slugify(parsed.data.name);
  if (!baseSlug) {
    return NextResponse.json(
      { error: "Name must contain at least one letter or number" },
      { status: 400 },
    );
  }

  // Ensure unique slug.
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const { data: existing } = await supabase
      .from("teams")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}_${i}`;
  }

  // Append to end (max sort_order + 1).
  const { data: maxRow } = await supabase
    .from("teams")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: parsed.data.name.trim(),
      slug,
      color: parsed.data.color ?? "#4A78C4",
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
