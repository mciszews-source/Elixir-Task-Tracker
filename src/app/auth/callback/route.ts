import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  createRouteHandlerClient,
  resolveRedirectOrigin,
} from "@/lib/supabase/route-handler";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  // Magic-link / OTP emails carry token_hash + type. If a template omits type,
  // default to "email" so verifyOtp still runs instead of falling through to
  // the "missing params" error and bouncing the user back to /login.
  const type = searchParams.get("type") ?? "email";
  const next = safeNextPath(
    searchParams.get("next") ?? searchParams.get("redirect"),
  );
  const origin = resolveRedirectOrigin(request);

  const successUrl = new URL(next, origin);
  let response = NextResponse.redirect(successUrl);
  const supabase = createRouteHandlerClient(request, response);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.info(
        JSON.stringify({
          event: "auth_callback_success",
          at: new Date().toISOString(),
          method: "exchangeCodeForSession",
          redirectTo: successUrl.toString(),
        }),
      );
      return response;
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

    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "auth");
    errorUrl.searchParams.set("detail", error.message);
    return NextResponse.redirect(errorUrl);
  }

  if (tokenHash) {
    response = NextResponse.redirect(successUrl);
    const otpSupabase = createRouteHandlerClient(request, response);
    const { error } = await otpSupabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      console.info(
        JSON.stringify({
          event: "auth_callback_success",
          at: new Date().toISOString(),
          method: "verifyOtp",
          redirectTo: successUrl.toString(),
        }),
      );
      return response;
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

    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "auth");
    errorUrl.searchParams.set("detail", error.message);
    return NextResponse.redirect(errorUrl);
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

  const errorUrl = new URL("/login", origin);
  errorUrl.searchParams.set("error", "auth");
  errorUrl.searchParams.set(
    "detail",
    "Magic link was missing auth parameters. Request a new link and click it promptly.",
  );
  return NextResponse.redirect(errorUrl);
}
