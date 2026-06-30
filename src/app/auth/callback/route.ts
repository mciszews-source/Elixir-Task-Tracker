import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error(
      JSON.stringify({
        event: "auth_callback_failed",
        at: new Date().toISOString(),
        method: "exchangeCodeForSession",
        detail: error.message,
        status: error.status,
      }),
    );

    return NextResponse.redirect(
      `${origin}/login?error=auth&detail=${encodeURIComponent(error.message)}`,
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error(
      JSON.stringify({
        event: "auth_callback_failed",
        at: new Date().toISOString(),
        method: "verifyOtp",
        detail: error.message,
        status: error.status,
      }),
    );

    return NextResponse.redirect(
      `${origin}/login?error=auth&detail=${encodeURIComponent(error.message)}`,
    );
  }

  console.error(
    JSON.stringify({
      event: "auth_callback_failed",
      at: new Date().toISOString(),
      method: "missing_params",
      detail: "No code or token_hash in callback URL",
      query: searchParams.toString(),
    }),
  );

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
