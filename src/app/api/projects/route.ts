import { NextResponse } from "next/server";
import { MOCK_PROJECTS } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: MOCK_PROJECTS });
}

export async function POST(request: Request) {
  const body = await request.json();
  // TODO: Zod validate + Supabase insert
  return NextResponse.json({ data: { ...body, id: crypto.randomUUID() } }, { status: 201 });
}
