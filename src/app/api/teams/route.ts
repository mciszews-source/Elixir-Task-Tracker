import { NextResponse } from "next/server";
import { MOCK_DASHBOARD } from "@/lib/mock-data";

export async function GET() {
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
