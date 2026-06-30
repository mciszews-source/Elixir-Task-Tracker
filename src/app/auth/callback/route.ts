import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error(
      JSON.stringify({
        event: "auth_callback_failed",
        at: new Date().toISOString(),
        detail: error.message,
        status: error.status,
      }),
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
